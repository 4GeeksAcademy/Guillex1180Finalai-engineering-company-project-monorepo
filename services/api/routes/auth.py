"""JWT login and authenticated-user endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from passlib.hash import bcrypt

from services.api.models import AccessTokenResponse, AuthMeResponse
from services.api.security import CurrentUser, create_access_token
from services.api.users import get_profile_by_user_id, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AccessTokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> AccessTokenResponse:
    # OAuth2 form uses `username`; accept email here as the identifier.
    user = get_user_by_email(form_data.username)
    password_matches = False
    if (
        user is not None
        and user.get("email")
        and user.get("is_active", False)
        and isinstance(user.get("hashed_password"), str)
    ):
        try:
            password_matches = bcrypt.verify(
                form_data.password, user["hashed_password"])
        except (TypeError, ValueError):
            # Treat corrupted/legacy hashes exactly like invalid credentials.
            password_matches = False
    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        encoded_token, expires_in = create_access_token(user["id"])
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT authentication is not configured correctly",
        ) from exc
    return AccessTokenResponse(
        access_token=encoded_token,
        token_type="bearer",
        expires_in=expires_in,
    )


@router.get("/me", response_model=AuthMeResponse)
def read_authenticated_user(current_user: CurrentUser) -> dict[str, object]:
    profile = get_profile_by_user_id(current_user["id"])
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for the authenticated user",
        )
    return {
        "email": current_user["email"],
        "role": current_user["role"],
        "profile": profile,
    }
