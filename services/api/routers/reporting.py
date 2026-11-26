"""REST endpoints for the HITO 18 / HITO 19 business reporting pipeline.

Endpoints
---------
GET  /reporting/weekly-warehouse-client-performance
    Return aggregated KPI data, optionally filtered by week_start, warehouse, client_id.
GET  /reporting/pipeline-runs/latest
    Return status and metadata of the most recent pipeline run from ``pipeline_run_log``.
POST /reporting/pipeline-runs
    Trigger a manual pipeline run with an optional date range.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Query
from sqlalchemy import text as sa_text
from sqlmodel import Session

from services.api.cache import response_cache
from services.api.database import engine
from services.reporting.pipeline_v2 import run_pipeline_flow
from services.reporting.schemas import (
    WeeklyPerformanceEntry,
    WeeklyPerformanceResponse,
    PipelineRunSummary,
    PipelineRunResponse,
    PipelineTriggerResponse,
)

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/reporting", tags=["reporting"])


# ---------------------------------------------------------------------------
# GET /reporting/weekly-warehouse-client-performance
# ---------------------------------------------------------------------------


@router.get("/weekly-warehouse-client-performance")
async def get_weekly_performance(
    week_start: str | None = Query(
        None,
        description="ISO-8601 week start (e.g. 2025-03-03). "
        "If omitted, returns the latest available week.",
    ),
    warehouse: str | None = Query(
        None,
        description="Optional warehouse filter.",
    ),
    client_id: str | None = Query(
        None,
        description="Optional client ID filter.",
    ),
) -> dict:
    """Return weekly KPI rows, optionally filtered.

    If ``week_start`` is omitted the latest week in the table is used.
    """
    cache_key = (
        f"reporting:perf:{week_start or 'latest'}"
        f":{warehouse or '*'}:{client_id or '*'}"
    )

    cached = response_cache.get(cache_key)
    if cached is not None:
        logger.debug(
            "Weekly performance served from cache (key=%s)", cache_key)
        return cached

    with Session(engine) as session:
        # Resolver la semana más reciente si no se especifica
        if week_start is None:
            latest = session.execute(
                sa_text("""
                    SELECT week_start
                    FROM weekly_warehouse_client_performance
                    ORDER BY week_start DESC
                    LIMIT 1
                """)
            ).fetchone()
            if latest is None:
                return {"week_start": None, "entries": []}
            resolved_week = latest[0]
        else:
            resolved_week = week_start

        # Construir query con filtros opcionales
        conditions = ["week_start = :week_start"]
        params: dict[str, Any] = {"week_start": resolved_week}

        if warehouse is not None:
            conditions.append("warehouse = :warehouse")
            params["warehouse"] = warehouse
        if client_id is not None:
            conditions.append("client_id = :client_id")
            params["client_id"] = client_id

        where_clause = " AND ".join(conditions)

        query = sa_text(f"""
            SELECT id, warehouse, client_id, week_start,
                   inbound_units_count, outbound_orders_count,
                   stockout_events_count, discrepancy_rate,
                   updated_at
            FROM weekly_warehouse_client_performance
            WHERE {where_clause}
            ORDER BY warehouse, client_id
        """).bindparams(**params)

        rows = session.execute(query).fetchall()

    def _parse_ts(val: object) -> datetime:
        if isinstance(val, datetime):
            return val
        if isinstance(val, str):
            try:
                return datetime.fromisoformat(val)
            except (ValueError, TypeError):
                return datetime.now(timezone.utc)
        return datetime.now(timezone.utc)

    entries = [
        WeeklyPerformanceEntry(
            id=row.id,
            warehouse=row.warehouse,
            client_id=row.client_id,
            week_start=row.week_start,
            inbound_units_count=row.inbound_units_count,
            outbound_orders_count=row.outbound_orders_count,
            stockout_events_count=row.stockout_events_count,
            discrepancy_rate=row.discrepancy_rate,
            updated_at=_parse_ts(row.updated_at),
        )
        for row in rows
    ]

    payload: dict = {
        "week_start": resolved_week,
        "entries": [e.model_dump() for e in entries],
    }

    response_cache.set(cache_key, payload, ttl_seconds=60)
    logger.debug(
        "Weekly performance computed and cached (key=%s, %d entries)",
        cache_key,
        len(entries),
    )

    return payload


# ---------------------------------------------------------------------------
# GET /reporting/pipeline-runs/latest
# ---------------------------------------------------------------------------


@router.get("/pipeline-runs/latest")
async def get_latest_pipeline_run() -> dict:
    """Return status and metadata of the most recent pipeline run.

    Reads the 5 metadata fields from ``pipeline_run_log``:
      - start_time
      - end_time
      - records_processed
      - status
      - error_message
    """
    cache_key = "reporting:pipeline:latest"

    cached = response_cache.get(cache_key)
    if cached is not None:
        logger.debug("Pipeline latest served from cache (key=%s)", cache_key)
        return cached

    with Session(engine) as session:
        latest = session.execute(
            sa_text("""
                SELECT
                    id, pipeline_name, start_time, end_time,
                    records_processed, status, error_message, details
                FROM pipeline_run_log
                ORDER BY start_time DESC
                LIMIT 1
            """)
        ).fetchone()

        if latest is None:
            payload = {
                "status": "success",
                "pipeline": {
                    "id": None,
                    "pipeline_name": "weekly_warehouse_client_performance",
                    "start_time": None,
                    "end_time": None,
                    "records_processed": 0,
                    "run_status": None,
                    "error_message": None,
                },
            }
            response_cache.set(cache_key, payload, ttl_seconds=60)
            return payload

        def _fmt_ts(val: object) -> str | None:
            if isinstance(val, datetime):
                return val.isoformat()
            if isinstance(val, str):
                try:
                    return datetime.fromisoformat(val).isoformat()
                except (ValueError, TypeError):
                    return None
            return None

        payload = {
            "status": "success",
            "pipeline": {
                "id": latest.id,
                "pipeline_name": latest.pipeline_name,
                "start_time": _fmt_ts(latest.start_time),
                "end_time": _fmt_ts(latest.end_time),
                "records_processed": latest.records_processed,
                "run_status": latest.status,
                "error_message": latest.error_message,
            },
        }

    response_cache.set(cache_key, payload, ttl_seconds=60)
    return payload


# ---------------------------------------------------------------------------
# POST /reporting/pipeline-runs
# ---------------------------------------------------------------------------


@router.post("/pipeline-runs")
async def trigger_pipeline(
    start_date: str | None = Query(
        None,
        description="ISO-8601 start date (e.g. 2025-03-01). "
        "Default: 7 days ago from now UTC.",
    ),
    end_date: str | None = Query(
        None,
        description="ISO-8601 end date (e.g. 2025-03-10). "
        "Default: now UTC.",
    ),
) -> dict:
    """Manually trigger the Prefect ETL pipeline.

    The pipeline reads business events from ``telemetry_events``,
    aggregates KPIs by ``(warehouse, client_id, week_start)``,
    and upserts into ``weekly_warehouse_client_performance``.
    """
    logger.info(
        "Pipeline manually triggered (start=%s, end=%s)", start_date, end_date
    )

    try:
        summary = run_pipeline_flow(
            start_date=start_date,
            end_date=end_date,
        )
        # Invalidate caches
        _invalidate_reporting_caches()
        return {
            "status": "success",
            "message": "Pipeline executed successfully",
            "pipeline": summary,
        }
    except Exception as exc:
        logger.error("Pipeline execution failed: %s", exc, exc_info=True)
        return {
            "status": "error",
            "message": f"Pipeline execution failed: {exc}",
            "pipeline": {
                "processed_events": 0,
                "rows_written": 0,
                "weeks": [],
                "period": {
                    "from": start_date,
                    "to": end_date,
                },
            },
        }


def _invalidate_reporting_caches() -> None:
    """Invalidate all reporting-related cache entries."""
    response_cache.invalidate_prefix("reporting:")
    logger.debug("Invalidated reporting cache entries")
