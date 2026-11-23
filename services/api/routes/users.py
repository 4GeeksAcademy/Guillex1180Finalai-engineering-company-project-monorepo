"""REST endpoints for TinyDB users and their linked profiles."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from services.api.models import UserCreate, UserRead, UserSelfUpdate, UserUpdate
from services.api.security import CurrentUser
from services.api.users import (
    DuplicateEmailError,
    create_user,
    delete_user,
    get_user_by_id,
    is_admin,
    list_users,
    update_user,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(data: UserCreate) -> dict[str, Any]:
    """Public registration; the service always assigns the ``user`` role."""
    try:
        return create_user(data)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc


@router.get("", response_model=list[UserRead])
def get_users(current_user: CurrentUser) -> list[dict[str, Any]]:
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an admin may list users",
        )
    return list_users()


@router.put("/me", response_model=UserRead)
def put_my_user(data: UserSelfUpdate, current_user: CurrentUser) -> dict[str, Any]:
    """Allow a user to update own login credentials, never the role."""
    try:
        updated = update_user(current_user["id"], data)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: str, current_user: CurrentUser) -> dict[str, Any]:
    user = get_user_by_id(user_id)
    if user is None or not user.get("email"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user["id"] != current_user["id"] and not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Not allowed to access this user")
    return user


@router.put("/{user_id}", response_model=UserRead)
def put_user(
    user_id: str,
    data: UserUpdate,
    current_user: CurrentUser,
) -> dict[str, Any]:
    existing = get_user_by_id(user_id)
    if existing is None or not existing.get("email"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not is_admin(current_user) and existing["id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to update this user",
        )
    if "role" in data.model_fields_set and not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only an admin may change roles")
    try:
        updated = update_user(user_id, data)
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: str, current_user: CurrentUser) -> None:
    existing = get_user_by_id(user_id)
    if existing is None or not existing.get("email"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if existing["id"] != current_user["id"] and not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Not allowed to delete this user")
    if existing["id"] == current_user["id"] and is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An admin cannot delete their own account",
        )
    if not delete_user(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return None
