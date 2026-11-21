"""FastAPI application entry point for TrackFlow services."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.database import create_db_and_tables, provision_bootstrap_user
from services.routers.incidents import router as incidents_router
from services.routers.inventory import router as inventory_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    create_db_and_tables()
    provision_bootstrap_user()
    yield


app = FastAPI(title="TrackFlow API",
              version="1.0.0", lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("BACKOFFICE_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def codespaces_health_check(request, call_next):
    """Allow unauthenticated Codespaces port probes without logging 404s."""
    if request.url.path == "/" and request.method == "GET":
        from fastapi.responses import JSONResponse

        return JSONResponse({"status": "ok"})
    return await call_next(request)


app.include_router(inventory_router)
app.include_router(incidents_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
