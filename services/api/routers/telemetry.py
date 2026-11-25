"""REST endpoint for frontend telemetry events (POST /telemetry/events).

Fase 1 — Almacenamiento
========================
Reemplaza el stub anterior por un endpoint real que:
  - Acepta el mismo envelope que el stub ({ "events": [...] })
  - Valida cada evento individualmente con TelemetryEnvelope.model_validate()
  - Rechaza eventos inválidos sin cancelar el lote (validación parcial)
  - Inserta los válidos en telemetry_events en una sola operación (bulk insert)
  - Devuelve { "received": N, "stored": M, "rejected": R }

El frontend no cambia — la URL del endpoint es idéntica.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Request
from pydantic import BaseModel, ValidationError
from sqlmodel import Session

from services.api.database import engine
from services.api.models import TelemetryRecord

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

# ---------------------------------------------------------------------------
# Modelos Pydantic (sin cambios desde HITO 16 — el contrato se reutiliza)
# ---------------------------------------------------------------------------


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


class TelemetryBatchResponse(BaseModel):
    """Response acknowledging received, stored and rejected events."""

    received: int
    stored: int
    rejected: int


# ---------------------------------------------------------------------------
# Helpers de mapeo envelope → fila
# ---------------------------------------------------------------------------

def _derive_level(event_type: str) -> str:
    """Derive severity level from the event type."""
    error_patterns = ("_failed", "_error", "_rejected",
                      "_captured", "_exceeded")
    warn_patterns = ("_expired", "_abandoned", "_threshold")
    if event_type.endswith(error_patterns):
        return "error"
    if event_type.endswith(warn_patterns):
        return "warn"
    return "info"


_VALUE_KEYS: dict[str, str] = {
    "inbound_order_created": "quantity",
    "outbound_order_created": "quantity",
    "stock_threshold_triggered": "quantity",
    "direct_stock_edit_rejected": "quantity",
    "inventory_discrepancy_detected": "quantity",
    "api_latency_recorded": "duration_ms",
    "api_error_recorded": "status_code",
    "frontend_page_load_recorded": "duration_ms",
    "frontend_error_captured": "status_code",
}


def _extract_value(event_type: str, properties: dict[str, Any]) -> float | None:
    """Extract the numeric value field for the `value` column, if applicable."""
    key = _VALUE_KEYS.get(event_type)
    if key is None:
        return None
    raw = properties.get(key)
    if raw is None:
        return None
    try:
        return float(raw)
    except (ValueError, TypeError):
        return None


def _build_message(event_type: str, properties: dict[str, Any]) -> str | None:
    """Build a short human-readable summary of the event."""
    messages: dict[str, str] = {
        "inbound_order_created": "Inbound order created",
        "outbound_order_created": "Outbound order created",
        "stock_threshold_triggered": "Stock threshold triggered",
        "direct_stock_edit_rejected": "Direct stock edit rejected",
        "inventory_discrepancy_detected": "Inventory discrepancy detected",
        "inventory_validation_failed": "Inventory validation failed",
        "inbound_order_cancelled": "Inbound order cancelled",
        "auth_login_failed": "Login failed",
        "auth_login_succeeded": "Login succeeded",
        "session_expired": "Session expired",
        "api_latency_recorded": "API latency recorded",
        "api_error_recorded": "API error recorded",
        "frontend_page_load_recorded": "Page load recorded",
        "frontend_error_captured": "Frontend error captured",
        "backoffice_page_viewed": "Page viewed",
        "inventory_flow_abandoned": "Inventory flow abandoned",
    }
    base = messages.get(event_type, event_type)
    # Append context from properties when available
    ctx_parts: list[str] = []
    if "warehouse" in properties:
        ctx_parts.append(f"warehouse={properties['warehouse']}")
    if "view" in properties:
        ctx_parts.append(f"view={properties['view']}")
    if "route" in properties:
        ctx_parts.append(f"route={properties['route']}")
    if "failure_reason" in properties:
        ctx_parts.append(f"reason={properties['failure_reason']}")
    if "error_class" in properties:
        ctx_parts.append(f"class={properties['error_class']}")
    if ctx_parts:
        return f"{base} ({', '.join(ctx_parts)})"
    return base


def _envelope_to_record(
    event: TelemetryEnvelope,
    index: int,
) -> TelemetryRecord:
    """Map a validated TelemetryEnvelope to a TelemetryRecord row.

    All envelope fields (eventId, sessionId, userId, schemaVersion, requestId)
    are stored inside the ``tags`` JSONB column so that the fixed columns remain
    query-friendly for the analytical dashboard.
    """
    tags: dict[str, Any] = dict(event.properties)
    # Conservar campos del envelope en tags para trazabilidad analítica
    tags["eventId"] = event.eventId
    if event.sessionId is not None:
        tags["sessionId"] = event.sessionId
    if event.userId is not None:
        tags["userId"] = event.userId
    tags["schemaVersion"] = event.schemaVersion
    if event.requestId is not None:
        tags["requestId"] = event.requestId

    # Parsear timestamp ISO → datetime
    try:
        parsed_ts = datetime.fromisoformat(
            event.timestamp.replace("Z", "+00:00")
        )
    except (ValueError, TypeError):
        parsed_ts = datetime.now(timezone.utc)

    return TelemetryRecord(
        id=str(uuid4()),
        timestamp=parsed_ts,
        service="backoffice",
        event_type=event.event_type,
        level=_derive_level(event.event_type),
        value=_extract_value(event.event_type, event.properties),
        message=_build_message(event.event_type, event.properties),
        tags=tags,
    )


# ---------------------------------------------------------------------------
# Endpoint real
# ---------------------------------------------------------------------------


@router.post("/events", response_model=TelemetryBatchResponse)
async def receive_telemetry(
    request: Request,
) -> TelemetryBatchResponse:
    """Accept a batch of telemetry events, validate per-event, bulk insert.

    El body se parsea de forma laxa (dict crudo) — NO se declara como
    ``list[TelemetryEnvelope]`` en la firma del endpoint.  Esto evita que
    FastAPI rechace todo el lote con 422 si un solo evento es inválido.

    En su lugar, se itera manualmente y se valida cada item con
    ``TelemetryEnvelope.model_validate()`` dentro de un try/except
    ValidationError.  Los eventos válidos se acumulan para bulk insert;
    los inválidos incrementan el contador ``rejected``.
    """
    raw = await request.json()
    raw_events: list[dict[str, Any]] = raw.get("events", [])
    total = len(raw_events)

    if total == 0:
        return TelemetryBatchResponse(received=0, stored=0, rejected=0)

    valid: list[TelemetryRecord] = []
    rejected = 0

    for i, raw_item in enumerate(raw_events):
        try:
            validated = TelemetryEnvelope.model_validate(raw_item)
            record = _envelope_to_record(validated, i)
            valid.append(record)
        except ValidationError as exc:
            rejected += 1
            logger.warning(
                "Telemetry event #%d rejected: %s",
                i,
                "; ".join(f"{e['loc']}: {e['msg']}" for e in exc.errors()),
            )
        except Exception as exc:
            rejected += 1
            logger.warning(
                "Telemetry event #%d rejected (unexpected): %s", i, exc,
            )

    # Capturar event_types ANTES de la sesión para evitar acceso detached
    event_types = [r.event_type for r in valid]

    # Bulk insert: una sola operación para todos los eventos válidos
    stored = 0
    if valid:
        try:
            with Session(engine) as session:
                session.add_all(valid)
                session.commit()
                stored = len(valid)
        except Exception as exc:
            logger.error(
                "Telemetry bulk insert failed (%d events): %s",
                len(valid),
                exc,
            )
            # Si falla la DB, contamos los eventos como no almacenados
            rejected += len(valid)
            stored = 0

    logger.info(
        "Telemetry received=%d stored=%d rejected=%d event_types=%s",
        total,
        stored,
        rejected,
        event_types,
    )

    return TelemetryBatchResponse(
        received=total,
        stored=stored,
        rejected=rejected,
    )
