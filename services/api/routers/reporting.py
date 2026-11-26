"""REST endpoints for the HITO 18 business reporting pipeline.

Endpoints
---------
GET  /reporting/weekly-warehouse-client-performance
    Return aggregated KPI data, optionally filtered by week_start, warehouse, client_id.
GET  /reporting/pipeline-runs/latest
    Return status summary of the most recent pipeline execution (last 7 days).
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
from services.reporting.pipeline import run_pipeline
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
    """Return status of the most recent pipeline run based on table data.

    Instead of tracking separate pipeline_run metadata, this endpoint
    infers the last run from the max ``updated_at`` in the reporting table.
    """
    cache_key = "reporting:pipeline:latest"

    cached = response_cache.get(cache_key)
    if cached is not None:
        logger.debug("Pipeline latest served from cache (key=%s)", cache_key)
        return cached

    with Session(engine) as session:
        # Check if the table has any data
        count = session.execute(
            sa_text("SELECT COUNT(*) FROM weekly_warehouse_client_performance")
        ).scalar()

        if count == 0:
            payload = {
                "status": "success",
                "pipeline": {
                    "processed_events": 0,
                    "rows_written": 0,
                    "weeks": [],
                    "period": {
                        "from": None,
                        "to": None,
                    },
                },
            }
            response_cache.set(cache_key, payload, ttl_seconds=60)
            return payload

        # Latest update and stats
        latest = session.execute(
            sa_text("""
                SELECT
                    MAX(updated_at) as last_run,
                    COUNT(*) as total_rows,
                    COUNT(DISTINCT week_start) as week_count,
                    SUM(inbound_units_count) as total_inbound,
                    SUM(outbound_orders_count) as total_outbound,
                    SUM(stockout_events_count) as total_stockout,
                    ROUND(AVG(discrepancy_rate), 2) as avg_discrepancy
                FROM weekly_warehouse_client_performance
            """)
        ).fetchone()

        weeks = session.execute(
            sa_text("""
                SELECT DISTINCT week_start
                FROM weekly_warehouse_client_performance
                ORDER BY week_start DESC
            """)
        ).scalars().all()

        payload = {
            "status": "success",
            "pipeline": {
                "processed_events": 0,  # Not stored per-run; will be known on next trigger
                "rows_written": latest.total_rows,
                "weeks": list(weeks),
                "period": {
                    "from": weeks[-1] if weeks else None,
                    "to": weeks[0] if weeks else None,
                },
                "last_run": str(latest.last_run) if latest.last_run else None,
                "aggregates": {
                    "total_inbound_units": int(latest.total_inbound or 0),
                    "total_outbound_orders": int(latest.total_outbound or 0),
                    "total_stockout_events": int(latest.total_stockout or 0),
                    "avg_discrepancy_rate": float(latest.avg_discrepancy or 0.0),
                },
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
    """Manually trigger the ETL pipeline.

    The pipeline reads business events from ``telemetry_events``,
    aggregates KPIs by ``(warehouse, client_id, week_start)``,
    and upserts into ``weekly_warehouse_client_performance``.
    """
    logger.info(
        "Pipeline manually triggered (start=%s, end=%s)", start_date, end_date
    )

    try:
        summary = run_pipeline(
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
