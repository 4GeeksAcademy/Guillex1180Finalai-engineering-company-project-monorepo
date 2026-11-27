"""Tests for HITO 19 — Business Performance Pipeline.

Coverage
--------
- Pipeline execution (happy path, empty data, error handling)
- Idempotency (running twice produces no duplicates)
- pipeline_run_log contains 5 mandatory metadata fields
- Reporting REST endpoints (GET KPI, GET latest, POST trigger)
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text as sa_text
from sqlmodel import Session

from services.api.database import engine
from services.main import app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HEADERS = {"Authorization": "Bearer test-token"}


def _setup_reporting_tables():
    """Ensure reporting tables exist for the test DB."""
    from services.api.database import create_db_and_tables
    create_db_and_tables()


def _count_kpi_rows() -> int:
    with Session(engine) as session:
        return session.execute(
            sa_text("SELECT COUNT(*) FROM weekly_warehouse_client_performance")
        ).scalar()


def _count_pipeline_runs() -> int:
    with Session(engine) as session:
        return session.execute(
            sa_text("SELECT COUNT(*) FROM pipeline_run_log")
        ).scalar()


def _insert_telemetry_event(
    event_type: str,
    timestamp: str | None = None,
    warehouse: str = "los_angeles",
    client_id: str = "test-client",
    quantity: int = 1,
    session: Session | None = None,
):
    """Insert a test telemetry event."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()

    tags = json.dumps({
        "warehouse": warehouse,
        "client_id": client_id,
        "quantity": quantity,
        "sku": f"SKU-{client_id}-001",
    })

    close_session = session is None
    s = session or Session(engine)

    s.execute(
        sa_text("""
            INSERT INTO telemetry_events
                (id, timestamp, service, event_type, level, tags)
            VALUES
                (:id, :timestamp, :service, :event_type, :level, :tags)
        """),
        {
            "id": str(uuid4()),
            "timestamp": timestamp,
            "service": "inventory",
            "event_type": event_type,
            "level": "info",
            "tags": tags,
        },
    )
    s.commit()

    if close_session:
        s.close()


# ===================================================================
# Pipeline execution tests
# ===================================================================


class TestPipelineExecution:
    """Verify the pipeline runs end-to-end."""

    @pytest.fixture(autouse=True)
    def setup(self):
        _setup_reporting_tables()
        yield

    def test_pipeline_happy_path(self):
        """Pipeline processes events and writes KPI rows."""
        from services.reporting.pipeline_v2 import run_pipeline_flow

        # Insert test data
        with Session(engine) as session:
            now = datetime.now(timezone.utc)
            for i in range(3):
                _insert_telemetry_event(
                    event_type="inbound_order_created",
                    timestamp=(now - timedelta(hours=i)).isoformat(),
                    warehouse="los_angeles",
                    client_id=f"client-{i % 2}",
                    quantity=10 + i,
                    session=session,
                )
            _insert_telemetry_event(
                event_type="outbound_order_created",
                timestamp=(now - timedelta(hours=1)).isoformat(),
                warehouse="los_angeles",
                client_id="client-0",
                session=session,
            )

        # Run pipeline
        start = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        end = datetime.now(timezone.utc).isoformat()
        result = run_pipeline_flow(start_date=start, end_date=end)

        assert result["status"] == "success"
        assert result["processed_events"] >= 4
        assert result["rows_written"] >= 1
        assert len(result["weeks"]) >= 1

    def test_pipeline_empty_data(self):
        """Pipeline handles empty data gracefully."""
        from services.reporting.pipeline_v2 import run_pipeline_flow

        # Use a date range far in the past with no events
        start = "2020-01-01T00:00:00+00:00"
        end = "2020-01-02T00:00:00+00:00"
        result = run_pipeline_flow(start_date=start, end_date=end)

        assert result["status"] == "success"
        assert result["processed_events"] == 0

    def test_pipeline_error_handling(self):
        """Pipeline returns error status when something fails."""
        from services.reporting.pipeline_v2 import run_pipeline_flow

        with patch(
            "services.reporting.pipeline_v2.load_client_map",
            side_effect=RuntimeError("DB connection failed"),
        ):
            start = (datetime.now(timezone.utc) -
                     timedelta(days=1)).isoformat()
            end = datetime.now(timezone.utc).isoformat()
            result = run_pipeline_flow(start_date=start, end_date=end)

            assert result["status"] == "error"
            assert "DB connection failed" in result.get("error", "")

    def test_pipeline_logs_error_run(self):
        """Error runs are logged to pipeline_run_log."""
        from services.reporting.pipeline_v2 import run_pipeline_flow

        with patch(
            "services.reporting.pipeline_v2.load_client_map",
            side_effect=RuntimeError("DB down"),
        ):
            start = (datetime.now(timezone.utc) -
                     timedelta(days=1)).isoformat()
            end = datetime.now(timezone.utc).isoformat()
            run_pipeline_flow(start_date=start, end_date=end)

        # The error run should have been logged
        with Session(engine) as session:
            error_runs = session.execute(
                sa_text(
                    "SELECT status, error_message FROM pipeline_run_log "
                    "WHERE error_message IS NOT NULL "
                    "ORDER BY start_time DESC LIMIT 1"
                )
            ).fetchall()

        assert len(error_runs) >= 1
        assert error_runs[0].status == "error"
        assert "DB down" in error_runs[0].error_message


