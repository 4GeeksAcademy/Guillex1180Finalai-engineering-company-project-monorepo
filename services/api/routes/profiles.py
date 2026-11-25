"""Endpoints for the authenticated user's TinyDB profile."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from services.api.models import ProfileRead, ProfileUpdate
from services.api.security import CurrentUser
from services.api.users import get_profile_by_user_id, update_profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileRead)
def read_my_profile(current_user: CurrentUser) -> dict[str, Any]:
    profile = get_profile_by_user_id(current_user["id"])
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for the authenticated user",
        )
    return profile


@router.put("/me", response_model=ProfileRead)
def update_my_profile(data: ProfileUpdate, current_user: CurrentUser) -> dict[str, Any]:
    profile = update_profile(current_user["id"], data)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for the authenticated user",
        )
    return profile
