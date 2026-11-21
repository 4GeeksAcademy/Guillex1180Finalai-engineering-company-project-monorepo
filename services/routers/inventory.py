"""Authenticated TrackFlow inventory endpoints."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session, select

from services.database import find_user_uuid_for_token, get_db
from services.models import SKU, StockEntry, StockExit
from services.schemas import (
    SKUCreate,
    SKURead,
    StockEntryCreate,
    StockEntryRead,
    StockExitCreate,
    StockExitRead,
    StockOrderRead,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])
SessionDep = Annotated[Session, Depends(get_db)]


def current_user_uuid(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required.")
    token = authorization.removeprefix("Bearer ").strip()
    user_uuid = find_user_uuid_for_token(token)
    if not user_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token.")
    return user_uuid


AuthUser = Annotated[str, Depends(current_user_uuid)]


def _stock_for(session: Session, sku_id: int, warehouse: str) -> int:
    entries = session.exec(
        select(StockEntry.quantity).where(
            StockEntry.sku_id == sku_id,
            StockEntry.warehouse == warehouse,
        )
    ).all()
    exits = session.exec(
        select(StockExit.quantity).where(
            StockExit.sku_id == sku_id,
            StockExit.warehouse == warehouse,
        )
    ).all()
    return sum(entries) - sum(exits)


def _sku_read(session: Session, sku: SKU) -> SKURead:
    data = SKU.model_validate(sku).model_dump()
    data["current_stock"] = _stock_for(session, int(sku.id), sku.warehouse)
    return SKURead.model_validate(data)


def _sku_or_404(session: Session, sku_id: int, warehouse: str | None = None) -> SKU:
    sku = session.get(SKU, sku_id)
    if sku is None or (warehouse is not None and sku.warehouse != warehouse):
        raise HTTPException(
            status_code=404, detail="SKU not found for the requested warehouse.")
    return sku


@router.get("/products", response_model=list[SKURead])
def list_products(session: SessionDep, _user_uuid: AuthUser) -> list[SKURead]:
    return [_sku_read(session, sku) for sku in session.exec(select(SKU)).all()]


@router.post("/products", response_model=SKURead, status_code=status.HTTP_201_CREATED)
def create_product(data: SKUCreate, session: SessionDep, _user_uuid: AuthUser) -> SKURead:
    sku = SKU.model_validate(data)
    session.add(sku)
    session.commit()
    session.refresh(sku)
    return _sku_read(session, sku)


@router.get("/products/{id}", response_model=SKURead)
def get_product(id: int, session: SessionDep, _user_uuid: AuthUser) -> SKURead:
    return _sku_read(session, _sku_or_404(session, id))


@router.post("/orders/inbound", response_model=StockEntryRead, status_code=status.HTTP_201_CREATED)
def create_inbound(data: StockEntryCreate, session: SessionDep, authenticated_user_uuid: AuthUser) -> StockEntryRead:
    _sku_or_404(session, data.sku_id, data.warehouse)
    entry_data = data.model_dump(exclude={"user_uuid"})
    entry = StockEntry.model_validate(
        {**entry_data, "user_uuid": authenticated_user_uuid})
    session.add(entry)
    session.commit()
    session.refresh(entry)
    sku = session.get(SKU, entry.sku_id)
    assert sku is not None
    return StockEntryRead.model_validate({**entry.model_dump(), "sku": _sku_read(session, sku)})


@router.post("/orders/outbound", response_model=StockExitRead, status_code=status.HTTP_201_CREATED)
def create_outbound(data: StockExitCreate, session: SessionDep, authenticated_user_uuid: AuthUser) -> StockExitRead:
    sku = _sku_or_404(session, data.sku_id, data.warehouse)
    available = _stock_for(session, data.sku_id, data.warehouse)
    if data.quantity > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for SKU '{sku.sku}'. Available: {available}, requested: {data.quantity}.",
        )
    exit_data = data.model_dump(exclude={"user_uuid"})
    exit_record = StockExit.model_validate(
        {**exit_data, "user_uuid": authenticated_user_uuid})
    session.add(exit_record)
    session.commit()
    session.refresh(exit_record)
    return StockExitRead.model_validate({**exit_record.model_dump(), "sku": _sku_read(session, sku)})


@router.get("/orders", response_model=list[StockOrderRead])
def list_orders(session: SessionDep, _user_uuid: AuthUser) -> list[StockOrderRead]:
    rows: list[tuple[Any, SKU]] = []
    for entry in session.exec(select(StockEntry)).all():
        sku = session.get(SKU, entry.sku_id)
        if sku is not None:
            rows.append((entry, sku))
    for exit_record in session.exec(select(StockExit)).all():
        sku = session.get(SKU, exit_record.sku_id)
        if sku is not None:
            rows.append((exit_record, sku))
    rows.sort(key=lambda pair: pair[0].created_at, reverse=True)
    return [
        StockOrderRead.model_validate(
            {
                "id": movement.id,
                "order_type": "inbound" if isinstance(movement, StockEntry) else "outbound",
                "sku_id": movement.sku_id,
                "quantity": movement.quantity,
                "warehouse": movement.warehouse,
                "created_at": movement.created_at,
                "user_uuid": movement.user_uuid,
                "sku": _sku_read(session, sku),
                "reference": movement.reference if isinstance(movement, StockEntry) else None,
                "exit_type": movement.exit_type if isinstance(movement, StockExit) else None,
                "tracking_number": movement.tracking_number if isinstance(movement, StockExit) else None,
            }
        )
        for movement, sku in rows
    ]