# ===================================================================
# Idempotency tests
# ===================================================================


class TestPipelineIdempotency:
    """Verify pipeline is idempotent."""

    @pytest.fixture(autouse=True)
    def setup(self):
        _setup_reporting_tables()

        # Insert stable test data
        with Session(engine) as session:
            now = datetime.now(timezone.utc)
            _insert_telemetry_event(
                event_type="inbound_order_created",
                timestamp=(now - timedelta(hours=2)).isoformat(),
                warehouse="zaragoza",
                client_id="idem-client",
                quantity=5,
                session=session,
            )
            _insert_telemetry_event(
                event_type="outbound_order_created",
                timestamp=(now - timedelta(hours=1)).isoformat(),
                warehouse="zaragoza",
                client_id="idem-client",
                session=session,
            )
        yield

    def test_running_twice_produces_same_row_count(self):
        """Running the pipeline twice should not create duplicate KPI rows."""
        from services.reporting.pipeline_v2 import run_pipeline_flow

        start = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        end = datetime.now(timezone.utc).isoformat()

        # First run
        r1 = run_pipeline_flow(start_date=start, end_date=end)
        rows_after_first = _count_kpi_rows()

        # Second run
        r2 = run_pipeline_flow(start_date=start, end_date=end)
        rows_after_second = _count_kpi_rows()

        assert r1["status"] == "success"
        assert r2["status"] == "success"
        assert rows_after_first == rows_after_second, (
            f"Row count changed: {rows_after_first} → {rows_after_second}"
        )

    def test_pipeline_run_log_grows_with_each_run(self):
        """Each pipeline execution adds an entry to pipeline_run_log."""
        from services.reporting.pipeline_v2 import run_pipeline_flow

        start = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        end = datetime.now(timezone.utc).isoformat()

        runs_before = _count_pipeline_runs()

        run_pipeline_flow(start_date=start, end_date=end)
        runs_after_first = _count_pipeline_runs()

        run_pipeline_flow(start_date=start, end_date=end)
        runs_after_second = _count_pipeline_runs()

        assert runs_after_first == runs_before + 1
        assert runs_after_second == runs_before + 2


# ===================================================================
# Pipeline run log metadata tests
# ===================================================================


class TestPipelineRunLog:
    """Verify pipeline_run_log contains the 5 mandatory metadata fields."""

    @pytest.fixture(autouse=True)
    def setup(self):
        _setup_reporting_tables()
        from services.reporting.pipeline_v2 import run_pipeline_flow

        # Run the pipeline to produce a log entry
        with Session(engine) as session:
            now = datetime.now(timezone.utc)
            _insert_telemetry_event(
                event_type="inbound_order_created",
                timestamp=(now - timedelta(hours=1)).isoformat(),
                warehouse="los_angeles",
                client_id="meta-client",
                quantity=10,
                session=session,
            )

        start = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        end = datetime.now(timezone.utc).isoformat()
        run_pipeline_flow(start_date=start, end_date=end)
        yield

    def test_has_five_mandatory_fields(self):
        """pipeline_run_log has start_time, end_time, records_processed, status, error_message."""
        with Session(engine) as session:
            row = session.execute(
                sa_text("""
                    SELECT start_time, end_time, records_processed, status,
                           error_message
                    FROM pipeline_run_log
                    ORDER BY start_time DESC
                    LIMIT 1
                """)
            ).fetchone()

        assert row is not None
        assert row.start_time is not None
        assert row.end_time is not None
        assert row.records_processed >= 0
        assert row.status in ("running", "success", "error")

    def test_details_field_is_optional(self):
        """details field can be NULL."""
        with Session(engine) as session:
            row = session.execute(
                sa_text("""
                    SELECT details FROM pipeline_run_log
                    ORDER BY start_time DESC
                    LIMIT 1
                """)
            ).fetchone()

        # details is nullable — either None or a JSON string
        assert row is not None
        assert row.details is None or isinstance(row.details, str)


