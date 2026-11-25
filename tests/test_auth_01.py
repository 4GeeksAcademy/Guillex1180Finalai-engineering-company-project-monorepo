"""End-to-end HTTP tests for AUTH-01 and protected TrackFlow routes."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlmodel import Session, SQLModel, create_engine, select
from tinydb import TinyDB

from services.api.database import _tinydb_path
from services.api import main as api_main
from services.api.routes import auth as auth_routes
from services.api.main import app
from services.api.models import (
    InventoryAudit,
    InventoryClient,
    SKU,
    StockEntry,
    StockExit,
    TelemetryEvent,
)
from services.database import get_db

TEST_SECRET = "auth-01-test-secret-that-is-at-least-32-characters-long"
TEST_PASSWORD = "Correct-Horse-Battery-42!"
CSV_CONTENT = (
    "incident_id,date,country,customer_type,tracking_number,carrier,category,"
    "description,status,customer_email,satisfaction_score\n"
    "TRF-000001,2026-11-21,US,B2C,TRACK1234,UPS,DELAYED_DELIVERY,"
    "Package delayed,OPEN,customer@example.test,\n"
)


@pytest.fixture
def api(tmp_path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    """Use isolated TinyDB and SQLite stores without starting app lifespan."""
    monkeypatch.setenv("TINYDB_PATH", str(tmp_path / "auth-test.json"))
    monkeypatch.setenv("SECRET_KEY", TEST_SECRET)
    monkeypatch.setenv("ALGORITHM", "HS256")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

    engine = create_engine(
        f"sqlite:///{tmp_path / 'inventory-test.sqlite'}",
        connect_args={"check_same_thread": False},
    )
    # These are the only SQLModel tables used by the protected inventory API.
    SQLModel.metadata.create_all(
        engine,
        tables=[
            SKU.__table__, StockEntry.__table__, StockExit.__table__,
            InventoryClient.__table__, InventoryAudit.__table__,
            TelemetryEvent.__table__,
        ],
    )

    def isolated_db() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = isolated_db
    app.state.inventory_test_engine = engine
    client = TestClient(app)
    try:
        # Do not enter TestClient's context manager: that would run the
        # production lifespan and initialize the configured application DB.
        yield client
    finally:
        if hasattr(app.state, "inventory_test_engine"):
            del app.state.inventory_test_engine
        app.dependency_overrides.pop(get_db, None)
        client.close()
        engine.dispose()


def register(api: TestClient, email: str, name: str = "TrackFlow Operator") -> dict:
    response = api.post(
        "/users",
        json={"email": email, "password": TEST_PASSWORD, "name": name,
              "phone": "+1 555 0100", "address": "Test warehouse"},
    )
    assert response.status_code == 201, response.text
    # Keep the submitted email in this test helper for subsequent login calls;
    # the actual public registration response deliberately does not echo it.
    return {**response.json(), "email": email.strip().casefold()}


def login(api: TestClient, email: str) -> str:
    response = api.post(
        "/auth/login",
        data={"username": email, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["expires_in"] > 0
    return payload["access_token"]


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_registration_login_and_tinydb_password_hash(api: TestClient) -> None:
    response = api.post(
        "/users",
        json={"email": "Operator@Example.test", "password": TEST_PASSWORD,
              "name": "TrackFlow Operator", "phone": "+1 555 0100",
              "address": "Test warehouse"},
    )
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["role"] == "user"
    assert set(created) == {"id", "role", "created_at"}
    assert "email" not in created
    assert "password" not in created
    assert "hashed_password" not in created

    with TinyDB(_tinydb_path()) as db:
        stored_user = db.table("users").get(
            lambda item: item["id"] == created["id"])
        stored_profile = db.table("profiles").get(
            lambda item: item["user_id"] == created["id"]
        )
    assert stored_user is not None
    assert stored_user["role"] == "user"
    assert stored_user["hashed_password"] != TEST_PASSWORD
    assert stored_user["hashed_password"].startswith("$2")
    assert stored_profile is not None
    assert stored_profile["name"] == "TrackFlow Operator"
    assert stored_profile["phone"] == "+1 555 0100"

    token = login(api, "operator@example.test")
    claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
    assert claims["sub"] == created["id"]
    assert claims["exp"] > datetime.now(timezone.utc).timestamp()


def test_valid_token_opens_auth_profile_and_trackflow_endpoints(api: TestClient) -> None:
    user = register(api, "authorized@example.test")
    token = login(api, user["email"])
    headers = bearer(token)

    me = api.get("/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    assert me.json()["email"] == user["email"]
    assert me.json()["role"] == "user"
    assert "user_id" not in me.json()["profile"]

    profile = api.get("/profiles/me", headers=headers)
    assert profile.status_code == 200, profile.text
    assert set(profile.json()) == {"id", "name", "phone", "address"}
    updated_profile = api.put(
        "/profiles/me",
        headers=headers,
        json={"name": "Updated Operator",
              "phone": "+1 555 0199", "address": "Dock 7"},
    )
    assert updated_profile.status_code == 200, updated_profile.text
    assert updated_profile.json()["name"] == "Updated Operator"
    assert api.get(
        "/profiles/me", headers=headers).json()["address"] == "Dock 7"

    # Protected user self-service route remains usable for the account owner.
    own_user = api.get(f"/users/{user['id']}", headers=headers)
    assert own_user.status_code == 200, own_user.text
    assert api.put("/users/me", headers=headers,
                   json={"email": "authorized-renamed@example.test"}).status_code == 200

    # Protected supplier read endpoint (outside /users and /auth).
    assert api.get("/suppliers", headers=headers).status_code == 200

    # Exercise inventory reads and writes against the isolated local SQLite DB.
    product = api.post(
        "/inventory/products",
        headers=headers,
        json={"name": "Widget", "sku": "WIDGET-01", "client_name": "Acme",
              "category": "electronics", "warehouse": "LA"},
    )
    assert product.status_code == 201, product.text
    product_id = product.json()["id"]
    assert api.get("/inventory/products", headers=headers).status_code == 200
    assert api.get(
        f"/inventory/products/{product_id}", headers=headers).status_code == 200
    inbound = api.post(
        "/inventory/orders/inbound", headers=headers,
        json={"sku_id": product_id, "quantity": 5,
              "reference": "PO-1", "warehouse": "LA"},
    )
    assert inbound.status_code == 201, inbound.text
    outbound = api.post(
        "/inventory/orders/outbound", headers=headers,
        json={"sku_id": product_id, "quantity": 1, "exit_type": "dispatch",
              "tracking_number": "SHIP-1", "warehouse": "LA"},
    )
    assert outbound.status_code == 201, outbound.text
    history = api.get("/inventory/orders", headers=headers)
    assert history.status_code == 200, history.text
    history_payload = history.json()
    assert len(history_payload) == 2
    assert all({"sku_name", "sku_code"} <= set(row)
               and "sku" not in row and "sku_id" not in row
               for row in history_payload)
    assert {row["id"] for row in history.json()} == {
        inbound.json()["id"], outbound.json()["id"]
    }
    assert "sku" not in inbound.json()
    assert "sku" not in outbound.json()
    assert inbound.json()["user_uuid"] == user["id"]

    # Exercise incident analysis and its protected result export.
    analyzed = api.post(
        "/api/incidents/analyze", headers=headers,
        files={"file": ("incidents.csv", CSV_CONTENT, "text/csv")},
    )
    assert analyzed.status_code == 200, analyzed.text
    summary = analyzed.json()
    assert {"total_records", "valid_records", "invalid_records",
            "invalid_breakdown", "category_counts", "status_counts",
            "country_counts", "satisfaction"} == set(summary)
    exported = api.get("/api/incidents/results/export", headers=headers)
    assert exported.status_code == 200, exported.text
    assert "text/csv" in exported.headers["content-type"]


def test_inventory_outbox_threshold_audit_and_rejected_edit(api: TestClient) -> None:
    user = register(api, "inventory-events@example.test")
    headers = bearer(login(api, user["email"]))

    first = api.post(
        "/inventory/products", headers=headers,
        json={"name": "Widget", "sku": "W-1", "client_name": "  Acme  ",
              "category": "electronics", "warehouse": "LA", "threshold_quantity": 3},
    )
    second = api.post(
        "/inventory/products", headers=headers,
        json={"name": "Widget 2", "sku": "W-2", "client_name": "acme",
              "category": "electronics", "warehouse": "LA"},
    )
    assert first.status_code == second.status_code == 201
    sku_id = first.json()["id"]
    assert first.json()["client_id"] == second.json()["client_id"]
    assert first.json()["threshold_quantity"] == 3
    threshold_update = api.patch(
        f"/inventory/products/{second.json()['id']}/threshold",
        headers=headers,
        json={"threshold_quantity": 0},
    )
    assert threshold_update.status_code == 200, threshold_update.text
    assert threshold_update.json()["threshold_quantity"] == 0

    inbound = api.post(
        "/inventory/orders/inbound", headers=headers,
        json={"sku_id": sku_id, "quantity": 5,
              "reference": "PO-10", "warehouse": "LA"},
    )
    assert inbound.status_code == 201, inbound.text
    outbound = api.post(
        "/inventory/orders/outbound", headers=headers,
        json={"sku_id": sku_id, "quantity": 3,
              "exit_type": "loss", "warehouse": "LA"},
    )
    assert outbound.status_code == 201, outbound.text
    audit = api.post(
        "/inventory/audits", headers=headers,
        json={"sku_id": sku_id, "warehouse": "LA", "physical_quantity": 1},
    )
    assert audit.status_code == 201, audit.text
    assert audit.json()["system_quantity"] == 2
    assert audit.json()["discrepancy_quantity"] == 1
    assert audit.json()["discrepancy_direction"] == "system_higher"
    matching_audit = api.post(
        "/inventory/audits", headers=headers,
        json={"sku_id": sku_id, "warehouse": "LA", "physical_quantity": 2},
    )
    assert matching_audit.status_code == 201
    assert matching_audit.json()["discrepancy_quantity"] == 0
    assert matching_audit.json()["discrepancy_direction"] is None

    rejected = api.post(
        f"/inventory/products/{sku_id}/direct-stock-edit", headers=headers,
        json={"sku_id": sku_id, "warehouse": "LA", "quantity": 4},
    )
    assert rejected.status_code == 409
    assert api.get(f"/inventory/products/{sku_id}", headers=headers).json()[
        "current_stock"] == 2

    with Session(api.app.state.inventory_test_engine) as session:
        from services.api.models import TelemetryEvent

        events = session.exec(select(TelemetryEvent)).all()
    assert [event.event_type for event in events].count(
        "inbound_order_created") == 1
    assert [event.event_type for event in events].count(
        "outbound_order_created") == 1
    assert [event.event_type for event in events].count(
        "stock_threshold_triggered") == 1
    assert [event.event_type for event in events].count(
        "inventory_discrepancy_detected") == 1
    assert [event.event_type for event in events].count(
        "direct_stock_edit_rejected") == 1
    assert [event.event_type for event in events].count(
        "inventory_discrepancy_detected") == 1
    discrepancy = next(
        event for event in events if event.event_type == "inventory_discrepancy_detected")
    assert discrepancy.properties["quantity"] == 1
    assert discrepancy.properties["discrepancy_direction"] == "system_higher"
    assert all(event.status == "pending" and event.delivery ==
               "stream" for event in events)


def test_api_auth_and_insufficient_stock_telemetry_is_correlated_and_private(
    api: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """HTTP telemetry captures outcomes without copying credentials or request bodies."""
    monkeypatch.setattr(api_main, "engine",
                        api.app.state.inventory_test_engine)
    monkeypatch.setattr(auth_routes, "engine",
                        api.app.state.inventory_test_engine)

    failed_login = api.post(
        "/auth/login",
        data={"username": "private.operator@example.test",
              "password": "private-password"},
    )
    assert failed_login.status_code == 401
    failed_login_request_id = failed_login.headers["x-request-id"]

    user = register(api, "telemetry@example.test")
    headers = bearer(login(api, user["email"]))
    product = api.post(
        "/inventory/products", headers=headers,
        json={"name": "Widget", "sku": "TELEMETRY-1", "client_name": "Acme",
              "category": "electronics", "warehouse": "LA"},
    )
    assert product.status_code == 201, product.text
    inbound = api.post(
        "/inventory/orders/inbound", headers=headers,
        json={"sku_id": product.json()["id"], "quantity": 1,
              "reference": "PO-TELEMETRY", "warehouse": "LA"},
    )
    assert inbound.status_code == 201, inbound.text
    rejected = api.post(
        "/inventory/orders/outbound", headers=headers,
        json={"sku_id": product.json()["id"], "quantity": 2,
              "exit_type": "loss", "warehouse": "LA"},
    )
    assert rejected.status_code == 400

    with Session(api.app.state.inventory_test_engine) as session:
        events = session.exec(select(TelemetryEvent)).all()

    failed_auth_event = next(
        event for event in events
        if event.event_type == "auth_login_failed"
    )
    assert failed_auth_event.request_id == failed_login_request_id
    assert failed_auth_event.properties == {
        "failure_reason": "invalid_credentials", "client_version": "unknown"
    }
    assert "private.operator@example.test" not in str(
        failed_auth_event.properties)
    assert "private-password" not in str(failed_auth_event.properties)

    validation_event = next(
        event for event in events
        if event.event_type == "inventory_validation_failed"
    )
    assert validation_event.properties["validation_code"] == "insufficient_stock"
    assert validation_event.properties["quantity"] == 2
    assert validation_event.status == "pending"
    assert any(
        event.event_type == "api_latency_recorded"
        and event.request_id == rejected.headers["x-request-id"]
        and event.properties["route"] == "inventory_outbound_create"
        and event.properties["status_code"] == 400
        for event in events
    )
    assert any(
        event.event_type == "api_error_recorded"
        and event.request_id == rejected.headers["x-request-id"]
        and event.properties["error_class"] == "validation"
        for event in events
    )
    assert all(event.status == "pending" for event in events)


def test_serialization_contracts_are_documented_and_inputs_are_strict(
    api: TestClient,
) -> None:
    docs = api.get("/docs")
    assert docs.status_code == 200
    assert "SwaggerUIBundle" in docs.text
    schema = api.get("/openapi.json").json()
    paths = schema["paths"]
    assert paths["/"]["get"]["responses"]["200"]["content"][
        "application/json"]["schema"]["$ref"].endswith("StatusResponse")
    assert paths["/health"]["get"]["responses"]["200"]["content"][
        "application/json"]["schema"]["$ref"].endswith("StatusResponse")
    registration = paths["/users"]["post"]["responses"]["201"][
        "content"]["application/json"]["schema"]["$ref"]
    assert registration.endswith("RegistrationResponse")
    login_response = paths["/auth/login"]["post"]["responses"]["200"][
        "content"]["application/json"]["schema"]["$ref"]
    assert login_response.endswith("AccessTokenResponse")
    product_response = paths["/inventory/products"]["get"]["responses"]["200"][
        "content"]["application/json"]["schema"]["items"]["$ref"]
    assert product_response.endswith("SKURead")
    movement_response = paths["/inventory/orders/inbound"]["post"][
        "responses"]["201"]["content"]["application/json"]["schema"]["$ref"]
    assert movement_response.endswith("StockEntryRead")
    incident_response = paths["/api/incidents/analyze"]["post"][
        "responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    assert incident_response.endswith("IncidentAnalysisResponse")
    export = paths["/api/incidents/results/export"]["get"]["responses"]["200"]
    assert "text/csv" in export["content"]
    delete = paths["/users/{user_id}"]["delete"]["responses"]["204"]
    assert "content" not in delete

    created = api.post(
        "/users", json={"email": "strict@example.test", "password": TEST_PASSWORD})
    token = login(api, "strict@example.test")
    headers = bearer(token)
    product = api.post(
        "/inventory/products", headers=headers,
        json={"name": "Widget", "sku": "W1", "client_name": "Acme",
              "category": "electronics", "warehouse": "LA", "internal": True},
    )
    assert created.status_code == 201
    assert product.status_code == 422
    movement_with_user_uuid = api.post(
        "/inventory/orders/inbound", headers=headers,
        json={"sku_id": 1, "quantity": 1, "reference": "PO-1",
              "warehouse": "LA", "user_uuid": "forged"},
    )
    assert movement_with_user_uuid.status_code == 422
    assert api.get("/",).json() == {"status": "ok"}


def _protected_requests(client: TestClient) -> list[tuple[str, str, dict | None, dict | None]]:
    """Every protected API route, with valid bodies where a body is required."""
    return [
        ("GET", "/auth/me", None, None),
        ("GET", "/profiles/me", None, None),
        ("PUT", "/profiles/me", {"name": "No token"}, None),
        ("GET", "/users", None, None),
        ("PUT", "/users/me", {"email": "new@example.test"}, None),
        ("GET", "/users/nonexistent", None, None),
        ("PUT", "/users/nonexistent", {"email": "new@example.test"}, None),
        ("DELETE", "/users/nonexistent", None, None),
        ("GET", "/suppliers", None, None),
        ("POST", "/suppliers", {"name": "Supplier", "country": "USA",
         "categories": ["carrier_last_mile"], "rate_per_shipment": 1.0,
         "currency": "USD", "status": "active"}, None),
        ("GET", "/suppliers/1", None, None),
        ("PATCH", "/suppliers/1/rate", {"rate_per_shipment": 2.0}, None),
        ("PATCH", "/suppliers/1/status", {"status": "active"}, None),
        ("GET", "/inventory/products", None, None),
        ("POST", "/inventory/products", {"name": "Widget", "sku": "W1",
         "client_name": "Acme", "category": "electronics", "warehouse": "LA"}, None),
        ("GET", "/inventory/products/1", None, None),
        ("POST", "/inventory/orders/inbound", {"sku_id": 1, "quantity": 1,
         "reference": "PO-1", "warehouse": "LA"}, None),
        ("POST", "/inventory/orders/outbound", {"sku_id": 1, "quantity": 1,
         "exit_type": "loss", "warehouse": "LA"}, None),
        ("GET", "/inventory/orders", None, None),
        ("GET", "/api/incidents/results/export", None, None),
    ]


def _request(client: TestClient, method: str, path: str, body: dict | None,
             headers: dict[str, str] | None):
    if path == "/api/incidents/analyze":
        return client.post(path, headers=headers, files={
            "file": ("incidents.csv", CSV_CONTENT, "text/csv")
        })
    if body is None:
        return client.request(method, path, headers=headers)
    return client.request(method, path, headers=headers, json=body)


@pytest.mark.parametrize("authorization", ["missing", "malformed", "altered", "expired"])
def test_all_protected_routes_reject_invalid_or_missing_tokens(
    api: TestClient, authorization: str
) -> None:
    user = register(api, f"{authorization}@example.test")
    valid_token = login(api, user["email"])
    if authorization == "missing":
        headers = None
    elif authorization == "malformed":
        headers = bearer("not.a.valid.jwt")
    elif authorization == "altered":
        parts = valid_token.split(".")
        signature = parts[2]
        replacement = "A" if signature[0] != "A" else "B"
        headers = bearer(
            ".".join([parts[0], parts[1], replacement + signature[1:]]))
    else:
        expired_token = jwt.encode(
            {"sub": user["id"], "exp": datetime.now(
                timezone.utc) - timedelta(minutes=1)},
            TEST_SECRET,
            algorithm="HS256",
        )
        headers = bearer(expired_token)

    requests = _protected_requests(api)
    requests.append(("POST", "/api/incidents/analyze", None, None))
    for method, path, body, _ in requests:
        response = _request(api, method, path, body, headers)
        assert response.status_code == 401, (
            f"{authorization} token: {method} {path} returned "
            f"{response.status_code}, body={response.text}"
        )
        assert response.json()["detail"] == "Invalid or expired access token"
        assert response.headers.get("www-authenticate") == "Bearer"


def test_standard_user_cannot_read_update_or_delete_another_user(api: TestClient) -> None:
    first = register(api, "owner@example.test", "Owner")
    second = register(api, "other@example.test", "Other User")
    token = login(api, first["email"])
    headers = bearer(token)

    assert api.get(f"/users/{second['id']}",
                   headers=headers).status_code == 403
    update = api.put(
        f"/users/{second['id']}", headers=headers,
        json={"email": "stolen@example.test"},
    )
    assert update.status_code == 403
    delete = api.delete(f"/users/{second['id']}", headers=headers)
    assert delete.status_code == 403

    with TinyDB(_tinydb_path()) as db:
        still_there = db.table("users").get(
            lambda item: item["id"] == second["id"])
        linked_profile = db.table("profiles").get(
            lambda item: item["user_id"] == second["id"]
        )
    assert still_there is not None
    assert still_there["email"] == second["email"]
    assert linked_profile is not None


def test_delete_user_removes_user_and_profile_from_tinydb(api: TestClient) -> None:
    user = register(api, "delete-me@example.test")
    token = login(api, user["email"])
    response = api.delete(f"/users/{user['id']}", headers=bearer(token))
    assert response.status_code == 204

    with TinyDB(_tinydb_path()) as db:
        stored_user = db.table("users").get(
            lambda item: item["id"] == user["id"])
        stored_profile = db.table("profiles").get(
            lambda item: item["user_id"] == user["id"]
        )
    assert stored_user is None
    assert stored_profile is None

    # A token remains cryptographically well formed but is rejected when its
    # associated account no longer exists.
    assert api.get("/auth/me", headers=bearer(token)).status_code == 401
