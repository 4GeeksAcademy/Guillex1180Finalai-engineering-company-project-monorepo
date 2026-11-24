"""Reproducible isolated benchmark for authenticated inventory cache reads.

Example: .venv/bin/python scripts/benchmark_inventory_cache.py --skus 500 --movements 5000
The script uses temporary SQLite/TinyDB files and never modifies data/.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
import statistics
import tempfile
import time
from pathlib import Path
from typing import Iterator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from services.api.cache import response_cache
from services.api.main import app
from services.api.models import SKU, StockEntry, StockExit
from services.database import get_db


def percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int((len(ordered) - 1) * quantile))]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skus", type=int, default=500)
    parser.add_argument("--movements", type=int, default=5000)
    parser.add_argument("--iterations", type=int, default=15)
    args = parser.parse_args()
    if args.skus < 1 or args.movements < 1 or args.iterations < 2:
        parser.error(
            "skus/movements must be positive and iterations must be at least 2")

    with tempfile.TemporaryDirectory(prefix="trackflow-cache-bench-") as temp_dir:
        temp_path = Path(temp_dir)
        os.environ["TINYDB_PATH"] = str(temp_path / "users.json")
        os.environ["SECRET_KEY"] = "inventory-cache-benchmark-secret-at-least-32"
        os.environ["ALGORITHM"] = "HS256"
        os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
        engine = create_engine(
            f"sqlite:///{temp_path / 'inventory.sqlite'}",
            connect_args={"check_same_thread": False},
        )
        SQLModel.metadata.create_all(
            engine, tables=[SKU.__table__,
                            StockEntry.__table__, StockExit.__table__]
        )

        def isolated_db() -> Iterator[Session]:
            with Session(engine) as session:
                yield session

        app.dependency_overrides[get_db] = isolated_db
        response_cache.clear()
        try:
            with Session(engine) as session:
                products = [
                    SKU(name=f"Synthetic product {index:05d}", sku=f"BENCH-{index:05d}",
                        client_name=f"Client {index % 50:02d}",
                        category=("electronics", "fashion",
                                  "cosmetics")[index % 3],
                        warehouse=("LA", "ZGZ")[index % 2])
                    for index in range(args.skus)
                ]
                session.add_all(products)
                session.flush()
                movements = []
                for index in range(args.movements):
                    sku = products[index % len(products)]
                    timestamp = datetime.fromtimestamp(
                        1_700_000_000 + index, tz=timezone.utc)
                    if index % 2:
                        movements.append(StockEntry(
                            sku_id=sku.id, quantity=(index % 37) + 1,
                            reference=f"PO-BENCH-{index:07d}", warehouse=sku.warehouse,
                            user_uuid="synthetic-user", created_at=timestamp))
                    else:
                        movements.append(StockExit(
                            sku_id=sku.id, quantity=(index % 19) + 1,
                            exit_type="dispatch" if index % 4 else "loss",
                            tracking_number=f"SHIP-{index:07d}", warehouse=sku.warehouse,
                            user_uuid="synthetic-user", created_at=timestamp))
                    if len(movements) >= 1000:
                        session.add_all(movements)
                        session.flush()
                        movements.clear()
                if movements:
                    session.add_all(movements)
                session.commit()

            with TestClient(app) as client:
                registration = client.post("/users", json={
                    "email": "cache-benchmark@example.test",
                    "password": "Benchmark-password-42!", "name": "Benchmark Operator",
                })
                if registration.status_code != 201:
                    raise RuntimeError(
                        f"Registration failed: {registration.status_code} {registration.text}")
                login = client.post("/auth/login", data={
                    "username": "cache-benchmark@example.test",
                    "password": "Benchmark-password-42!",
                })
                if login.status_code != 200:
                    raise RuntimeError(
                        f"Login failed: {login.status_code} {login.text}")
                headers = {
                    "Authorization": f"Bearer {login.json()['access_token']}"}
                measurements = {}
                payload_sizes = {}
                for name, endpoint in (("products", "/inventory/products"), ("orders", "/inventory/orders")):
                    misses: list[float] = []
                    hits: list[float] = []
                    for _ in range(args.iterations):
                        response_cache.clear()
                        start = time.perf_counter()
                        response = client.get(endpoint, headers=headers)
                        misses.append((time.perf_counter() - start) * 1000)
                        if response.status_code != 200:
                            raise RuntimeError(
                                f"{endpoint} returned {response.status_code}: {response.text}")
                        payload_sizes[name] = len(response.content)
                    # Warm once, then repeat cache hits against the same response.
                    client.get(endpoint, headers=headers)
                    for _ in range(args.iterations):
                        start = time.perf_counter()
                        response = client.get(endpoint, headers=headers)
                        hits.append((time.perf_counter() - start) * 1000)
                        if response.status_code != 200:
                            raise RuntimeError(
                                f"{endpoint} returned {response.status_code}: {response.text}")
                    measurements[name] = {
                        "miss_ms_median": round(statistics.median(misses), 3),
                        "miss_ms_p95": round(percentile(misses, 0.95), 3),
                        "hit_ms_median": round(statistics.median(hits), 3),
                        "hit_ms_p95": round(percentile(hits, 0.95), 3),
                        "iterations_per_state": args.iterations,
                        "response_bytes": payload_sizes[name],
                    }
                print(json.dumps({
                    "dataset": {"skus": args.skus, "movements": args.movements,
                                "iterations_per_state": args.iterations},
                    "measurements": measurements,
                    "note": "Single-process local TestClient; timings include HTTP serialization and are not production load-test results.",
                }, indent=2))
        finally:
            response_cache.clear()
            app.dependency_overrides.pop(get_db, None)
            engine.dispose()


if __name__ == "__main__":
    main()
