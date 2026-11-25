"""Idempotency and coverage tests for the HITO 15 demo inventory seed."""

from __future__ import annotations

from sqlmodel import Session, SQLModel, create_engine, select

from services.api import seed as inventory_seed
from services.api.models import InventoryAudit, SKU, StockEntry, StockExit, TelemetryEvent


def test_inventory_seed_is_idempotent_and_records_expected_events(
    tmp_path, monkeypatch
) -> None:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'seed.sqlite'}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    tinydb_path = tmp_path / "seed-tinydb.json"
    monkeypatch.setattr(inventory_seed, "engine", engine)
    monkeypatch.setattr(inventory_seed, "create_db_and_tables", lambda: None)
    monkeypatch.setattr(inventory_seed, "_tinydb_path", lambda: tinydb_path)

    inventory_seed.seed()
    inventory_seed.seed()

    with Session(engine) as session:
        assert len(session.exec(select(SKU)).all()) == 10
        assert len(session.exec(select(StockEntry)).all()) == 18
        assert len(session.exec(select(StockExit)).all()) == 20
        assert len(session.exec(select(InventoryAudit)).all()) == 1
        events = session.exec(select(TelemetryEvent)).all()

    event_types = [event.event_type for event in events]
    assert event_types.count("inbound_order_created") == 18
    assert event_types.count("outbound_order_created") == 20
    assert event_types.count("stock_threshold_triggered") == 2
    assert event_types.count("inventory_discrepancy_detected") == 1
    assert all(event.status == "pending" for event in events)
    engine.dispose()
