"""Canonical FastAPI application entry point."""

from __future__ import annotations

import os
import logging
import time
from uuid import uuid4
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.api.routers.telemetry import router as telemetry_router
from services.api.routes.suppliers import router as suppliers_router
from services.api.routes.auth import router as auth_router
from services.api.routes.profiles import router as profiles_router
from services.api.routes.users import router as users_router
from services.api.database import create_db_and_tables, provision_bootstrap_user
from services.api.database import engine
from services.api.telemetry import record_event
from sqlmodel import Session
from services.routers.incidents import router as incidents_router
from services.routers.inventory import router as inventory_router

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    create_db_and_tables()
    provision_bootstrap_user()
    yield


app = FastAPI(title="TrackFlow API", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    request_id = str(uuid4())
    request.state.request_id = request_id
    response = None
    unhandled_error = False
    try:
        response = await call_next(request)
    except Exception:
        unhandled_error = True
        raise
    finally:
        duration = (time.perf_counter() - start) * 1000
        route_path = getattr(request.scope.get("route"), "path", "")
        if not route_path:
            route_path = request.url.path
            if route_path.startswith("/inventory/products/"):
                route_path = "/inventory/products/{id}"
        route_names = {
            ("GET", "/inventory/products"): "inventory_products_list",
            ("GET", "/inventory/products/{id}"): "inventory_product_detail",
            ("POST", "/inventory/orders/inbound"): "inventory_inbound_create",
            ("POST", "/inventory/orders/outbound"): "inventory_outbound_create",
            ("GET", "/inventory/orders"): "inventory_orders_list",
            ("POST", "/auth/login"): "auth_login",
        }
        route_name = route_names.get(
            (request.method, route_path), "other_allowlisted")
        status_code = response.status_code if response is not None else 500

        # Telemetry is best-effort: a storage outage must never change the API result.
        try:
            with Session(engine) as telemetry_session:
                record_event(
                    telemetry_session,
                    event_type="api_latency_recorded",
                    properties={
                        "route": route_name,
                        "method": request.method,
                        "status_code": status_code,
                        "duration_ms": round(duration, 3),
                    },
                    delivery="stream",
                    event_id=str(uuid4()),
                    request_id=request_id,
                )
                if status_code >= 400:
                    error_class = (
                        "authorization" if status_code in (401, 403)
                        else "not_found" if status_code == 404
                        else "conflict" if status_code == 409
                        else "validation" if status_code in (400, 422)
                        else "dependency" if status_code in (502, 503, 504)
                        else "unexpected"
                    )
                    record_event(
                        telemetry_session,
                        event_type="api_error_recorded",
                        properties={
                            "route": route_name,
                            "method": request.method,
                            "status_code": status_code,
                            "error_code": f"http_{status_code}",
                            "error_class": error_class,
                        },
                        delivery="stream",
                        event_id=str(uuid4()),
                        request_id=request_id,
                    )
                telemetry_session.commit()
        except Exception:
            logger.warning(
                "Telemetry persistence failed for request %s", request_id)

    if response is None or unhandled_error:
        raise RuntimeError("Request completed without an HTTP response")
    logger.info("%s %s → %s | %.1fms", request.method,
                route_name, response.status_code, duration)
    response.headers["X-Request-ID"] = request_id
    return response

allowed_origins = [
    origin.strip()
    for origin in os.getenv("BACKOFFICE_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class StatusResponse(BaseModel):
    status: str


app.include_router(telemetry_router)
app.include_router(inventory_router)
app.include_router(incidents_router)
app.include_router(suppliers_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(auth_router)


@app.get("/", response_model=StatusResponse, tags=["health"])
@app.get("/health", response_model=StatusResponse, tags=["health"])
def health() -> StatusResponse:
    """Simple liveness response, including for Codespaces port probes."""
    return StatusResponse(status="ok")
