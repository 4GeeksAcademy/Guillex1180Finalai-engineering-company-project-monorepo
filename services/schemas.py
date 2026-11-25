"""Pydantic request and response schemas for inventory API routes.

Supplier models are re-exported here for compatibility; their canonical
definitions live in ``services.api.models`` alongside the API implementation.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from services.api.models import (
    PositiveRate,
    SupplierCategory,
    SupplierCountry,
    SupplierCreate,
    SupplierCurrency,
    SupplierRateUpdate,
    SupplierResponse,
    SupplierStatus,
    SupplierStatusUpdate,
)

Warehouse = Literal["LA", "ZGZ"]
Category = Literal["fashion", "electronics", "cosmetics"]
ExitType = Literal["dispatch", "loss"]


class SKUCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    client_name: str = Field(min_length=1)
    category: Category
    warehouse: Warehouse
    threshold_quantity: Optional[int] = Field(default=None, ge=0)


class SKUThresholdUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    threshold_quantity: Optional[int] = Field(default=None, ge=0)


class InventoryAuditCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sku_id: int = Field(gt=0)
    warehouse: Warehouse
    physical_quantity: int = Field(ge=0)


class DirectStockEditAttempt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sku_id: int = Field(gt=0)
    warehouse: Warehouse
    quantity: int


class InventoryAuditRead(BaseModel):
    model_config = ConfigDict(extra="forbid")

    audit_id: str
    sku_id: int
    warehouse: Warehouse
    system_quantity: int
    physical_quantity: int
    discrepancy_quantity: int
    discrepancy_direction: Optional[Literal["system_higher",
                                            "physical_higher"]]
    created_at: datetime


class SKURead(BaseModel):
    """SKU projection used by product list/detail consumers."""

    model_config = ConfigDict(extra="forbid")

    id: int
    name: str
    sku: str
    client_name: str
    client_id: Optional[str] = None
    category: Category
    warehouse: Warehouse
    current_stock: int
    threshold_quantity: Optional[int] = None


class StockEntryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sku_id: int
    quantity: int = Field(gt=0)
    reference: str = Field(min_length=1)
    warehouse: Warehouse


class StockEntryRead(BaseModel):
    """Inbound-write receipt; the authenticated identity is server-assigned."""

    model_config = ConfigDict(extra="forbid")

    id: int
    sku_id: int
    quantity: int
    reference: str
    warehouse: Warehouse
    created_at: datetime
    user_uuid: str
    order_type: Literal["inbound"] = "inbound"


class StockExitCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sku_id: int
    quantity: int = Field(gt=0)
    exit_type: ExitType
    tracking_number: Optional[str] = None
    warehouse: Warehouse

    @model_validator(mode="after")
    def validate_tracking_number(self) -> "StockExitCreate":
        if self.exit_type == "dispatch" and not (self.tracking_number or "").strip():
            raise ValueError(
                "tracking_number is required when exit_type is 'dispatch'.")
        if self.exit_type == "loss" and self.tracking_number is not None:
            raise ValueError(
                "tracking_number must be null when exit_type is 'loss'.")
        return self


class StockExitRead(BaseModel):
    """Outbound-write receipt; the authenticated identity is server-assigned."""

    model_config = ConfigDict(extra="forbid")

    id: int
    sku_id: int
    quantity: int
    exit_type: ExitType
    tracking_number: Optional[str] = None
    warehouse: Warehouse
    created_at: datetime
    user_uuid: str
    order_type: Literal["outbound"] = "outbound"


class StockOrderRead(BaseModel):
    """Compact movement-history row with the SKU fields the UI displays."""

    model_config = ConfigDict(extra="forbid")

    id: int
    order_type: Literal["inbound", "outbound"]
    sku_name: str
    sku_code: str
    quantity: int
    warehouse: Warehouse
    created_at: datetime
    user_uuid: str
    reference: Optional[str] = None
    exit_type: Optional[ExitType] = None
    tracking_number: Optional[str] = None
