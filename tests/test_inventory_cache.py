from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

from services.api.cache import TTLCache, inventory_cache_prefix, response_cache
from tests.test_auth_01 import TEST_PASSWORD, api, bearer, login, register


def test_ttl_cache_expires_and_returns_copies() -> None:
    cache = TTLCache()
    value = {"items": [1]}
    cache.set("sample", value, 0.02)
    value["items"].append(2)
    returned = cache.get("sample")
    assert returned == {"items": [1]}
    returned["items"].append(3)
    assert cache.get("sample") == {"items": [1]}
    time.sleep(0.03)
    assert cache.get("sample") is None


def test_inventory_cache_keys_are_scoped_and_global_invalidation_is_safe() -> None:
    cache = TTLCache()
    key_a = f"{inventory_cache_prefix('user-a')}products"
    key_b = f"{inventory_cache_prefix('user-b')}products"
    cache.set(key_a, ["private snapshot A"], 10)
    cache.set(key_b, ["private snapshot B"], 10)
    assert cache.get(key_a) != cache.get(key_b)
    cache.invalidate_prefix("inventory:user:")
    assert cache.get(key_a) is None
    assert cache.get(key_b) is None


def test_inventory_writes_invalidate_other_users_cached_reads(api: TestClient) -> None:
    response_cache.clear()
    user_a = register(api, "cache-a@example.test")
    token_a = login(api, user_a["email"])
    user_b = register(api, "cache-b@example.test")
    token_b = login(api, user_b["email"])

    initial = api.get("/inventory/products", headers=bearer(token_b))
    assert initial.status_code == 200, initial.text
    assert api.get("/inventory/orders",
                   headers=bearer(token_b)).status_code == 200
    assert response_cache.get(
        f"{inventory_cache_prefix(user_b['id'])}products") is not None
    assert response_cache.get(
        f"{inventory_cache_prefix(user_b['id'])}orders") is not None

    created = api.post(
        "/inventory/products", headers=bearer(token_a),
        json={"name": "Cache test", "sku": "CACHE-TEST", "client_name": "Acme",
              "category": "electronics", "warehouse": "LA"},
    )
    assert created.status_code == 201, created.text
    assert response_cache.get(
        f"{inventory_cache_prefix(user_b['id'])}products") is None
    assert response_cache.get(
        f"{inventory_cache_prefix(user_b['id'])}orders") is None
    refreshed = api.get("/inventory/products", headers=bearer(token_b))
    assert any(item["sku"] == "CACHE-TEST" for item in refreshed.json())

    response_cache.clear()
    inbound = api.post(
        "/inventory/orders/inbound", headers=bearer(token_a),
        json={"sku_id": created.json()["id"], "quantity": 9,
              "reference": "PO-CACHE", "warehouse": "LA"},
    )
    assert inbound.status_code == 201, inbound.text
    assert api.get("/inventory/products", headers=bearer(token_b)
                   ).json()[0]["current_stock"] == 9

    response_cache.clear()
    assert api.get("/inventory/orders",
                   headers=bearer(token_b)).status_code == 200
    outbound = api.post(
        "/inventory/orders/outbound", headers=bearer(token_a),
        json={"sku_id": created.json()["id"], "quantity": 2,
              "exit_type": "dispatch", "tracking_number": "SHIP-CACHE", "warehouse": "LA"},
    )
    assert outbound.status_code == 201, outbound.text
    orders = api.get("/inventory/orders", headers=bearer(token_b))
    assert len(orders.json()) == 2
    assert sum(order["quantity"] for order in orders.json()) == 11
