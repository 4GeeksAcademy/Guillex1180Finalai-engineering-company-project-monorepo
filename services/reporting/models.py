"""SQLModel entities for the reporting schema (HITO 18 business pipeline).

Table ``reporting.weekly_warehouse_client_performance`` stores pre-computed
weekly KPI aggregations per ``(warehouse, client_id)`` pair.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


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
