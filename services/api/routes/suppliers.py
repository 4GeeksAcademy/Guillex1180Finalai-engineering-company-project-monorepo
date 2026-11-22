"""Authenticated TrackFlow supplier directory backed by TinyDB."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query, status
from tinydb import TinyDB

from services.api.database import _tinydb_path
from services.api.models import (
    SupplierCategory,
    SupplierCountry,
    SupplierCreate,
    SupplierRateUpdate,
    SupplierResponse,
    SupplierStatus,
    SupplierStatusUpdate,
)
from services.routers.inventory import AuthUser

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def _supplier_table(db: TinyDB):
    return db.table("suppliers")


def _serialize(document: dict[str, Any], document_id: int) -> SupplierResponse:
    return SupplierResponse.model_validate({**document, "id": str(document_id)})


def _find_by_id(table: Any, supplier_id: str) -> tuple[int, dict[str, Any]] | None:
    try:
        doc_id = int(supplier_id)
    except (TypeError, ValueError):
        return None
    document = table.get(doc_id=doc_id)
    return (doc_id, document) if document is not None else None


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(
    _user_uuid: AuthUser,
    country: SupplierCountry | None = Query(default=None),
    category: SupplierCategory | None = Query(default=None),
    status_filter: Annotated[SupplierStatus |
                             None, Query(alias="status")] = None,
) -> list[SupplierResponse]:
    with TinyDB(_tinydb_path()) as db:
        docs = _supplier_table(db).all()
        results: list[SupplierResponse] = []
        for doc in docs:
            if country is not None and doc.get("country") != country:
                continue
            if category is not None and category not in doc.get("categories", []):
                continue
            if status_filter is not None and doc.get("status") != status_filter:
                continue
            results.append(_serialize(dict(doc), doc.doc_id))
        return results


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(data: SupplierCreate, _user_uuid: AuthUser) -> SupplierResponse:
    # Pydantic validates the full payload before TinyDB is opened or written.
    document = data.model_dump()
    document["updated_at"] = datetime.now(timezone.utc).isoformat()
    with TinyDB(_tinydb_path()) as db:
        table = _supplier_table(db)
        doc_id = table.insert(document)
        return _serialize(document, doc_id)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, _user_uuid: AuthUser) -> SupplierResponse:
    with TinyDB(_tinydb_path()) as db:
        found = _find_by_id(_supplier_table(db), supplier_id)
        if found is None:
            raise HTTPException(status_code=404, detail="Supplier not found.")
        doc_id, document = found
        return _serialize(dict(document), doc_id)


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
def update_supplier_rate(
    supplier_id: str,
    data: SupplierRateUpdate,
    _user_uuid: AuthUser,
) -> SupplierResponse:
    with TinyDB(_tinydb_path()) as db:
        table = _supplier_table(db)
        found = _find_by_id(table, supplier_id)
        if found is None:
            raise HTTPException(status_code=404, detail="Supplier not found.")
        doc_id, current = found
        updated = {
            **dict(current),
            "rate_per_shipment": data.rate_per_shipment,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        table.update(updated, doc_ids=[doc_id])
        return _serialize(updated, doc_id)


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(
    supplier_id: str,
    data: SupplierStatusUpdate,
    _user_uuid: AuthUser,
) -> SupplierResponse:
    with TinyDB(_tinydb_path()) as db:
        table = _supplier_table(db)
        found = _find_by_id(table, supplier_id)
        if found is None:
            raise HTTPException(status_code=404, detail="Supplier not found.")
        doc_id, current = found
        updated = {**dict(current), "status": data.status}
        table.update(updated, doc_ids=[doc_id])
        return _serialize(updated, doc_id)
