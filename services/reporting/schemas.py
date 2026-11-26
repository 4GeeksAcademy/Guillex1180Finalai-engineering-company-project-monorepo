"""Pydantic schemas for the HITO 18 reporting endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WeeklyPerformanceEntry(BaseModel):
    """A single KPI row at the ``(warehouse, client_id, week_start)`` grain."""

    id: str
    warehouse: str
    client_id: str
    week_start: str
    inbound_units_count: int = Field(ge=0)
    outbound_orders_count: int = Field(ge=0)
    stockout_events_count: int = Field(ge=0)
    discrepancy_rate: float = Field(ge=0.0, le=100.0)
    updated_at: datetime


class WeeklyPerformanceResponse(BaseModel):
    """Response payload for ``GET /reporting/weekly-warehouse-client-performance``."""

    week_start: str
    entries: list[WeeklyPerformanceEntry]


class PipelineRunSummary(BaseModel):
    """Resumen de una ejecución del pipeline."""

    processed_events: int = Field(ge=0)
    rows_written: int = Field(ge=0)
    weeks: list[str]
    period: dict[str, Any]


class PipelineRunResponse(BaseModel):
    """Response for pipeline trigger (POST) and status (GET)."""

    status: str  # "success" | "error"
    pipeline: PipelineRunSummary


class PipelineTriggerResponse(PipelineRunResponse):
    """Response after manually triggering the pipeline."""

    message: str = "Pipeline executed successfully"
