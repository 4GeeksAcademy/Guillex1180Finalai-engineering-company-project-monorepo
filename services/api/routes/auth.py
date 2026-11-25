"""JWT login and authenticated-user endpoints."""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from passlib.hash import bcrypt
from sqlmodel import Session

from services.api.database import engine
from services.api.models import AccessTokenResponse, AuthMeResponse
from services.api.security import CurrentUser, create_access_token
from services.api.telemetry import record_event
from services.api.users import get_profile_by_user_id, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _request_id(request: Request) -> str | None:
    value = getattr(request.state, "request_id", None)
    return value if isinstance(value, str) else None


@router.post("/login", response_model=AccessTokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request_id: str | None = Depends(_request_id),
) -> AccessTokenResponse:
    return _login(form_data, request_id=request_id)


def _login(
    form_data: OAuth2PasswordRequestForm,
    request_id: str | None = None,
) -> AccessTokenResponse:
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
        _record_auth_event(
            "auth_login_failed",
            {"failure_reason": "invalid_credentials", "client_version": "unknown"},
            request_id=request_id,
        )
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


def _record_auth_event(
    event_type: str,
    properties: dict[str, str],
    *,
    request_id: str | None = None,
) -> None:
    """Persist privacy-bounded authentication telemetry on a best-effort basis."""
    try:
        with Session(engine) as session:
            record_event(
                session,
                event_type=event_type,
                properties=properties,
                delivery="stream",
                event_id=str(uuid4()),
                request_id=request_id,
            )
            session.commit()
    except Exception:
        # A telemetry outage must not alter the generic authentication response.
        return


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
