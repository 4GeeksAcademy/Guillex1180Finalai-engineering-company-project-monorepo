"""Tests for TinyDB profile and JWT authentication services/routes."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from passlib.hash import bcrypt
from tinydb import TinyDB

from services.api.database import _tinydb_path
from services.api.models import ProfileUpdate, UserCreate, UserUpdate
from services.api.routes.auth import login, read_authenticated_user
from services.api.routes.profiles import read_my_profile, update_my_profile
from services.api.routes.users import get_user, get_users, put_user, remove_user
from services.api.security import create_access_token, get_current_user
from services.api.users import create_user


class AuthProfileTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / "auth-tinydb.json")
        self.env_patch = patch.dict(os.environ, {
            "TINYDB_PATH": self.database_path,
            "SECRET_KEY": "test-jwt-signing-key-at-least-32-bytes",
            "ALGORITHM": "HS256",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "10",
        })
        self.env_patch.start()
        self.addCleanup(self.env_patch.stop)
        self.addCleanup(self.temp_dir.cleanup)
        self.user = create_user(UserCreate(
            email="operator@example.com",
            password="correct-horse-battery",
            name="Operator",
            phone="+1 213 555 0147",
            address="Los Angeles",
        ))

    def _access_token(self) -> str:
        response = login(OAuth2PasswordRequestForm(
            username="operator@example.com", password="correct-horse-battery"))
        self.assertEqual(response.token_type, "bearer")
        self.assertEqual(response.expires_in, 600)
        return response.access_token

    def test_login_and_auth_me_return_linked_profile_without_password_hash(self) -> None:
        token = self._access_token()
        current_user = get_current_user(token)
        response = read_authenticated_user(current_user)

        self.assertEqual(response["email"], "operator@example.com")
        self.assertEqual(response["role"], "user")
        self.assertEqual(response["profile"]["user_id"], self.user["id"])
        self.assertEqual(response["profile"]["name"], "Operator")
        self.assertNotIn("hashed_password", response)

    def test_profile_get_and_update_are_scoped_to_authenticated_user(self) -> None:
        token = self._access_token()
        current_user = get_current_user(token)

        profile = read_my_profile(current_user)
        self.assertEqual(profile["user_id"], self.user["id"])
        updated = update_my_profile(ProfileUpdate(
            name="New Name",
            phone="+34 976 123 456",
            address="Zaragoza",
        ), current_user)
        self.assertEqual(updated["name"], "New Name")
        self.assertEqual(updated["address"], "Zaragoza")

    def test_user_routes_return_forbidden_for_another_users_record(self) -> None:
        other_user = create_user(UserCreate(
            email="other@example.com", password="another-secure-password"))
        current_user = self.user

        with self.assertRaises(HTTPException) as read_error:
            get_user(other_user["id"], current_user)
        self.assertEqual(read_error.exception.status_code, 403)

        with self.assertRaises(HTTPException) as update_error:
            put_user(other_user["id"], UserUpdate(
                email="changed@example.com"), current_user)
        self.assertEqual(update_error.exception.status_code, 403)

        with self.assertRaises(HTTPException) as delete_error:
            remove_user(other_user["id"], current_user)
        self.assertEqual(delete_error.exception.status_code, 403)

        with self.assertRaises(HTTPException) as list_error:
            get_users(current_user)
        self.assertEqual(list_error.exception.status_code, 403)

    def test_wrong_password_is_unauthorized(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            login(OAuth2PasswordRequestForm(
                username="operator@example.com", password="wrong-password"))
        self.assertEqual(raised.exception.status_code, 401)

    def test_expired_and_malformed_tokens_are_unauthorized(self) -> None:
        expired = jwt.encode({
            "sub": self.user["id"],
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        }, os.environ["SECRET_KEY"], algorithm="HS256")
        for token in (expired, "not-a-jwt"):
            with self.subTest(token=token[:12]):
                with self.assertRaises(HTTPException) as raised:
                    get_current_user(token)
                self.assertEqual(raised.exception.status_code, 401)

    def test_missing_or_non_bearer_authorization_is_unauthorized(self) -> None:
        with self.assertRaises(HTTPException) as missing:
            get_current_user(None)
        self.assertEqual(missing.exception.status_code, 401)

        with self.assertRaises(HTTPException) as malformed:
            get_current_user("not-a-jwt")
        self.assertEqual(malformed.exception.status_code, 401)

    def test_invalid_token_expiration_configuration_fails_closed(self) -> None:
        for value in ("0", "not-an-integer"):
            with self.subTest(value=value), patch.dict(os.environ, {
                "ACCESS_TOKEN_EXPIRE_MINUTES": value,
            }):
                with self.assertRaises(RuntimeError):
                    create_access_token(self.user["id"])

    def test_tinydb_keeps_password_hash_in_user_and_contact_in_profile(self) -> None:
        with TinyDB(_tinydb_path()) as db:
            stored_user = db.table("users").get(
                lambda item: item.get("email") == "operator@example.com")
            self.assertIsNotNone(stored_user)
            assert stored_user is not None
            self.assertTrue(bcrypt.verify(
                "correct-horse-battery", stored_user["hashed_password"]))
            self.assertNotIn("name", stored_user)
            profile = db.table("profiles").get(
                lambda item: item.get("user_id") == stored_user["id"])
            self.assertIsNotNone(profile)
            assert profile is not None
            self.assertEqual(
                set(("id", "user_id", "name", "phone", "address")) - profile.keys(), set())


if __name__ == "__main__":
    unittest.main()
