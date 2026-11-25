"""REST endpoint for frontend telemetry events (POST /telemetry/events)."""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

# Leer desde variable de entorno; se usará en Fase 3 para reenvío a Supabase
TELEMETRY_ENDPOINT = os.getenv("TELEMETRY_ENDPOINT", "")


class TelemetryEnvelope(BaseModel):
    """A single telemetry event envelope sent by the frontend."""

    eventId: str
    timestamp: str
    sessionId: str | None = None
    userId: str | None = None
    event_type: str
    schemaVersion: str
    requestId: str | None = None
    properties: dict[str, Any] = {}


class TelemetryBatch(BaseModel):
    """Batch of telemetry events sent by the frontend."""

    events: list[TelemetryEnvelope]


class TelemetryBatchResponse(BaseModel):
    """Response acknowledging received events."""

    received: int


@router.post("/events", response_model=TelemetryBatchResponse)
async def receive_telemetry(batch: TelemetryBatch, request: Request) -> TelemetryBatchResponse:
    """Accept a batch of telemetry events from the frontend.

    This is a lightweight ingestion stub — events are logged and counted.
    Future iterations may persist them via the existing `record_event` outbox.
    """
    count = len(batch.events)
    event_types = [e.event_type for e in batch.events]
    logger.info(
        "Telemetry received %d event(s) from %s: %s",
        count,
        request.client.host if request.client else "unknown",
        event_types,
    )
    for event in batch.events:
        logger.debug(
            "Telemetry event [%s] session=%s user=%s props=%s",
            event.event_type,
            event.sessionId,
            event.userId,
            event.properties,
        )
    return TelemetryBatchResponse(received=count)
