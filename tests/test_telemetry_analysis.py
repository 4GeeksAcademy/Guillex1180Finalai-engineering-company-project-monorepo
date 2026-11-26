"""Tests for HITO 18 telemetry analysis pipeline and /telemetry/report endpoint.

Covers:
  1. Volume by type and day
  2. Error rate by day
  3. API latency statistics
  4. Auth failure rate
  5. HTTP endpoint with cache behaviour
  6. Edge cases (empty data, default period)
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Iterator
from uuid import uuid4

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text as sa_text
from sqlmodel import Session, SQLModel, create_engine

from services.api.main import app
from services.api.models import TelemetryRecord


# ── Helpers ────────────────────────────────────────────────────────────────

def _insert_events(engine: Any, events: list[dict[str, Any]]) -> None:
    """Bulk-insert TelemetryRecord rows using raw SQL."""
    with engine.begin() as conn:
        for ev in events:
            conn.execute(
                sa_text(
                    """INSERT INTO telemetry_events
                       (id, timestamp, service, event_type, level, value, message, tags)
                       VALUES (:id, :ts, :service, :event_type, :level, :value, :message, :tags)"""
                ),
                {
                    "id": ev.get("id", str(uuid4())),
                    "ts": ev["timestamp"],
                    "service": ev.get("service", "api"),
                    "event_type": ev["event_type"],
                    "level": ev.get("level", "info"),
                    "value": ev.get("value"),
                    "message": ev.get("message"),
                    "tags": json.dumps(ev.get("tags", {})),
                },
            )


def _make_engine(db_path: str | None = None) -> Any:
    """Create an isolated SQLite engine with telemetry_events table.

    Parameters
    ----------
    db_path : str or None
        File path for the SQLite database.  When *None* uses in-memory
        (``sqlite://``) — suitable for same-thread unit tests but **not**
        for ``TestClient`` which runs the ASGI app in a separate thread
        (in-memory SQLite is per-connection in SQLite; file-based works
        across threads).

    Returns
    -------
    Engine
        SQLAlchemy engine with ``check_same_thread=False``.
    """
    url = f"sqlite:///{db_path}" if db_path else "sqlite://"
    engine = create_engine(
        url, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine, tables=[TelemetryRecord.__table__])
    return engine


def _patch_analysis_engine(monkeypatch: pytest.MonkeyPatch, engine: Any) -> None:
    """Point services.telemetry.analysis.engine to an isolated test engine."""
    import services.telemetry.analysis as analysis_mod
    monkeypatch.setattr(analysis_mod, "engine", engine)


# ── Fixtures ───────────────────────────────────────────────────────────────

@pytest.fixture
def analysis_engine(monkeypatch: pytest.MonkeyPatch) -> Iterator[Any]:
    """Provide an isolated engine monkeypatched into analysis module."""
    engine = _make_engine()
    _patch_analysis_engine(monkeypatch, engine)
    yield engine
    engine.dispose()


@pytest.fixture
def empty_engine(monkeypatch: pytest.MonkeyPatch) -> Iterator[Any]:
    """Engine with zero events inserted."""
    engine = _make_engine()
    _patch_analysis_engine(monkeypatch, engine)
    yield engine
    engine.dispose()


@pytest.fixture
def sample_events_engine(analysis_engine: Any) -> Any:
    """Insert a representative set of telemetry events."""
    base = datetime(2025, 1, 10, tzinfo=timezone.utc)
    events: list[dict[str, Any]] = []

    # Volume events (various types across 3 days)
    for day_offset in range(3):
        ts = (base + timedelta(days=day_offset)).isoformat()
        events.append(
            {"timestamp": ts, "event_type": "page_view", "level": "info"})
        events.append(
            {"timestamp": ts, "event_type": "button_click", "level": "info"})
        if day_offset > 0:
            events.append(
                {"timestamp": ts, "event_type": "page_view", "level": "info"})

    # Error events (1 error on day 1, 2 on day 2)
    for day_offset in range(2):
        ts = (base + timedelta(days=day_offset)).isoformat()
        events.append(
            {"timestamp": ts, "event_type": "api_error", "level": "error"})
    ts = (base + timedelta(days=1)).isoformat()
    events.append(
        {"timestamp": ts, "event_type": "api_error", "level": "error"})

    # API latency events (3 records with different values)
    for i, val in enumerate([120.5, 80.3, 250.0]):
        ts = (base + timedelta(days=i)).isoformat()
        events.append({
            "timestamp": ts,
            "event_type": "api_latency_recorded",
            "level": "info",
            "value": val,
        })

    # Auth events (mixed successes and failures)
    ts0 = base.isoformat()
    ts1 = (base + timedelta(days=1)).isoformat()
    ts2 = (base + timedelta(days=2)).isoformat()
    events.append(
        {"timestamp": ts0, "event_type": "auth_login_succeeded", "level": "info"})
    events.append(
        {"timestamp": ts0, "event_type": "auth_login_failed", "level": "warn"})
    events.append(
        {"timestamp": ts1, "event_type": "auth_login_succeeded", "level": "info"})
    events.append(
        {"timestamp": ts1, "event_type": "auth_login_succeeded", "level": "info"})
    events.append(
        {"timestamp": ts1, "event_type": "auth_login_failed", "level": "warn"})
    events.append(
        {"timestamp": ts2, "event_type": "auth_login_succeeded", "level": "info"})

    _insert_events(analysis_engine, events)
    return analysis_engine


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — Volume by type and day
# ═══════════════════════════════════════════════════════════════════════════

class TestVolumeByTypeAndDay:
    def test_returns_list_of_dicts(self, sample_events_engine) -> None:
        from services.telemetry.analysis import volume_by_type_and_day
        result = volume_by_type_and_day(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert isinstance(result, list)
        assert all(isinstance(r, dict) for r in result)

    def test_counts_by_event_type_and_date(self, sample_events_engine) -> None:
        from services.telemetry.analysis import volume_by_type_and_day
        result = volume_by_type_and_day(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        rows = {(r["event_type"], r["date"]): r["count"] for r in result}
        # page_view on day 0: 1, day 1: 2, day 2: 2
        assert rows.get(("page_view", "2025-01-10")) == 1
        assert rows.get(("page_view", "2025-01-11")) == 2
        assert rows.get(("page_view", "2025-01-12")) == 2

    def test_only_returns_events_in_range(self, sample_events_engine) -> None:
        from services.telemetry.analysis import volume_by_type_and_day
        # Narrow range to just day 1
        result = volume_by_type_and_day(
            "2025-01-11T00:00:00+00:00", "2025-01-12T00:00:00+00:00")
        dates = {r["date"] for r in result}
        assert dates == {"2025-01-11"}

    def test_empty_when_no_data(self, empty_engine) -> None:
        from services.telemetry.analysis import volume_by_type_and_day
        result = volume_by_type_and_day(
            "2025-01-01T00:00:00+00:00", "2025-01-31T00:00:00+00:00")
        assert result == []

    def test_result_is_json_serializable(self, sample_events_engine) -> None:
        from services.telemetry.analysis import volume_by_type_and_day
        result = volume_by_type_and_day(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        json.dumps(result)  # raises if not serializable


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — Error rate by day
# ═══════════════════════════════════════════════════════════════════════════

class TestErrorRateByDay:
    def test_returns_list_of_dicts(self, sample_events_engine) -> None:
        from services.telemetry.analysis import error_rate_by_day
        result = error_rate_by_day(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert isinstance(result, list)
        assert all(isinstance(r, dict) for r in result)

    def test_has_expected_columns(self, sample_events_engine) -> None:
        from services.telemetry.analysis import error_rate_by_day
        result = error_rate_by_day(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert result
        expected = {"date", "total_events", "errors", "error_rate_pct"}
        assert expected <= result[0].keys()

    def test_error_rate_percentage(self, sample_events_engine) -> None:
        from services.telemetry.analysis import error_rate_by_day
        result = error_rate_by_day(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        rates = {r["date"]: r["error_rate_pct"] for r in result}
        # Day 0 (2025-01-10): page_view(1) + button_click(1) + api_error(1)
        #   + api_latency_recorded(1) + auth_login_succeeded(1)
        #   + auth_login_failed(1) = 6 total, 1 error → 16.67%
        assert rates["2025-01-10"] == pytest.approx(16.67, rel=0.01)
        # Day 1 (2025-01-11): page_view(2) + button_click(1) + api_error(2)
        #   + api_latency_recorded(1) + auth_login_succeeded(2)
        #   + auth_login_failed(1) = 9 total, 2 errors → 22.22%
        assert rates["2025-01-11"] == pytest.approx(22.22, rel=0.01)
        # Day 2 (2025-01-12): page_view(2) + button_click(1)
        #   + api_latency_recorded(1) = 4 total, 0 errors → 0.0%
        assert rates["2025-01-12"] == 0.0

    def test_empty_when_no_data(self, empty_engine) -> None:
        from services.telemetry.analysis import error_rate_by_day
        result = error_rate_by_day(
            "2025-01-01T00:00:00+00:00", "2025-01-31T00:00:00+00:00")
        assert result == []


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — API latency stats
# ═══════════════════════════════════════════════════════════════════════════

class TestApiLatencyStats:
    def test_returns_list_of_dicts(self, sample_events_engine) -> None:
        from services.telemetry.analysis import api_latency_stats
        result = api_latency_stats(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert isinstance(result, list)
        assert all(isinstance(r, dict) for r in result)

    def test_has_expected_columns(self, sample_events_engine) -> None:
        from services.telemetry.analysis import api_latency_stats
        result = api_latency_stats(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert result
        expected = {"date", "avg_ms", "p50_ms", "p95_ms", "p99_ms", "samples"}
        assert expected <= result[0].keys()

    def test_single_latency_value_per_day(self, sample_events_engine) -> None:
        from services.telemetry.analysis import api_latency_stats
        result = api_latency_stats(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        stats = {r["date"]: r for r in result}
        # Day 0: single value 120.5
        assert stats["2025-01-10"]["avg_ms"] == 120.5
        assert stats["2025-01-10"]["samples"] == 1
        # Day 1: single value 80.3
        assert stats["2025-01-11"]["avg_ms"] == 80.3
        # Day 2: single value 250.0
        assert stats["2025-01-12"]["avg_ms"] == 250.0

    def test_empty_when_no_latency_events(self, empty_engine) -> None:
        from services.telemetry.analysis import api_latency_stats
        result = api_latency_stats(
            "2025-01-01T00:00:00+00:00", "2025-01-31T00:00:00+00:00")
        assert result == []

    def test_filters_only_api_latency_events(self, sample_events_engine) -> None:
        from services.telemetry.analysis import api_latency_stats
        result = api_latency_stats(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert len(result) == 3  # One per day with latency data


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — Auth failure rate
# ═══════════════════════════════════════════════════════════════════════════

class TestAuthFailureRate:
    def test_returns_list_of_dicts(self, sample_events_engine) -> None:
        from services.telemetry.analysis import auth_failure_rate
        result = auth_failure_rate(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert isinstance(result, list)
        assert all(isinstance(r, dict) for r in result)

    def test_has_expected_columns(self, sample_events_engine) -> None:
        from services.telemetry.analysis import auth_failure_rate
        result = auth_failure_rate(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        assert result
        expected = {"date", "attempts", "failures", "failure_rate_pct"}
        assert expected <= result[0].keys()

    def test_failure_rate_percentage(self, sample_events_engine) -> None:
        from services.telemetry.analysis import auth_failure_rate
        result = auth_failure_rate(
            "2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        rates = {r["date"]: r for r in result}
        # Day 0: 2 attempts (1 fail + 1 success) → 50%
        assert rates["2025-01-10"]["attempts"] == 2
        assert rates["2025-01-10"]["failures"] == 1
        assert rates["2025-01-10"]["failure_rate_pct"] == 50.0
        # Day 1: 3 attempts (1 fail + 2 success) → 33.3%
        assert rates["2025-01-11"]["attempts"] == 3
        assert rates["2025-01-11"]["failures"] == 1
        assert rates["2025-01-11"]["failure_rate_pct"] == pytest.approx(
            33.3, rel=0.01)
        # Day 2: 1 attempt (0 fail + 1 success) → 0%
        assert rates["2025-01-12"]["attempts"] == 1
        assert rates["2025-01-12"]["failures"] == 0
        assert rates["2025-01-12"]["failure_rate_pct"] == 0.0

    def test_empty_when_no_auth_events(self, empty_engine) -> None:
        from services.telemetry.analysis import auth_failure_rate
        result = auth_failure_rate(
            "2025-01-01T00:00:00+00:00", "2025-01-31T00:00:00+00:00")
        assert result == []


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — Analysis function properties (cross-cutting)
# ═══════════════════════════════════════════════════════════════════════════

class TestAnalysisFunctionProperties:
    """Verify all 4 functions share required structural properties."""

    def test_all_functions_accept_start_and_end_date(self, empty_engine) -> None:
        """All metric functions accept (start_date, end_date) as positional args."""
        from services.telemetry.analysis import (
            auth_failure_rate,
            api_latency_stats,
            error_rate_by_day,
            volume_by_type_and_day,
        )
        for fn in [volume_by_type_and_day, error_rate_by_day,
                   api_latency_stats, auth_failure_rate]:
            result = fn("2025-01-01T00:00:00+00:00",
                        "2025-01-31T00:00:00+00:00")
            assert isinstance(result, list)

    def test_all_functions_are_idempotent(self, sample_events_engine) -> None:
        """Calling the same function twice with same params returns same result."""
        from services.telemetry.analysis import (
            auth_failure_rate,
            api_latency_stats,
            error_rate_by_day,
            volume_by_type_and_day,
        )
        params = ("2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        for fn in [volume_by_type_and_day, error_rate_by_day,
                   api_latency_stats, auth_failure_rate]:
            result_a = fn(*params)
            result_b = fn(*params)
            assert result_a == result_b, f"{fn.__name__} is not idempotent"

    def test_all_functions_return_json_serializable(self, sample_events_engine) -> None:
        """Each function's return is directly serializable to JSON."""
        from services.telemetry.analysis import (
            auth_failure_rate,
            api_latency_stats,
            error_rate_by_day,
            volume_by_type_and_day,
        )
        params = ("2025-01-10T00:00:00+00:00", "2025-01-13T00:00:00+00:00")
        for fn in [volume_by_type_and_day, error_rate_by_day,
                   api_latency_stats, auth_failure_rate]:
            result = fn(*params)
            json.dumps(result)  # raises TypeError if not serializable


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — HTTP endpoint (integration)
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture
def api_test_client(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Any,
) -> Iterator[TestClient]:
    """FastAPI TestClient with isolated engine and populated data.

    Uses a **file-based** SQLite database (via ``tmp_path``) so the engine
    works across threads — ``TestClient`` runs the ASGI app in a separate
    thread and in-memory ``sqlite://`` would create a different database
    per thread.

    Monkeypatches ``engine`` in every module that imports it:
    ``services.telemetry.analysis``, ``services.api.database``,
    ``services.api.routers.telemetry``, and ``services.api.routers.reporting``.
    """
    db_path = str(tmp_path / "test_telemetry.db")
    engine = _make_engine(db_path)
    _patch_analysis_engine(monkeypatch, engine)

    import services.api.database as db_mod
    monkeypatch.setattr(db_mod, "engine", engine)

    import services.api.routers.telemetry as tel_mod
    monkeypatch.setattr(tel_mod, "engine", engine)

    import services.api.routers.reporting as rep_mod
    monkeypatch.setattr(rep_mod, "engine", engine)

    # Populate sample data with timestamps that the default 7-day window
    # will catch (events from 6 and 7 days ago)
    now = datetime.now(timezone.utc)
    events: list[dict[str, Any]] = [
        {"timestamp": (now - timedelta(days=6)).isoformat(),
         "event_type": "page_view", "level": "info"},
        {"timestamp": (now - timedelta(days=6)).isoformat(),
         "event_type": "api_error", "level": "error"},
        {"timestamp": (now - timedelta(days=6)).isoformat(),
         "event_type": "auth_login_succeeded", "level": "info"},
        {"timestamp": (now - timedelta(days=6)).isoformat(),
         "event_type": "auth_login_failed", "level": "warn"},
        {"timestamp": (now - timedelta(days=5)).isoformat(),
         "event_type": "page_view", "level": "info"},
        {"timestamp": (now - timedelta(days=5)).isoformat(),
         "event_type": "api_latency_recorded", "level": "info", "value": 150.0},
    ]
    _insert_events(engine, events)

    # Clear response cache between tests
    from services.api.cache import response_cache
    response_cache.clear()

    client = TestClient(app)
    yield client
    client.close()
    engine.dispose()


class TestTelemetryReportEndpoint:
    def test_returns_expected_structure(self, api_test_client: TestClient) -> None:
        response = api_test_client.get("/telemetry/report")
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "metrics" in data
        assert "from" in data["period"]
        assert "to" in data["period"]
        assert "volume_by_type_and_day" in data["metrics"]
        assert "error_rate_by_day" in data["metrics"]
        assert "api_latency_stats" in data["metrics"]
        assert "auth_failure_rate" in data["metrics"]

    def test_accepts_custom_date_range(self, api_test_client: TestClient) -> None:
        response = api_test_client.get(
            "/telemetry/report",
            params={"start_date": "2025-01-10", "end_date": "2025-01-11"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "2025-01-10" in data["period"]["from"]

    def test_empty_metrics_return_empty_lists(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Any,
    ) -> None:
        """When no data exists, all metrics should return empty lists."""
        db_path = str(tmp_path / "test_empty.db")
        engine = _make_engine(db_path)
        _patch_analysis_engine(monkeypatch, engine)

        import services.api.database as db_mod
        monkeypatch.setattr(db_mod, "engine", engine)

        import services.api.routers.telemetry as tel_mod
        monkeypatch.setattr(tel_mod, "engine", engine)

        import services.api.routers.reporting as rep_mod
        monkeypatch.setattr(rep_mod, "engine", engine)

        from services.api.cache import response_cache
        response_cache.clear()

        client = TestClient(app)
        try:
            response = client.get("/telemetry/report")
            assert response.status_code == 200
            data = response.json()
            for metric_name, metric_data in data["metrics"].items():
                assert isinstance(
                    metric_data, list), f"{metric_name} should be a list"
                assert metric_data == [], f"{metric_name} should be empty"
        finally:
            client.close()
            engine.dispose()

    def test_cache_returns_same_object(self, api_test_client: TestClient) -> None:
        """Two quick requests with the same parameters return identical results.

        Uses explicit ``start_date`` / ``end_date`` so the cache key
        (which contains the ISO timestamp) is deterministic.
        """
        params = {"start_date": "2026-01-10", "end_date": "2026-01-12"}
        r1 = api_test_client.get("/telemetry/report", params=params)
        r2 = api_test_client.get("/telemetry/report", params=params)
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json() == r2.json()

    def test_default_period_is_seven_days(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Any,
    ) -> None:
        """Without parameters, the default range is ~7 days from now."""
        db_path = str(tmp_path / "test_default_period.db")
        engine = _make_engine(db_path)
        _patch_analysis_engine(monkeypatch, engine)

        import services.api.database as db_mod
        monkeypatch.setattr(db_mod, "engine", engine)

        import services.api.routers.telemetry as tel_mod
        monkeypatch.setattr(tel_mod, "engine", engine)

        import services.api.routers.reporting as rep_mod
        monkeypatch.setattr(rep_mod, "engine", engine)

        from services.api.cache import response_cache
        response_cache.clear()

        client = TestClient(app)
        try:
            response = client.get("/telemetry/report")
            data = response.json()
            period_from = datetime.fromisoformat(data["period"]["from"])
            period_to = datetime.fromisoformat(data["period"]["to"])
            delta = period_to - period_from
            # Should be approximately 7 days
            assert timedelta(days=6, hours=23) <= delta <= timedelta(
                days=7, hours=1)
        finally:
            client.close()
            engine.dispose()

    def test_response_is_json_serializable(self, api_test_client: TestClient) -> None:
        response = api_test_client.get("/telemetry/report")
        # The response is already JSON; double-check it can be re-serialized
        data = response.json()
        json.dumps(data)


# ═══════════════════════════════════════════════════════════════════════════
#  Tests — Pandas conversion (the no-forgotten-utc rule)
# ═══════════════════════════════════════════════════════════════════════════

class TestTimestampConversion:
    """Verify that timestamps are properly converted before groupby."""

    def test_pd_to_datetime_utc_used(self) -> None:
        """Sanity check: pd.to_datetime with utc=True produces tz-aware results."""
        s = pd.Series(["2025-01-10T12:00:00Z", "2025-01-11T00:00:00+00:00"])
        converted = pd.to_datetime(s, utc=True)
        assert converted.dt.tz is not None
        assert str(converted.dt.tz) == "UTC"
