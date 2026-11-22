"""Idempotently seed the local TrackFlow inventory database with briefing fixtures."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Session, select
from tinydb import TinyDB

from services.api.database import _tinydb_path, create_db_and_tables, engine
from services.api.models import SKU, StockEntry, StockExit
from services.api.models import SupplierCreate

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

SUPPLIERS_SEED = [
    {"name": "UPS Ground", "country": "USA", "categories": ["carrier_last_mile"], "rate_per_shipment": 7.45, "currency": "USD", "status": "active",
        "service_zone": "West Coast", "contact_email": "business@ups.com", "notes": "Carrier principal para entregas locales en Los Ángeles y alrededores."},
    {"name": "FedEx Ground", "country": "USA", "categories": ["carrier_last_mile"], "rate_per_shipment": 7.90,
        "currency": "USD", "status": "active", "service_zone": "Continental USA", "contact_email": "business.solutions@fedex.com"},
    {"name": "DHL Express USA", "country": "USA", "categories": ["carrier_last_mile", "carrier_international"], "rate_per_shipment": 14.20, "currency": "USD", "status": "active",
        "service_zone": "Continental USA + International", "contact_email": "business.us@dhl.com", "notes": "Usado para envíos urgentes y exportaciones a Europa."},
    {"name": "OnTrac", "country": "USA", "categories": ["carrier_last_mile"], "rate_per_shipment": 6.10, "currency": "USD", "status": "active",
        "service_zone": "West Coast", "contact_email": "solutions@ontrac.com", "notes": "Carrier regional. Mejor tarifa en la zona de Los Ángeles."},
    {"name": "Laser Ship", "country": "USA", "categories": ["carrier_last_mile"], "rate_per_shipment": 5.80, "currency": "USD", "status": "suspended",
        "service_zone": "East Coast", "contact_email": "business@lasership.com", "notes": "Suspendido. Tasa de incidencias superior al 8% en Q3."},
    {"name": "PackSource LA", "country": "USA", "categories": ["packaging_materials"], "rate_per_shipment": 0.42, "currency": "USD",
        "status": "active", "contact_email": "orders@packsource.com", "notes": "Cajas, relleno y precinto para el almacén de Los Ángeles."},
    {"name": "CleanTeam West", "country": "USA", "categories": ["cleaning_and_facilities"], "rate_per_shipment": 1800.0, "currency": "USD",
        "status": "active", "contact_email": "accounts@cleanteamwest.com", "notes": "Tarifa mensual por servicio de limpieza del almacén de LA."},
    {"name": "MRW España", "country": "Spain", "categories": ["carrier_last_mile"], "rate_per_shipment": 4.90, "currency": "EUR", "status": "active",
        "service_zone": "Península Ibérica", "contact_email": "clientes.empresa@mrw.es", "notes": "Carrier principal para entregas en España. Contrato negociado por volumen."},
    {"name": "SEUR", "country": "Spain", "categories": ["carrier_last_mile"], "rate_per_shipment": 5.20, "currency": "EUR",
        "status": "active", "service_zone": "Península Ibérica + Baleares", "contact_email": "grandes.cuentas@seur.com"},
    {"name": "DHL Express España", "country": "Spain", "categories": ["carrier_last_mile", "carrier_international"], "rate_per_shipment": 12.80, "currency": "EUR",
        "status": "active", "service_zone": "España + Internacional", "contact_email": "business.es@dhl.com", "notes": "Envíos urgentes y exportaciones desde Zaragoza."},
    {"name": "Nacex", "country": "Spain", "categories": ["carrier_last_mile"], "rate_per_shipment": 4.60, "currency": "EUR", "status": "active",
        "service_zone": "Aragón y zona norte", "contact_email": "empresas@nacex.es", "notes": "Carrier regional con buena cobertura en Aragón."},
    {"name": "Logística Inversa Iberia", "country": "Spain", "categories": ["reverse_logistics"], "rate_per_shipment": 6.30, "currency": "EUR",
        "status": "active", "contact_email": "operaciones@liiberia.es", "notes": "Gestión de devoluciones para el almacén de Zaragoza."},
    {"name": "Embalajes Zaragoza S.L.", "country": "Spain", "categories": [
        "packaging_materials"], "rate_per_shipment": 0.28, "currency": "EUR", "status": "active", "contact_email": "pedidos@embalajeszgz.es"},
    {"name": "SAP WM Cloud", "country": "USA", "categories": ["it_and_wms_software"], "rate_per_shipment": 2200.0, "currency": "USD", "status": "suspended",
        "contact_email": "enterprise@sap.com", "notes": "Suspendido. Andrés está evaluando alternativas más ligeras para el almacén de LA."},
    {"name": "ReturnBear", "country": "USA", "categories": ["reverse_logistics"], "rate_per_shipment": 4.15, "currency": "USD", "status": "active",
        "service_zone": "West Coast", "contact_email": "partnerships@returnbear.com", "notes": "Gestión de devoluciones para clientes de Los Ángeles."},
]


def seed_suppliers() -> int:
    """Insert briefing suppliers once and return the number inserted."""
    inserted = 0
    with TinyDB(_tinydb_path()) as db:
        table = db.table("suppliers")
        existing = {
            (
                str(doc.get("name", "")).strip().casefold(),
                doc.get("country"),
            )
            for doc in table.all()
        }
        for item in SUPPLIERS_SEED:
            validated = SupplierCreate.model_validate(item)
            identity = (
                validated.name.strip().casefold(),
                validated.country,
            )
            if identity in existing:
                continue
            document = validated.model_dump()
            document["updated_at"] = datetime.now(timezone.utc).isoformat()
            table.insert(document)
            existing.add(identity)
            inserted += 1
    return inserted


def seed() -> int:
    """Seed fixtures, print inserted counts, and return suppliers inserted."""
    create_db_and_tables()
    inserted_skus = 0
    inserted_entries = 0
    inserted_exits = 0
    with Session(engine) as session:
        sku_by_code: dict[str, SKU] = {}
        for product in PRODUCTS:
            sku = session.exec(select(SKU).where(
                SKU.sku == product["sku"])).first()
            if sku is None:
                sku = SKU.model_validate(product)
                session.add(sku)
                session.flush()
                inserted_skus += 1
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
                inserted_entries += 1

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
                inserted_exits += 1
        session.commit()
    inserted_suppliers = seed_suppliers()
    print(
        "TrackFlow seed completed "
        f"({inserted_skus} SKUs, {inserted_entries} entries, "
        f"{inserted_exits} exits, {inserted_suppliers} suppliers inserted)."
    )
    return inserted_suppliers


if __name__ == "__main__":
    seed()
