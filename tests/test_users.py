"""Tests for TinyDB user and profile services."""

from __future__ import annotations

import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from passlib.hash import bcrypt

from services.api.models import UserCreate, UserRole, UserUpdate
from services.api.users import (
    DuplicateEmailError,
    create_user,
    delete_user,
    get_profile_by_user_id,
    get_user_by_email,
    get_user_by_id,
    list_users,
    update_user,
)


class UserServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = str(Path(self.temp_dir.name) / "test-tinydb.json")
        self.environment = patch.dict(
            os.environ, {"TINYDB_PATH": self.database_path})
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.addCleanup(self.temp_dir.cleanup)

    def test_create_user_hashes_password_and_creates_profile(self) -> None:
        user = create_user(UserCreate(
            email="  Operator@Example.com ",
            password="correct-horse-battery",
            name="Operator",
            phone="+1 213 555 0147",
            address="Los Angeles",
        ))

        self.assertEqual(user["email"], "operator@example.com")
        self.assertNotIn("name", user)
        self.assertNotEqual(user["hashed_password"], "correct-horse-battery")
        self.assertTrue(bcrypt.verify(
            "correct-horse-battery", user["hashed_password"]))
        self.assertEqual(user["role"], UserRole.USER.value)
        profile = get_profile_by_user_id(user["id"])
        self.assertIsNotNone(profile)
        assert profile is not None
        self.assertEqual(profile["name"], "Operator")
        self.assertEqual(profile["phone"], "+1 213 555 0147")
        self.assertEqual(profile["address"], "Los Angeles")

    def test_duplicate_email_is_rejected_case_insensitively(self) -> None:
        create_user(UserCreate(email="operator@example.com",
                    password="password-123"))
        with self.assertRaises(DuplicateEmailError):
            create_user(UserCreate(email="OPERATOR@example.com",
                        password="password-456"))

    def test_update_email_and_password_then_delete_profile_and_user(self) -> None:
        user = create_user(UserCreate(
            email="operator@example.com", password="password-123"))
        updated = update_user(
            user["id"], UserUpdate(
                email="new@example.com", password="new-password-123")
        )
        self.assertIsNotNone(updated)
        assert updated is not None
        self.assertEqual(updated["email"], "new@example.com")
        self.assertTrue(bcrypt.verify(
            "new-password-123", updated["hashed_password"]))
        self.assertIsNone(get_user_by_email("operator@example.com"))
        self.assertEqual(get_user_by_email(
            "new@example.com")["id"], user["id"])

        self.assertTrue(delete_user(user["id"]))
        self.assertIsNone(get_user_by_id(user["id"]))
        self.assertIsNone(get_profile_by_user_id(user["id"]))
        self.assertEqual(list_users(), [])

    def test_user_payload_rejects_invalid_roles(self) -> None:
        with self.assertRaises(ValueError):
            UserRole("superuser")

    def test_user_update_must_contain_non_null_field(self) -> None:
        with self.assertRaises(ValueError):
            UserUpdate()
        with self.assertRaises(ValueError):
            UserUpdate(email=None)


if __name__ == "__main__":
    unittest.main()
