"""SQLModel persistence and TinyDB-backed operator authentication for TrackFlow."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine
from tinydb import TinyDB


def _load_dotenv_if_present() -> None:
    env_file = Path(__file__).resolve().parents[2] / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"").strip("\x27")
        os.environ.setdefault(key, value)


def _database_url() -> str:
    _load_dotenv_if_present()
    supabase_url = os.getenv("SUPABASE_DATABASE_URL", "").strip()
    if supabase_url:
        # The standard PostgreSQL URL defaults to psycopg2 in SQLAlchemy.
        # Railway installs psycopg v3, so select that driver explicitly.
        if supabase_url.startswith("postgresql://"):
            return supabase_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )
        return supabase_url
    return os.getenv("INVENTORY_DATABASE_URL", "sqlite:///./data/trackflow_inventory.db")


def _make_engine():
    url = _database_url()
    if url.startswith("sqlite"):
        Path("data").mkdir(parents=True, exist_ok=True)
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


engine = _make_engine()


def create_db_and_tables() -> None:
    # Register only inventory-ledger SQLModels; User and Profile are Pydantic
    # records stored exclusively in TinyDB and must never become SQL tables.
    from services.api.models import (  # noqa: F401
        InventoryAudit,
        InventoryClient,
        SKU,
        StockEntry,
        StockExit,
        TelemetryEvent,
        TelemetryRecord,
    )
    from services.reporting.models import (  # noqa: F401
        PipelineRunLog,
        WeeklyWarehouseClientPerformance,
    )

    _ensure_sku_columns()
    SQLModel.metadata.create_all(engine)
    _migrate_inventory_schema()
    _ensure_telemetry_indexes()


def _ensure_sku_columns() -> None:
    """Add SKU columns before create_all tries to create indexes on them."""
    inspector = inspect(engine)
    if "sku" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("sku")}
    with engine.begin() as connection:
        if "client_id" not in columns:
            connection.execute(
                text("ALTER TABLE sku ADD COLUMN client_id VARCHAR"))
        if "threshold_quantity" not in columns:
            connection.execute(
                text("ALTER TABLE sku ADD COLUMN threshold_quantity INTEGER"))


def _migrate_inventory_schema() -> None:
    """Apply additive SQLite-compatible columns and canonical client backfill."""
    inspector = inspect(engine)
    if "sku" not in inspector.get_table_names():
        return
    with engine.begin() as connection:
        rows = connection.execute(
            text("SELECT DISTINCT client_name FROM sku WHERE client_id IS NULL")
        ).all()
        for (client_name,) in rows:
            normalized = str(client_name).strip().casefold()
            if not normalized:
                continue
            existing = connection.execute(
                text("SELECT id FROM inventoryclient WHERE normalized_name = :name"),
                {"name": normalized},
            ).first()
            if existing is None:
                import uuid

                client_id = str(uuid.uuid5(uuid.NAMESPACE_URL,
                                f"trackflow-client:{normalized}"))
                connection.execute(
                    text(
                        "INSERT INTO inventoryclient (id, name, normalized_name) VALUES (:id, :name, :normalized)"),
                    {"id": client_id, "name": str(
                        client_name).strip(), "normalized": normalized},
                )
            else:
                client_id = existing[0]
            connection.execute(
                text(
                    "UPDATE sku SET client_id = :client_id WHERE client_id IS NULL AND client_name = :client_name"),
                {"client_id": client_id, "client_name": client_name},
            )


def _ensure_telemetry_indexes() -> None:
    """Create GIN index on tags (PostgreSQL) or b-tree (SQLite)."""
    inspector = inspect(engine)
    if "telemetry_events" not in inspector.get_table_names():
        return
    existing = {idx["name"]
                for idx in inspector.get_indexes("telemetry_events")}
    url = str(engine.url)
    with engine.begin() as connection:
        if "ix_telemetry_events_tags" not in existing:
            if url.startswith("sqlite"):
                connection.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS ix_telemetry_events_tags "
                        "ON telemetry_events (tags)"
                    )
                )
            else:
                connection.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS ix_telemetry_events_tags "
                        "ON telemetry_events USING GIN (tags)"
                    )
                )


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def _tinydb_path() -> Path:
    path = Path(os.getenv("TINYDB_PATH", "./data/tinydb.json"))
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def provision_bootstrap_user() -> None:
    """Retained as a no-op for compatibility with the existing API lifespan.

    Account provisioning must use the public registration or an explicit
    administrative operation; bearer-token bootstrap records are not JWT users.
    """
    return None
