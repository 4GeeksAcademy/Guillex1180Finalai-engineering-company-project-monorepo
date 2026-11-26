"""SQLModel entities for the reporting schema (HITO 18 / HITO 19 pipeline).

Tables
------
- ``reporting.weekly_warehouse_client_performance`` — pre-computed weekly KPI
  aggregations per ``(warehouse, client_id)`` pair.
- ``reporting.pipeline_run_log`` — execution metadata for every pipeline run.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Column, DateTime, Field, SQLModel, Text


class PipelineRunLog(SQLModel, table=True):
    """Execution metadata for a single pipeline run.

    Stores the 5 mandatory fields required by HITO 19:
      - start_time
      - end_time
      - records_processed
      - status
      - error_message
    plus a free-form ``details`` JSON field for extensibility.
    """

    __tablename__ = "pipeline_run_log"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
    )
    pipeline_name: str = Field(
        default="weekly_warehouse_client_performance",
        nullable=False,
    )
    start_time: datetime = Field(
        sa_type=DateTime(timezone=True),
        nullable=False,
    )
    end_time: datetime | None = Field(
        sa_type=DateTime(timezone=True),
        default=None,
        nullable=True,
    )
    records_processed: int = Field(default=0, ge=0)
    status: str = Field(
        default="running",
        description="One of: running, success, error",
    )
    error_message: str | None = Field(
        sa_type=Text,
        default=None,
        nullable=True,
    )
    details: str | None = Field(
        sa_type=Text,
        default=None,
        nullable=True,
        description="Optional JSON blob with extra run metadata",
    )
    created_at: datetime = Field(
        sa_type=DateTime(timezone=True),
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class WeeklyWarehouseClientPerformance(SQLModel, table=True):
    """Weekly business KPI snapshot at the ``(warehouse, client_id)`` grain.

    One row per warehouse+client+week.  Columns follow the KPI definitions
    from the HITO 18 BRIEFING:

      inbound_units_count   — Sum of ``quantity`` for inbound_order_created events
      outbound_orders_count — Count of outbound_order_created events
      stockout_events_count — Count of stock_threshold_triggered events
      discrepancy_rate      — Percentage of inventory_discrepancy_detected events
                              relative to total business events in the week

    The row is UPSERTed so the pipeline is idempotent.
    """

    # type: ignore[assignment]
    __tablename__ = "weekly_warehouse_client_performance"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
    )
    warehouse: str = Field(nullable=False, index=True)
    client_id: str = Field(nullable=False, index=True)
    week_start: str = Field(
        nullable=False,
        description="ISO-8601 date (Monday) of the aggregation week, e.g. 2025-03-03",
    )
    inbound_units_count: int = Field(default=0, ge=0)
    outbound_orders_count: int = Field(default=0, ge=0)
    stockout_events_count: int = Field(default=0, ge=0)
    discrepancy_rate: float = Field(default=0.0, ge=0.0, le=100.0)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "warehouse",
            "client_id",
            "week_start",
            name="uq_weekly_warehouse_client_perf",
        ),
    )