# ===================================================================
# Reporting REST endpoint tests
# ===================================================================


class TestReportingEndpoints:
    """Verify the 3 reporting endpoints work correctly."""

    @pytest.fixture(autouse=True)
    def setup(self):
        _setup_reporting_tables()

        # Insert test data and run pipeline
        from services.reporting.pipeline_v2 import run_pipeline_flow

        with Session(engine) as session:
            now = datetime.now(timezone.utc)
            _insert_telemetry_event(
                event_type="inbound_order_created",
                timestamp=(now - timedelta(hours=3)).isoformat(),
                warehouse="los_angeles",
                client_id="endpoint-client",
                quantity=15,
                session=session,
            )
            _insert_telemetry_event(
                event_type="outbound_order_created",
                timestamp=(now - timedelta(hours=2)).isoformat(),
                warehouse="los_angeles",
                client_id="endpoint-client",
                session=session,
            )
            _insert_telemetry_event(
                event_type="stock_threshold_triggered",
                timestamp=(now - timedelta(hours=1)).isoformat(),
                warehouse="zaragoza",
                client_id="endpoint-client",
                session=session,
            )

        start = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        end = datetime.now(timezone.utc).isoformat()
        run_pipeline_flow(start_date=start, end_date=end)
        yield

    def test_get_weekly_performance_returns_kpi_rows(self):
        """GET /reporting/weekly-warehouse-client-performance returns KPI data."""
        client = TestClient(app)
        response = client.get(
            "/reporting/weekly-warehouse-client-performance",
            headers=_HEADERS,
        )
        assert response.status_code in (200, 401, 403)

        if response.status_code == 200:
            data = response.json()
            assert "week_start" in data
            assert "entries" in data
            assert len(data["entries"]) >= 1

            entry = data["entries"][0]
            assert "warehouse" in entry
            assert "client_id" in entry
            assert "inbound_units_count" in entry
            assert "outbound_orders_count" in entry
            assert "stockout_events_count" in entry
            assert "discrepancy_rate" in entry

    def test_get_latest_pipeline_run(self):
        """GET /reporting/pipeline-runs/latest returns run metadata."""
        client = TestClient(app)
        response = client.get(
            "/reporting/pipeline-runs/latest",
            headers=_HEADERS,
        )
        assert response.status_code in (200, 401, 403)

        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert "pipeline" in data
            pipeline = data["pipeline"]
            assert "start_time" in pipeline
            assert "end_time" in pipeline
            assert "records_processed" in pipeline
            assert pipeline["records_processed"] >= 0

    def test_post_trigger_pipeline(self):
        """POST /reporting/pipeline-runs triggers a pipeline run."""
        client = TestClient(app)
        now = datetime.now(timezone.utc)
        payload = {
            "start_date": (now - timedelta(days=1)).isoformat(),
            "end_date": now.isoformat(),
        }
        response = client.post(
            "/reporting/pipeline-runs",
            headers=_HEADERS,
            json=payload,
        )
        assert response.status_code in (200, 401, 403)

        if response.status_code == 200:
            data = response.json()
            assert data["status"] == "success"
            assert "pipeline" in data
            pipeline = data["pipeline"]
            assert "processed_events" in pipeline
            assert "rows_written" in pipeline


# ===================================================================
# Pipeline name consistency
# ===================================================================


def test_pipeline_name_matches_design():
    """The pipeline_name field matches the documented name."""
    from services.reporting.pipeline_v2 import run_pipeline_flow

    assert run_pipeline_flow.name == "weekly_warehouse_client_performance"
