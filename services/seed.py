"""Backward-compatible entry point for TrackFlow data seeding."""
from services.api.seed import (
    ENTRIES, EXITS, PRODUCTS, SUPPLIERS_SEED, USER_UUID, seed, seed_suppliers,
)
__all__ = [
    "ENTRIES", "EXITS", "PRODUCTS", "SUPPLIERS_SEED", "USER_UUID",
    "seed", "seed_suppliers",
]
if __name__ == "__main__":
    seed()
