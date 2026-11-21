"""SQLModel entities for the TrackFlow inventory ledger."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class SKU(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    sku: str = Field(index=True)
    client_name: str
    category: str
    warehouse: str = Field(index=True)


class StockEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sku_id: int = Field(foreign_key="sku.id", index=True)
    quantity: int
    reference: str
    warehouse: str = Field(index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str


class StockExit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sku_id: int = Field(foreign_key="sku.id", index=True)
    quantity: int
    exit_type: str
    tracking_number: Optional[str] = None
    warehouse: str = Field(index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str
