"""Pydantic request and response schemas for inventory API routes."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

Warehouse = Literal["LA", "ZGZ"]
Category = Literal["fashion", "electronics", "cosmetics"]
ExitType = Literal["dispatch", "loss"]


class SKUCreate(BaseModel):
    name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    client_name: str = Field(min_length=1)
    category: Category
    warehouse: Warehouse


class SKURead(SKUCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    current_stock: int


class StockEntryCreate(BaseModel):
    sku_id: int
    quantity: int = Field(gt=0)
    reference: str = Field(min_length=1)
    warehouse: Warehouse
    user_uuid: Optional[str] = None


class StockEntryRead(StockEntryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    user_uuid: str
    order_type: Literal["inbound"] = "inbound"
    sku: SKURead


class StockExitCreate(BaseModel):
    sku_id: int
    quantity: int = Field(gt=0)
    exit_type: ExitType
    tracking_number: Optional[str] = None
    warehouse: Warehouse
    user_uuid: Optional[str] = None

    @model_validator(mode="after")
    def validate_tracking_number(self) -> "StockExitCreate":
        if self.exit_type == "dispatch" and not (self.tracking_number or "").strip():
            raise ValueError(
                "tracking_number is required when exit_type is 'dispatch'.")
        if self.exit_type == "loss" and self.tracking_number is not None:
            raise ValueError(
                "tracking_number must be null when exit_type is 'loss'.")
        return self


class StockExitRead(StockExitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    user_uuid: str
    order_type: Literal["outbound"] = "outbound"
    sku: SKURead


class StockOrderRead(BaseModel):
    id: int
    order_type: Literal["inbound", "outbound"]
    sku_id: int
    quantity: int
    warehouse: Warehouse
    created_at: datetime
    user_uuid: str
    sku: SKURead
    reference: Optional[str] = None
    exit_type: Optional[ExitType] = None
    tracking_number: Optional[str] = None
