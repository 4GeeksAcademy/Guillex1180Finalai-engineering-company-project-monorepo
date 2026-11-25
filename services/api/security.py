"""JWT bearer authentication for TinyDB-backed accounts."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from jose import JWTError, jwt

from services.api.users import get_user_by_id

# Read local developer configuration without ever providing a code-level secret.
load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _jwt_secret() -> str:
    # SECRET_KEY is the canonical AUTH-01 setting. Keep the old name as a
    # temporary compatibility fallback for existing local Codespaces.
    secret = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET_KEY", "")).strip()
    if len(secret) < 32:
        raise RuntimeError(
            "SECRET_KEY must be configured with at least 32 characters")
    return secret


def _jwt_algorithm() -> str:
    algorithm = os.getenv("ALGORITHM", "HS256").strip()
    # AUTH-01 uses a shared secret, so only allow its expected HMAC algorithm.
    if algorithm != "HS256":
        raise RuntimeError("ALGORITHM must be HS256")
    return algorithm


def _access_token_expiration_minutes() -> int:
    raw_value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    try:
        minutes = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(
            "ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer") from exc
    if minutes < 1:
        raise RuntimeError(
            "ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer")
    return minutes


def create_access_token(user_id: str) -> tuple[str, int]:
    """Create a signed bearer JWT and return its configured lifetime in seconds."""
    minutes = _access_token_expiration_minutes()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    encoded = jwt.encode(
        {"sub": user_id, "exp": expires_at},
        _jwt_secret(),
        algorithm=_jwt_algorithm(),
    )
    return encoded, minutes * 60


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> dict[str, Any]:
    """Decode a signed access token and retrieve its active TinyDB user."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise unauthorized

    try:
        algorithm = _jwt_algorithm()
        payload = jwt.decode(token, _jwt_secret(), algorithms=[algorithm])
        _access_token_expiration_minutes()
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            raise unauthorized
    except (JWTError, RuntimeError) as exc:
        if isinstance(exc, RuntimeError):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="JWT authentication is not configured",
            ) from exc
        raise unauthorized from exc

    user = get_user_by_id(user_id)
    if user is None or not user.get("email") or not user.get("is_active", False):
        raise unauthorized
    return user


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
