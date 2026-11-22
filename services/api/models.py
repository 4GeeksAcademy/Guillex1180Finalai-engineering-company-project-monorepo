"""TrackFlow API models and SQLModel entities for the inventory ledger."""

from __future__ import annotations

from datetime import datetime, timezone
import math
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field as PydanticField, field_validator, model_validator
from sqlmodel import Field, SQLModel

SupplierCountry = Literal["USA", "Spain"]
SupplierCurrency = Literal["USD", "EUR"]
SupplierCategory = Literal[
    "carrier_last_mile",
    "carrier_international",
    "warehouse_supplies",
    "packaging_materials",
    "reverse_logistics",
    "fleet_maintenance",
    "it_and_wms_software",
    "cleaning_and_facilities",
]
SupplierStatus = Literal["active", "suspended"]
PositiveRate = Annotated[float, PydanticField(gt=0, allow_inf_nan=False)]


class SupplierCreate(BaseModel):
    """Supplier request body, excluding the system-generated timestamp and ID."""

    model_config = ConfigDict(extra="forbid")

    name: str = PydanticField(min_length=1)
    country: SupplierCountry
    categories: list[SupplierCategory] = PydanticField(min_length=1)
    rate_per_shipment: PositiveRate
    currency: SupplierCurrency
    status: SupplierStatus
    service_zone: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("name", "service_zone", "contact_email", "notes")
    @classmethod
    def strip_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("name must not be blank")
        return value

    @field_validator("rate_per_shipment", mode="before")
    @classmethod
    def rate_must_be_numeric(cls, value: object) -> object:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(
                "rate_per_shipment must be a number greater than 0")
        if not math.isfinite(value):
            raise ValueError("rate_per_shipment must be finite")
        return value

    @model_validator(mode="after")
    def currency_must_match_country(self) -> "SupplierCreate":
        expected = "USD" if self.country == "USA" else "EUR"
        if self.currency != expected:
            raise ValueError(f"currency for {self.country} must be {expected}")
        return self


class SupplierRateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rate_per_shipment: PositiveRate

    @field_validator("rate_per_shipment", mode="before")
    @classmethod
    def rate_must_be_numeric(cls, value: object) -> object:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(
                "rate_per_shipment must be a number greater than 0")
        if not math.isfinite(value):
            raise ValueError("rate_per_shipment must be finite")
        return value


class SupplierStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: SupplierStatus


class SupplierResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    country: SupplierCountry
    categories: list[SupplierCategory] = PydanticField(min_length=1)
    rate_per_shipment: PositiveRate
    currency: SupplierCurrency
    updated_at: datetime
    status: SupplierStatus
    service_zone: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def currency_must_match_country(self) -> "SupplierResponse":
        expected = "USD" if self.country == "USA" else "EUR"
        if self.currency != expected:
            raise ValueError(f"currency for {self.country} must be {expected}")
        return self


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
