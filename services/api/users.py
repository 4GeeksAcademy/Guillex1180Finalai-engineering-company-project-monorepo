"""TinyDB services for user credentials and linked profiles."""

from __future__ import annotations

from datetime import datetime, timezone
import secrets
from typing import Any

from passlib.hash import bcrypt
from tinydb import TinyDB

from services.api.database import _tinydb_path
from services.api.models import (
    ProfileUpdate,
    UserCreate,
    UserRole,
    UserSelfUpdate,
    UserUpdate,
)


class DuplicateEmailError(ValueError):
    """Raised when a registration or update uses an existing email."""


def _users(db: TinyDB):
    return db.table("users")


def _profiles(db: TinyDB):
    return db.table("profiles")


def _user_dict(document: Any) -> dict[str, Any]:
    return dict(document)


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    with TinyDB(_tinydb_path()) as db:
        user = _users(db).get(lambda item: item.get("id") == user_id)
        return _user_dict(user) if user is not None else None


def get_user_by_email(email: str) -> dict[str, Any] | None:
    normalized = email.strip().casefold()
    with TinyDB(_tinydb_path()) as db:
        user = _users(db).get(
            lambda item: isinstance(item.get("email"), str)
            and item.get("email", "").casefold() == normalized
        )
        return _user_dict(user) if user is not None else None


def list_users() -> list[dict[str, Any]]:
    with TinyDB(_tinydb_path()) as db:
        return [_user_dict(user) for user in _users(db).all() if user.get("email")]


def get_profile_by_user_id(user_id: str) -> dict[str, Any] | None:
    with TinyDB(_tinydb_path()) as db:
        profile = _profiles(db).get(
            lambda item: item.get("user_id") == user_id)
        return _user_dict(profile) if profile is not None else None


def update_profile(user_id: str, data: ProfileUpdate) -> dict[str, Any] | None:
    """Update the single profile linked to a TinyDB user ID."""
    updates = data.model_dump()
    with TinyDB(_tinydb_path()) as db:
        profiles = _profiles(db)
        profile = profiles.get(lambda item: item.get("user_id") == user_id)
        if profile is None:
            return None
        updated = {**dict(profile), **updates}
        profiles.update(updates, doc_ids=[profile.doc_id])
        return updated


def create_user(data: UserCreate) -> dict[str, Any]:
    """Create a user and its one-to-one profile in one TinyDB operation."""
    email = data.email.strip().casefold()
    with TinyDB(_tinydb_path()) as db:
        users = _users(db)
        if users.contains(
            lambda item: isinstance(item.get("email"), str)
            and item.get("email", "").casefold() == email
        ):
            raise DuplicateEmailError("A user with this email already exists")

        user_document = {
            "id": secrets.token_urlsafe(18),
            "email": email,
            "hashed_password": bcrypt.hash(data.password),
            "is_active": True,
            "role": UserRole.USER.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        profile_document = {
            "id": secrets.token_urlsafe(18),
            "user_id": user_document["id"],
            "name": data.name or "",
            "phone": data.phone,
            "address": data.address,
        }

        # TinyDB has no multi-table transaction. Preserve all-or-nothing behavior
        # by deleting the user if the profile insert fails.
        user_doc_id = users.insert(user_document)
        try:
            _profiles(db).insert(profile_document)
        except Exception:
            users.remove(doc_ids=[user_doc_id])
            raise
        return user_document


def update_user(
    user_id: str,
    data: UserUpdate | UserSelfUpdate,
) -> dict[str, Any] | None:
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise ValueError("At least one field must be provided")
    if updates.get("role") is not None:
        updates["role"] = updates["role"].value
    if "password" in updates:
        updates["hashed_password"] = bcrypt.hash(updates.pop("password"))
    if "email" in updates and updates["email"] is not None:
        updates["email"] = updates["email"].casefold()

    with TinyDB(_tinydb_path()) as db:
        users = _users(db)
        user = users.get(lambda item: item.get("id") == user_id)
        if user is None or not user.get("email"):
            return None
        if "email" in updates and users.contains(
            lambda item: item.get("id") != user_id
            and isinstance(item.get("email"), str)
            and item.get("email", "").casefold() == updates["email"]
        ):
            raise DuplicateEmailError("A user with this email already exists")
        updated = {**dict(user), **updates}
        users.update(updates, doc_ids=[user.doc_id])
        return updated


def delete_user(user_id: str) -> bool:
    with TinyDB(_tinydb_path()) as db:
        users = _users(db)
        user = users.get(lambda item: item.get("id") == user_id)
        if user is None or not user.get("email"):
            return False
        _profiles(db).remove(lambda item: item.get("user_id") == user_id)
        users.remove(doc_ids=[user.doc_id])
        return True


def is_admin(user: dict[str, Any]) -> bool:
    return user.get("role") == UserRole.ADMIN.value
