"""TrackFlow API models and SQLModel entities for the inventory ledger."""

from __future__ import annotations

from datetime import datetime, timezone
import math
from enum import Enum
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


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


def _validate_email(value: str) -> str:
    normalized = value.strip().casefold()
    if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
        raise ValueError("A valid email address is required")
    return normalized


class UserCreate(BaseModel):
    """Public registration payload; role is always assigned as ``user``."""

    model_config = ConfigDict(extra="forbid")

    email: str = PydanticField(min_length=3, max_length=254)
    password: str = PydanticField(min_length=8, max_length=128)
    name: Optional[str] = PydanticField(default=None, max_length=120)
    phone: Optional[str] = PydanticField(default=None, max_length=40)
    address: Optional[str] = PydanticField(default=None, max_length=300)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _validate_email(value)

    @field_validator("name", "phone", "address")
    @classmethod
    def strip_profile_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else None


class User(BaseModel):
    """TinyDB user record; personal contact data belongs to ``Profile``."""

    id: str
    email: str
    hashed_password: str
    is_active: bool = True
    role: UserRole = UserRole.USER
    created_at: datetime


class UserUpdate(BaseModel):
    """Credential fields that may be changed by the user or an admin."""

    model_config = ConfigDict(extra="forbid")

    email: Optional[str] = PydanticField(
        default=None, min_length=3, max_length=254)
    password: Optional[str] = PydanticField(
        default=None, min_length=8, max_length=128)
    role: Optional[UserRole] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _validate_email(value)

    @model_validator(mode="after")
    def require_changes(self) -> "UserUpdate":
        if not self.model_fields_set or any(
            getattr(self, field) is None for field in self.model_fields_set
        ):
            raise ValueError("At least one field must be provided")
        return self


class UserSelfUpdate(BaseModel):
    """Fields a user may change on their own account (never their role)."""

    model_config = ConfigDict(extra="forbid")

    email: Optional[str] = PydanticField(default=None, min_length=3, max_length=254)
    password: Optional[str] = PydanticField(default=None, min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        return _validate_email(value) if value is not None else None

    @model_validator(mode="after")
    def require_changes(self) -> "UserSelfUpdate":
        if not self.model_fields_set or any(
            getattr(self, field) is None for field in self.model_fields_set
        ):
            raise ValueError("At least one field must be provided")
        return self


class UserRead(BaseModel):
    """Safe public representation that never includes password hashes."""

    id: str
    email: str
    is_active: bool
    role: UserRole
    created_at: datetime


class Profile(BaseModel):
    """TinyDB profile record linked one-to-one using the TinyDB user ID."""

    id: str
    user_id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None


class ProfileRead(Profile):
    """Public profile representation."""


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = PydanticField(min_length=1, max_length=120)
    phone: Optional[str] = PydanticField(default=None, max_length=40)
    address: Optional[str] = PydanticField(default=None, max_length=300)

    @field_validator("name", "phone", "address")
    @classmethod
    def strip_profile_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("Name cannot be blank")
        return value


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().casefold()


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class AuthMeResponse(BaseModel):
    email: str
    role: UserRole
    profile: ProfileRead


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
