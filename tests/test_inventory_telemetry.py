"""Focused tests for HITO 15 inventory persistence and telemetry."""

from __future__ import annotations

from sqlmodel import Session, SQLModel, create_engine, select

from services.api.database import _ensure_sku_columns, _migrate_inventory_schema
from services.api.models import (
    InventoryAudit,
    InventoryClient,
    SKU,
    StockEntry,
    StockExit,
    TelemetryEvent,
)
from services.api.telemetry import event_id_for, record_event


def test_migration_adds_columns_and_backfills_canonical_clients() -> None:
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE sku (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, "
            "sku VARCHAR NOT NULL, client_name VARCHAR NOT NULL, "
            "category VARCHAR NOT NULL, warehouse VARCHAR NOT NULL)"
        )
        connection.exec_driver_sql(
            "INSERT INTO sku (id, name, sku, client_name, category, warehouse) "
            "VALUES (1, 'One', 'S1', ' Acmé ', 'electronics', 'LA'), "
            "(2, 'Two', 'S2', 'acmé', 'electronics', 'LA')"
        )
    SQLModel.metadata.create_all(
        engine,
        tables=[InventoryClient.__table__,
                InventoryAudit.__table__, TelemetryEvent.__table__],
    )

    _migrate_inventory_schema_for_engine(engine)

    with engine.connect() as connection:
        rows = connection.exec_driver_sql(
            "SELECT client_id FROM sku ORDER BY id").all()
        columns = {row["name"] for row in connection.exec_driver_sql(
            "PRAGMA table_info(sku)").mappings()}
    assert rows[0][0] == rows[1][0]
    assert rows[0][0]
    assert {"client_id", "threshold_quantity"} <= columns
    engine.dispose()


def _migrate_inventory_schema_for_engine(engine) -> None:
    """Run the production additive migration against a temporary engine."""
    from unittest.mock import patch

    with patch("services.api.database.engine", engine):
        _ensure_sku_columns()
        _migrate_inventory_schema()


def test_event_outbox_is_schema_valid_and_deterministic_per_transition() -> None:
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(
        engine,
        tables=[
            SKU.__table__, StockEntry.__table__, StockExit.__table__,
            InventoryClient.__table__, InventoryAudit.__table__, TelemetryEvent.__table__,
        ],
    )
    event_key = event_id_for("inbound_order_created", 42)
    properties = {
        "warehouse": "los_angeles",
        "client_id": "opaque-client-id",
        "product_id": "7",
        "product_category": "moda",
        "quantity": 3,
        "order_id": "42",
    }
    with Session(engine) as session:
        record_event(
            session,
            event_type="inbound_order_created",
            properties=properties,
            delivery="stream",
            event_id=event_key,
        )
        session.commit()
    with Session(engine) as session:
        event = session.exec(select(TelemetryEvent)).one()
        assert event.event_id == event_key
        assert event.status == "pending"
        assert event.properties == properties
        record_event(
            session,
            event_type="inbound_order_created",
            properties=properties,
            delivery="stream",
            event_id=event_key,
        )
        session.commit()
        assert len(session.exec(select(TelemetryEvent)).all()) == 1
    engine.dispose()
