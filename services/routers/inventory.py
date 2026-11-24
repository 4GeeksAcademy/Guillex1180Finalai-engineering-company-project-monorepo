"""Authenticated TrackFlow inventory endpoints."""

from __future__ import annotations

from typing import Annotated, Any
import unicodedata
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from services.api.cache import inventory_cache_prefix, response_cache
from services.database import get_db
from services.api.models import (
    InventoryAudit,
    InventoryClient,
    SKU,
    StockEntry,
    StockExit,
)
from services.api.security import CurrentUser
from services.api.telemetry import event_id_for, record_event
from services.schemas import (
    DirectStockEditAttempt,
    InventoryAuditCreate,
    InventoryAuditRead,
    SKUCreate,
    SKURead,
    SKUThresholdUpdate,
    StockEntryCreate,
    StockEntryRead,
    StockExitCreate,
    StockExitRead,
    StockOrderRead,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])
SessionDep = Annotated[Session, Depends(get_db)]
PRODUCTS_TTL_SECONDS = 15
ORDERS_TTL_SECONDS = 10


def current_user_uuid(current_user: CurrentUser) -> str:
    """Use the authenticated TinyDB user ID as the SQL ledger user_uuid."""
    return current_user["id"]


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


def _normalize_client(name: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", name).strip().casefold().split())


def _canonical_client(session: Session, name: str) -> InventoryClient:
    normalized = _normalize_client(name)
    if not normalized:
        raise HTTPException(
            status_code=422, detail="client_name must not be blank")
    client = session.exec(
        select(InventoryClient).where(
            InventoryClient.normalized_name == normalized)
    ).first()
    if client is None:
        client = InventoryClient(name=name.strip(), normalized_name=normalized)
        session.add(client)
        session.flush()
    return client


def _telemetry_dimensions(sku: SKU, warehouse: str) -> dict[str, str]:
    warehouses = {"LA": "los_angeles", "ZGZ": "zaragoza"}
    categories = {
        "fashion": "moda",
        "electronics": "electrónica",
        "cosmetics": "cosmética",
    }
    if not sku.client_id:
        raise ValueError("SKU is not associated with a canonical client")
    return {
        "warehouse": warehouses[warehouse],
        "client_id": sku.client_id,
        "product_id": str(sku.id),
        "product_category": categories[sku.category],
    }


def _sku_or_404(session: Session, sku_id: int, warehouse: str | None = None) -> SKU:
    sku = session.get(SKU, sku_id)
    if sku is None or (warehouse is not None and sku.warehouse != warehouse):
        raise HTTPException(
            status_code=404, detail="SKU not found for the requested warehouse.")
    return sku


@router.get("/products", response_model=list[SKURead])
def list_products(session: SessionDep, user_uuid: AuthUser) -> list[SKURead]:
    key = f"{inventory_cache_prefix(user_uuid)}products"
    cached = response_cache.get(key)
    if cached is not None:
        return cached
    products = [_sku_read(session, sku)
                for sku in session.exec(select(SKU)).all()]
    response_cache.set(key, products, PRODUCTS_TTL_SECONDS)
    return products


@router.post("/products", response_model=SKURead, status_code=status.HTTP_201_CREATED)
def create_product(data: SKUCreate, session: SessionDep, _user_uuid: AuthUser) -> SKURead:
    try:
        client = _canonical_client(session, data.client_name)
        sku = SKU.model_validate({**data.model_dump(), "client_id": client.id})
        session.add(sku)
        session.commit()
        session.refresh(sku)
    except Exception:
        session.rollback()
        raise
    response_cache.invalidate_prefix("inventory:user:")
    return _sku_read(session, sku)


@router.get("/products/{id}", response_model=SKURead)
def get_product(id: int, session: SessionDep, _user_uuid: AuthUser) -> SKURead:
    return _sku_read(session, _sku_or_404(session, id))


@router.patch("/products/{id}/threshold", response_model=SKURead)
def update_product_threshold(
    id: int,
    data: SKUThresholdUpdate,
    session: SessionDep,
    _user_uuid: AuthUser,
) -> SKURead:
    sku = _sku_or_404(session, id)
    sku.threshold_quantity = data.threshold_quantity
    session.add(sku)
    session.commit()
    session.refresh(sku)
    response_cache.invalidate_prefix("inventory:user:")
    return _sku_read(session, sku)


@router.post("/products/{id}/direct-stock-edit", status_code=status.HTTP_409_CONFLICT)
def reject_direct_stock_edit(
    id: int,
    data: DirectStockEditAttempt,
    session: SessionDep,
    authenticated_user_uuid: AuthUser,
) -> dict[str, str]:
    """Explicitly refuse a direct stock edit; ledger mutations use orders only."""
    if id != data.sku_id:
        raise HTTPException(
            status_code=422, detail="Path SKU and body SKU must match")
    sku = _sku_or_404(session, id, data.warehouse)
    record_event(
        session,
        event_type="direct_stock_edit_rejected",
        properties={
            **_telemetry_dimensions(sku, data.warehouse),
            "quantity": abs(data.quantity),
            "rejection_code": "order_required",
        },
        delivery="stream",
        event_id=event_id_for(
            "direct_stock_edit_rejected", sku.id, authenticated_user_uuid, uuid4().hex
        ),
        user_id=authenticated_user_uuid,
    )
    session.commit()
    return {"detail": "Direct stock edits are not allowed; create an inventory order."}


@router.post(
    "/audits", response_model=InventoryAuditRead,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_audit(
    data: InventoryAuditCreate,
    session: SessionDep,
    authenticated_user_uuid: AuthUser,
) -> InventoryAuditRead:
    sku = _sku_or_404(session, data.sku_id, data.warehouse)
    system_quantity = _stock_for(session, data.sku_id, data.warehouse)
    audit = InventoryAudit(
        sku_id=data.sku_id,
        warehouse=data.warehouse,
        system_quantity=system_quantity,
        physical_quantity=data.physical_quantity,
        user_uuid=authenticated_user_uuid,
    )
    session.add(audit)
    difference = data.physical_quantity - system_quantity
    if difference:
        properties = {
            **_telemetry_dimensions(sku, data.warehouse),
            "quantity": abs(difference),
            "discrepancy_direction": "physical_higher" if difference > 0 else "system_higher",
            "audit_id": audit.id,
        }
        record_event(
            session,
            event_type="inventory_discrepancy_detected",
            properties=properties,
            delivery="stream",
            event_id=event_id_for("inventory_discrepancy_detected", audit.id),
            user_id=authenticated_user_uuid,
        )
    session.commit()
    session.refresh(audit)
    return InventoryAuditRead(
        audit_id=audit.id,
        sku_id=audit.sku_id,
        warehouse=data.warehouse,
        system_quantity=system_quantity,
        physical_quantity=data.physical_quantity,
        discrepancy_quantity=abs(difference),
        discrepancy_direction=(
            "physical_higher" if difference > 0 else "system_higher" if difference < 0 else None
        ),
        created_at=audit.created_at,
    )


@router.post("/orders/inbound", response_model=StockEntryRead, status_code=status.HTTP_201_CREATED)
def create_inbound(data: StockEntryCreate, session: SessionDep, authenticated_user_uuid: AuthUser) -> StockEntryRead:
    sku = _sku_or_404(session, data.sku_id, data.warehouse)
    entry_data = data.model_dump()
    entry = StockEntry.model_validate(
        {**entry_data, "user_uuid": authenticated_user_uuid})
    session.add(entry)
    session.flush()
    properties = {
        **_telemetry_dimensions(sku, data.warehouse),
        "quantity": data.quantity,
        "order_id": str(entry.id),
    }
    record_event(
        session,
        event_type="inbound_order_created",
        properties=properties,
        delivery="stream",
        event_id=event_id_for("inbound_order_created", entry.id),
        user_id=authenticated_user_uuid,
    )
    session.commit()
    session.refresh(entry)
    response_cache.invalidate_prefix("inventory:user:")
    sku = session.get(SKU, entry.sku_id)
    assert sku is not None
    return StockEntryRead.model_validate(entry.model_dump())


@router.post("/orders/outbound", response_model=StockExitRead, status_code=status.HTTP_201_CREATED)
def create_outbound(data: StockExitCreate, session: SessionDep, authenticated_user_uuid: AuthUser) -> StockExitRead:
    sku = _sku_or_404(session, data.sku_id, data.warehouse)
    available = _stock_for(session, data.sku_id, data.warehouse)
    if data.quantity > available:
        try:
            record_event(
                session,
                event_type="inventory_validation_failed",
                properties={
                    "order_type": "outbound",
                    "validation_code": "insufficient_stock",
                    **_telemetry_dimensions(sku, data.warehouse),
                    "quantity": data.quantity,
                },
                delivery="batch",
                event_id=event_id_for(
                    "inventory_validation_failed",
                    sku.id,
                    data.warehouse,
                    authenticated_user_uuid,
                    uuid4().hex,
                ),
                user_id=authenticated_user_uuid,
            )
            session.commit()
        except Exception:
            session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for SKU '{sku.sku}'. Available: {available}, requested: {data.quantity}.",
        )
    exit_data = data.model_dump()
    exit_record = StockExit.model_validate(
        {**exit_data, "user_uuid": authenticated_user_uuid})
    session.add(exit_record)
    session.flush()
    new_stock = available - data.quantity
    record_event(
        session,
        event_type="outbound_order_created",
        properties={
            **_telemetry_dimensions(sku, data.warehouse),
            "quantity": data.quantity,
            "order_id": str(exit_record.id),
        },
        delivery="stream",
        event_id=event_id_for("outbound_order_created", exit_record.id),
        user_id=authenticated_user_uuid,
    )
    if (
        sku.threshold_quantity is not None
        and available >= sku.threshold_quantity
        and new_stock < sku.threshold_quantity
    ):
        record_event(
            session,
            event_type="stock_threshold_triggered",
            properties={
                **_telemetry_dimensions(sku, data.warehouse),
                "quantity": new_stock,
                "threshold_quantity": sku.threshold_quantity,
            },
            delivery="stream",
            event_id=event_id_for("stock_threshold_triggered", exit_record.id),
            user_id=authenticated_user_uuid,
        )
    session.commit()
    session.refresh(exit_record)
    response_cache.invalidate_prefix("inventory:user:")
    return StockExitRead.model_validate(exit_record.model_dump())


@router.get("/orders", response_model=list[StockOrderRead])
def list_orders(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[StockOrderRead]:
    user_uuid = str(current_user["id"])
    key = f"{inventory_cache_prefix(user_uuid)}orders"
    cached = response_cache.get(key)
    if cached is not None:
        return cached
    rows: list[tuple[Any, SKU]] = []
    entry_statement = select(StockEntry)
    exit_statement = select(StockExit)
    for entry in session.exec(entry_statement).all():
        sku = session.get(SKU, entry.sku_id)
        if sku is not None:
            rows.append((entry, sku))
    for exit_record in session.exec(exit_statement).all():
        sku = session.get(SKU, exit_record.sku_id)
        if sku is not None:
            rows.append((exit_record, sku))
    rows.sort(key=lambda pair: pair[0].created_at, reverse=True)
    orders = [
        StockOrderRead.model_validate(
            {
                "id": movement.id,
                "order_type": "inbound" if isinstance(movement, StockEntry) else "outbound",
                "sku_name": sku.name,
                "sku_code": sku.sku,
                "quantity": movement.quantity,
                "warehouse": movement.warehouse,
                "created_at": movement.created_at,
                "user_uuid": movement.user_uuid,
                "reference": movement.reference if isinstance(movement, StockEntry) else None,
                "exit_type": movement.exit_type if isinstance(movement, StockExit) else None,
                "tracking_number": movement.tracking_number if isinstance(movement, StockExit) else None,
            }
        )
        for movement, sku in rows
    ]
    response_cache.set(key, orders, ORDERS_TTL_SECONDS)
    return orders
