"""SQLModel persistence and TinyDB-backed operator authentication for TrackFlow."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

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
    from services.api.models import SKU, StockEntry, StockExit  # noqa: F401

    SQLModel.metadata.create_all(engine)


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
