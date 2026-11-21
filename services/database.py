"""SQLModel persistence and TinyDB-backed operator authentication for TrackFlow."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine
from tinydb import TinyDB


def _database_url() -> str:
    return os.getenv("INVENTORY_DATABASE_URL", "sqlite:///./data/trackflow_inventory.db")


def _make_engine():
    url = _database_url()
    if url.startswith("sqlite"):
        Path("data").mkdir(parents=True, exist_ok=True)
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


engine = _make_engine()


def create_db_and_tables() -> None:
    # Import models before metadata.create_all registers their table definitions.
    from services import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def _tinydb_path() -> Path:
    path = Path(os.getenv("TINYDB_PATH", "./data/tinydb.json"))
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def find_user_uuid_for_token(token: str) -> str | None:
    """Resolve a bearer token against TinyDB without keeping raw tokens there."""
    digest = token_digest(token)
    with TinyDB(_tinydb_path()) as db:
        for user in db.table("users").all():
            stored_digest = user.get("token_sha256")
            if isinstance(stored_digest, str) and stored_digest == digest:
                value = user.get("user_uuid") or user.get("uuid")
                return str(value) if value else None
    return None


def provision_bootstrap_user() -> None:
    """Optionally add a local API operator using environment-provided credentials."""
    token = os.getenv("TRACKFLOW_BOOTSTRAP_TOKEN", "").strip()
    user_uuid = os.getenv("TRACKFLOW_BOOTSTRAP_USER_UUID", "").strip()
    if not token or not user_uuid:
        return
    digest = token_digest(token)
    with TinyDB(_tinydb_path()) as db:
        users = db.table("users")
        if not any(user.get("token_sha256") == digest for user in users.all()):
            users.insert({"user_uuid": user_uuid, "token_sha256": digest})
