"""Idempotently seed the local TrackFlow inventory database with briefing fixtures."""

from __future__ import annotations

from sqlmodel import Session, select

from services.database import create_db_and_tables, engine
from services.models import SKU, StockEntry, StockExit

USER_UUID = "00000000-0000-4000-8000-000000000001"

PRODUCTS = [
    {"name": "Zapatilla blanca clásica - Talla 42", "sku": "CLT-SNK-W-42",
        "client_name": "PureStep Footwear", "category": "fashion", "warehouse": "LA"},
    {"name": "Zapatilla blanca clásica - Talla 42", "sku": "CLT-SNK-W-42-Z",
        "client_name": "PureStep Footwear", "category": "fashion", "warehouse": "ZGZ"},
    {"name": "Auriculares inalámbricos Pro", "sku": "TEC-EAR-001",
        "client_name": "SoundWave Electronics", "category": "electronics", "warehouse": "LA"},
    {"name": "Sérum facial hidratante 30ml", "sku": "CSM-SRM-030",
        "client_name": "GlowLab Cosmetics", "category": "cosmetics", "warehouse": "ZGZ"},
    {"name": "Chino slim fit - marino 32/32", "sku": "CLT-CHN-N-32",
        "client_name": "UrbanThread", "category": "fashion", "warehouse": "LA"},
    {"name": "Cargador rápido USB-C 65W", "sku": "TEC-CHG-065",
        "client_name": "SoundWave Electronics", "category": "electronics", "warehouse": "ZGZ"},
]

ENTRIES = [
    ("CLT-SNK-W-42", 12, "PO-2024-0098", "LA"),
    ("CLT-SNK-W-42", 8, "GR-LA-0234", "LA"),
    ("CLT-SNK-W-42-Z", 15, "PO-2024-0101", "ZGZ"),
    ("TEC-EAR-001", 10, "PO-2024-0102", "LA"),
    ("CSM-SRM-030", 20, "GR-ZGZ-0178", "ZGZ"),
    ("CLT-CHN-N-32", 9, "PO-2024-0104", "LA"),
    ("TEC-CHG-065", 14, "PO-2024-0105", "ZGZ"),
]

EXITS = [
    ("CLT-SNK-W-42", 5, "dispatch", "1Z999AA10123456784", "LA"),
    ("CLT-SNK-W-42-Z", 3, "dispatch", "1Z999AA10123456785", "ZGZ"),
    ("TEC-EAR-001", 2, "loss", None, "LA"),
    ("CSM-SRM-030", 1, "loss", None, "ZGZ"),
]


def seed() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        sku_by_code: dict[str, SKU] = {}
        for product in PRODUCTS:
            sku = session.exec(select(SKU).where(
                SKU.sku == product["sku"])).first()
            if sku is None:
                sku = SKU.model_validate(product)
                session.add(sku)
                session.flush()
            sku_by_code[product["sku"]] = sku

        for code, quantity, reference, warehouse in ENTRIES:
            sku = sku_by_code[code]
            existing = session.exec(
                select(StockEntry).where(
                    StockEntry.sku_id == sku.id,
                    StockEntry.reference == reference,
                    StockEntry.warehouse == warehouse,
                )
            ).first()
            if existing is None:
                session.add(StockEntry(sku_id=int(sku.id), quantity=quantity,
                            reference=reference, warehouse=warehouse, user_uuid=USER_UUID))

        for code, quantity, exit_type, tracking_number, warehouse in EXITS:
            sku = sku_by_code[code]
            existing = session.exec(
                select(StockExit).where(
                    StockExit.sku_id == sku.id,
                    StockExit.exit_type == exit_type,
                    StockExit.tracking_number == tracking_number,
                    StockExit.warehouse == warehouse,
                )
            ).first()
            if existing is None:
                session.add(StockExit(sku_id=int(sku.id), quantity=quantity, exit_type=exit_type,
                            tracking_number=tracking_number, warehouse=warehouse, user_uuid=USER_UUID))
        session.commit()
    print("TrackFlow seed completed (6 SKUs, 7 entries, 4 exits).")


if __name__ == "__main__":
    seed()
