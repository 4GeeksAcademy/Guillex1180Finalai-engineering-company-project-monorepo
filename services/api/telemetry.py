"""Validated, privacy-bounded telemetry event creation for the SQL outbox."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5

from sqlmodel import Session, select

from services.api.models import TelemetryEvent

SCHEMA_PATH = Path(__file__).resolve(
).parents[2] / "docs" / "telemetry" / "event-schemas.json"


@lru_cache(maxsize=1)
def _schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def event_id_for(*parts: object) -> str:
    """Return a deterministic UUID for a domain transition and event name."""
    key = ":".join(str(part) for part in parts)
    return str(uuid4()) if not key else str(uuid5(NAMESPACE_URL, key))


def _resolve_schema(ref: str) -> dict[str, Any]:
    if not ref.startswith("#/definitions/"):
        raise ValueError("Unsupported telemetry schema reference")
    return _schema()["definitions"][ref.rsplit("/", 1)[1]]


def _validate_value(value: Any, spec: dict[str, Any], path: str) -> None:
    if "$ref" in spec:
        _validate_value(value, _resolve_schema(spec["$ref"]), path)
        return

    expected = spec.get("type")
    valid = {
        "null": lambda: value is None,
        "string": lambda: isinstance(value, str),
        "integer": lambda: isinstance(value, int) and not isinstance(value, bool),
        "number": lambda: isinstance(value, (int, float)) and not isinstance(value, bool),
        "boolean": lambda: isinstance(value, bool),
        "object": lambda: isinstance(value, dict),
        "array": lambda: isinstance(value, list),
    }
    types = expected if isinstance(expected, list) else [expected]
    if expected is not None and not any(valid[t]() for t in types if t in valid):
        raise ValueError(f"Telemetry field {path} has an invalid type")
    if "enum" in spec and value not in spec["enum"]:
        raise ValueError(f"Telemetry field {path} is outside its allowlist")
    if "const" in spec and value != spec["const"]:
        raise ValueError(f"Telemetry field {path} has an invalid constant")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in spec and value < spec["minimum"]:
            raise ValueError(f"Telemetry field {path} is below its minimum")
        if "maximum" in spec and value > spec["maximum"]:
            raise ValueError(f"Telemetry field {path} exceeds its maximum")
    if isinstance(value, str):
        if len(value) < spec.get("minLength", 0):
            raise ValueError(f"Telemetry field {path} is too short")
        if len(value) > spec.get("maxLength", float("inf")):
            raise ValueError(f"Telemetry field {path} is too long")
        if "pattern" in spec and re.fullmatch(spec["pattern"], value) is None:
            raise ValueError(f"Telemetry field {path} has an invalid format")
        if spec.get("format") == "uuid":
            try:
                UUID(value)
            except ValueError as error:
                raise ValueError(
                    f"Telemetry field {path} must be a UUID") from error
        if spec.get("format") == "date-time":
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError as error:
                raise ValueError(
                    f"Telemetry field {path} must be an ISO date-time") from error


def _validate_event(event: dict[str, Any]) -> None:
    schema = _schema()
    envelope_schema = schema["properties"]
    if set(event) != set(schema["required"]):
        raise ValueError(
            "Telemetry envelope does not match its closed contract")
    for key, value in event.items():
        if key == "properties":
            continue
        _validate_value(value, envelope_schema[key], key)

    allowed_event_types = envelope_schema["event_type"].get("enum", [])
    if event["event_type"] not in allowed_event_types:
        raise ValueError("Unknown telemetry event type")

    event_type = event["event_type"]
    definition = schema["definitions"].get(event_type)
    if not isinstance(definition, dict) or "x-event" not in definition:
        raise ValueError("Unknown telemetry event type")
    payload = event["properties"]
    if not isinstance(payload, dict):
        raise ValueError("Telemetry properties must be an object")
    props_schema = definition
    if set(payload) != set(props_schema.get("required", [])):
        raise ValueError(
            f"Properties for {event_type} do not match its allowlist")
    for key, value in payload.items():
        prop_schema = props_schema["properties"].get(key)
        if prop_schema is None:
            raise ValueError(
                f"Telemetry property {key} is not allowed for {event_type}")
        _validate_value(value, prop_schema, f"properties.{key}")


def record_event(
    session: Session,
    *,
    event_type: str,
    properties: dict[str, Any],
    delivery: str,
    event_id: str | None = None,
    user_id: str | None = None,
    request_id: str | None = None,
    session_id: str | None = None,
) -> TelemetryEvent:
    """Validate against the shared Draft-07 contract and stage an outbox row."""
    event_id = event_id or str(uuid4())
    existing = session.exec(
        select(TelemetryEvent).where(TelemetryEvent.event_id == event_id)
    ).first()
    if existing is not None:
        return existing

    timestamp = datetime.now(timezone.utc)
    envelope = {
        "eventId": event_id,
        "timestamp": timestamp.isoformat().replace("+00:00", "Z"),
        "sessionId": session_id,
        "userId": user_id,
        "event_type": event_type,
        "schemaVersion": "1.0.0",
        "requestId": request_id,
        "properties": properties,
    }
    _validate_event(envelope)
    expected_delivery = _schema(
    )["definitions"][event_type]["x-event"]["delivery"]
    if delivery != expected_delivery:
        raise ValueError(f"Telemetry delivery must be {expected_delivery}")

    row = TelemetryEvent(
        event_id=event_id,
        event_type=event_type,
        timestamp=timestamp,
        session_id=session_id,
        user_id=user_id,
        request_id=request_id,
        properties=properties,
        delivery=delivery,
    )
    session.add(row)
    return row
