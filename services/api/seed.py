"""Idempotently seed the local TrackFlow inventory database with briefing fixtures."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib

from sqlmodel import Session, select, text
from tinydb import TinyDB

from services.api.database import _tinydb_path, create_db_and_tables, engine
from services.api.models import (InventoryAudit, InventoryClient, SKU,
                                 StockEntry, StockExit, TelemetryRecord)
from services.api.telemetry import event_id_for, record_event
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
    {"name": "Vestido midi terracota", "sku": "URB-DRS-021",
        "client_name": "UrbanThread", "category": "fashion", "warehouse": "ZGZ"},
    {"name": "Crema solar SPF50", "sku": "GLW-SPF-050",
        "client_name": "GlowLab Cosmetics", "category": "cosmetics", "warehouse": "LA"},
    {"name": "Auriculares compactos", "sku": "SND-EAR-010",
        "client_name": "SoundWave Electronics", "category": "electronics", "warehouse": "ZGZ"},
    {"name": "Sudadera básica negra", "sku": "PST-HOD-BLK",
        "client_name": "PureStep Footwear", "category": "fashion", "warehouse": "LA"},
]

ENTRIES = [
    ("CLT-SNK-W-42", 12, "PO-2024-0098", "LA"),
    ("CLT-SNK-W-42", 8, "GR-LA-0234", "LA"),
    ("CLT-SNK-W-42-Z", 15, "PO-2024-0101", "ZGZ"),
    ("TEC-EAR-001", 10, "PO-2024-0102", "LA"),
    ("CSM-SRM-030", 20, "GR-ZGZ-0178", "ZGZ"),
    ("CLT-CHN-N-32", 9, "PO-2024-0104", "LA"),
    ("TEC-CHG-065", 14, "PO-2024-0105", "ZGZ"),
    ("URB-DRS-021", 18, "PO-2024-0106", "ZGZ"),
    ("GLW-SPF-050", 16, "PO-2024-0107", "LA"),
    ("SND-EAR-010", 11, "PO-2024-0108", "ZGZ"),
    ("PST-HOD-BLK", 13, "PO-2024-0109", "LA"),
    ("CLT-SNK-W-42", 10, "PO-2024-0110", "LA"),
    ("TEC-EAR-001", 9, "PO-2024-0111", "LA"),
    ("CSM-SRM-030", 12, "PO-2024-0112", "ZGZ"),
    ("URB-DRS-021", 7, "PO-2024-0113", "ZGZ"),
    ("GLW-SPF-050", 8, "PO-2024-0114", "LA"),
    ("SND-EAR-010", 6, "PO-2024-0115", "ZGZ"),
    ("PST-HOD-BLK", 5, "PO-2024-0116", "LA"),
]

EXITS = [
    ("CLT-SNK-W-42", 5, "dispatch", "1Z999AA10123456784", "LA"),
    ("CLT-SNK-W-42-Z", 3, "dispatch", "1Z999AA10123456785", "ZGZ"),
    ("TEC-EAR-001", 2, "loss", None, "LA"),
    ("CSM-SRM-030", 1, "loss", None, "ZGZ"),
    ("URB-DRS-021", 4, "dispatch", "DEMO-OUT-005", "ZGZ"),
    ("GLW-SPF-050", 3, "dispatch", "DEMO-OUT-006", "LA"),
    ("SND-EAR-010", 2, "dispatch", "DEMO-OUT-007", "ZGZ"),
    ("PST-HOD-BLK", 3, "dispatch", "DEMO-OUT-008", "LA"),
    ("CLT-SNK-W-42", 4, "dispatch", "DEMO-OUT-009", "LA"),
    ("TEC-EAR-001", 3, "dispatch", "DEMO-OUT-010", "LA"),
    ("CSM-SRM-030", 5, "dispatch", "DEMO-OUT-011", "ZGZ"),
    ("URB-DRS-021", 6, "dispatch", "DEMO-OUT-012", "ZGZ"),
    ("GLW-SPF-050", 7, "dispatch", "DEMO-OUT-013", "LA"),
    ("SND-EAR-010", 4, "dispatch", "DEMO-OUT-014", "ZGZ"),
    ("PST-HOD-BLK", 2, "dispatch", "DEMO-OUT-015", "LA"),
    ("TEC-CHG-065", 3, "dispatch", "DEMO-OUT-016", "ZGZ"),
    ("CLT-SNK-W-42-Z", 5, "dispatch", "DEMO-OUT-017", "ZGZ"),
    ("TEC-EAR-001", 4, "dispatch", "DEMO-OUT-018", "LA"),
    ("CSM-SRM-030", 6, "dispatch", "DEMO-OUT-019", "ZGZ"),
    ("URB-DRS-021", 3, "dispatch", "DEMO-OUT-020", "ZGZ"),
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


# ─────────────────────────────────────────────────────────────
# Telemetry seed — genera ≥20 eventos realistas para HITO 18
# ─────────────────────────────────────────────────────────────

TELEMETRY_SEED_EVENTS: list[dict] = [
    # --- API latency events (rendimiento) ---
    {"event_type": "api_latency_recorded", "level": "info", "service": "api",
     "properties": {"route": "inventory_products_list", "method": "GET", "status_code": 200, "duration_ms": 45.2}},
    {"event_type": "api_latency_recorded", "level": "info", "service": "api",
     "properties": {"route": "inventory_product_detail", "method": "GET", "status_code": 200, "duration_ms": 12.8}},
    {"event_type": "api_latency_recorded", "level": "info", "service": "api",
     "properties": {"route": "inventory_orders_list", "method": "GET", "status_code": 200, "duration_ms": 38.1}},
    {"event_type": "api_latency_recorded", "level": "info", "service": "api",
     "properties": {"route": "auth_login", "method": "POST", "status_code": 200, "duration_ms": 152.7}},
    {"event_type": "api_latency_recorded", "level": "info", "service": "api",
     "properties": {"route": "inventory_inbound_create", "method": "POST", "status_code": 200, "duration_ms": 67.3}},
    {"event_type": "api_latency_recorded", "level": "info", "service": "api",
     "properties": {"route": "inventory_outbound_create", "method": "POST", "status_code": 200, "duration_ms": 55.9}},
    # --- API errors ---
    {"event_type": "api_error_recorded", "level": "error", "service": "api",
     "properties": {"route": "inventory_product_detail", "method": "GET", "status_code": 404, "error_code": "http_404", "error_class": "not_found"}},
    {"event_type": "api_error_recorded", "level": "error", "service": "api",
     "properties": {"route": "auth_login", "method": "POST", "status_code": 401, "error_code": "http_401", "error_class": "authorization"}},
    {"event_type": "api_error_recorded", "level": "error", "service": "api",
     "properties": {"route": "inventory_outbound_create", "method": "POST", "status_code": 422, "error_code": "http_422", "error_class": "validation"}},
    # --- Auth events ---
    {"event_type": "auth_login_succeeded", "level": "info", "service": "api",
     "properties": {"method": "password", "user_id": "usr-001"}},
    {"event_type": "auth_login_failed", "level": "error", "service": "api",
     "properties": {"method": "password", "failure_reason": "invalid_credentials"}},
    {"event_type": "auth_login_succeeded", "level": "info", "service": "api",
     "properties": {"method": "token", "user_id": "usr-002"}},
    {"event_type": "auth_login_failed", "level": "error", "service": "api",
     "properties": {"method": "password", "failure_reason": "account_locked"}},
    {"event_type": "session_expired", "level": "warn", "service": "api",
     "properties": {"user_id": "usr-001", "session_duration_hours": 8.0}},
    # --- Backoffice page views (volumen de uso) ---
    {"event_type": "backoffice_page_viewed", "level": "info", "service": "backoffice",
     "properties": {"view": "inventory/products", "warehouse": "LA"}},
    {"event_type": "backoffice_page_viewed", "level": "info", "service": "backoffice",
     "properties": {"view": "inventory/products", "warehouse": "ZGZ"}},
    {"event_type": "backoffice_page_viewed", "level": "info", "service": "backoffice",
     "properties": {"view": "inventory/orders", "warehouse": "LA"}},
    {"event_type": "backoffice_page_viewed", "level": "info", "service": "backoffice",
     "properties": {"view": "suppliers", "warehouse": "ZGZ"}},
    {"event_type": "backoffice_page_viewed", "level": "info", "service": "backoffice",
     "properties": {"view": "incidents"}},
    # --- Inventory business events ---
    {"event_type": "inbound_order_created", "level": "info", "service": "api",
     "properties": {"sku": "CLT-SNK-W-42", "quantity": 100, "warehouse": "LA"}},
    {"event_type": "outbound_order_created", "level": "info", "service": "api",
     "properties": {"sku": "TEC-EAR-001", "quantity": 15, "warehouse": "LA"}},
    {"event_type": "stock_threshold_triggered", "level": "warn", "service": "api",
     "properties": {"sku": "CLT-SNK-W-42", "quantity": 22, "warehouse": "LA", "threshold": 22}},
    {"event_type": "inventory_discrepancy_detected", "level": "error", "service": "api",
     "properties": {"sku": "CSM-SRM-030", "warehouse": "ZGZ", "system_qty": 45, "physical_qty": 42}},
    {"event_type": "direct_stock_edit_rejected", "level": "error", "service": "api",
     "properties": {"sku": "TEC-CHG-065", "warehouse": "ZGZ", "reason": "threshold_exceeded", "quantity": -50}},
    # --- Frontend events ---
    {"event_type": "frontend_page_load_recorded", "level": "info", "service": "backoffice",
     "properties": {"view": "inventory/products", "duration_ms": 2340.0}},
    {"event_type": "frontend_error_captured", "level": "error", "service": "backoffice",
     "properties": {"view": "inventory/orders", "error_class": "ApiError", "status_code": 500}},
    {"event_type": "frontend_page_load_recorded", "level": "info", "service": "backoffice",
     "properties": {"view": "login", "duration_ms": 890.0}},
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
                normalized_name = " ".join(
                    product["client_name"].strip().casefold().split())
                client = session.exec(
                    select(InventoryClient).where(
                        InventoryClient.normalized_name == normalized_name
                    )
                ).first()
                if client is None:
                    client = InventoryClient(
                        name=product["client_name"], normalized_name=normalized_name
                    )
                    session.add(client)
                    session.flush()
                sku = SKU.model_validate({**product, "client_id": client.id})
                sku.threshold_quantity = 22 if product["sku"] == "CLT-SNK-W-42" else (
                    20 if product["sku"] == "GLW-SPF-050" else None
                )
                session.add(sku)
                session.flush()
                inserted_skus += 1
            elif sku.client_id is None:
                normalized_name = " ".join(
                    sku.client_name.strip().casefold().split())
                client = session.exec(
                    select(InventoryClient).where(
                        InventoryClient.normalized_name == normalized_name
                    )
                ).first()
                if client is None:
                    client = InventoryClient(
                        name=sku.client_name, normalized_name=normalized_name)
                    session.add(client)
                    session.flush()
                sku.client_id = client.id
                session.add(sku)
            if sku.sku in {"CLT-SNK-W-42", "GLW-SPF-050"} and sku.threshold_quantity is None:
                sku.threshold_quantity = 22 if sku.sku == "CLT-SNK-W-42" else 20
                session.add(sku)
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
                entry = StockEntry(sku_id=int(sku.id), quantity=quantity,
                                   reference=reference, warehouse=warehouse, user_uuid=USER_UUID)
                session.add(entry)
                session.flush()
                session.add(_seed_event(
                    session,
                    "inbound_order_created",
                    {
                        **_seed_dimensions(sku, warehouse),
                        "quantity": quantity,
                        "order_id": str(entry.id),
                    },
                    event_id_for("inbound_order_created", entry.id),
                ))
                inserted_entries += 1

        session.flush()
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
                before = _stock_for_seed(session, int(sku.id), warehouse)
                exit_record = StockExit(sku_id=int(sku.id), quantity=quantity, exit_type=exit_type,
                                        tracking_number=tracking_number, warehouse=warehouse,
                                        user_uuid=USER_UUID)
                session.add(exit_record)
                session.flush()
                session.add(_seed_event(
                    session,
                    "outbound_order_created",
                    {
                        **_seed_dimensions(sku, warehouse),
                        "quantity": quantity,
                        "order_id": str(exit_record.id),
                    },
                    event_id_for("outbound_order_created", exit_record.id),
                ))
                threshold = sku.threshold_quantity
                after = before - quantity
                if threshold is not None and before >= threshold and after < threshold:
                    session.add(_seed_event(
                        session,
                        "stock_threshold_triggered",
                        {
                            **_seed_dimensions(sku, warehouse),
                            "quantity": after,
                            "threshold_quantity": threshold,
                        },
                        event_id_for("stock_threshold_triggered",
                                     exit_record.id),
                    ))
                inserted_exits += 1

        # A synthetic count provides a reproducible discrepancy example without
        # changing the ledger or running automatically at API startup.
        sku = sku_by_code["TEC-EAR-001"]
        existing_audit = session.exec(
            select(InventoryAudit).where(
                InventoryAudit.sku_id == sku.id,
                InventoryAudit.user_uuid == USER_UUID,
            )
        ).first()
        if existing_audit is None:
            system_quantity = _stock_for_seed(
                session, int(sku.id), sku.warehouse)
            audit = InventoryAudit(
                sku_id=int(sku.id), warehouse=sku.warehouse,
                system_quantity=system_quantity, physical_quantity=system_quantity + 2,
                user_uuid=USER_UUID,
            )
            session.add(audit)
            session.flush()
            session.add(_seed_event(
                session,
                "inventory_discrepancy_detected",
                {
                    **_seed_dimensions(sku, sku.warehouse),
                    "quantity": 2,
                    "discrepancy_direction": "physical_higher",
                    "audit_id": audit.id,
                },
                event_id_for("inventory_discrepancy_detected", audit.id),
            ))
        session.commit()
    inserted_suppliers = seed_suppliers()
    print(
        "TrackFlow seed completed "
        f"({inserted_skus} SKUs, {inserted_entries} entries, "
        f"{inserted_exits} exits, {inserted_suppliers} suppliers inserted)."
    )
    return inserted_suppliers


def seed_telemetry() -> int:
    """Seed telemetry_events with varied operational events.

    Returns the number of new events inserted.
    Uses a deterministic MD5-based event_id so re-running is idempotent.
    """
    from services.api.routers.telemetry import _extract_value, _build_message

    with Session(engine) as session:
        existing_ids = {
            row[0] for row in
            session.exec(text("SELECT id FROM telemetry_events")).all()
        }

    records: list[TelemetryRecord] = []
    now = datetime.now(timezone.utc)

    for i, ev in enumerate(TELEMETRY_SEED_EVENTS):
        # Deterministic ID based on event content
        raw = f"telemetry-seed:{ev['event_type']}:{i}"
        event_id = hashlib.md5(raw.encode()).hexdigest()

        if event_id in existing_ids:
            continue

        # Spread timestamps over the last 7 days
        offset_hours = i * 6  # cada evento separado ~6h
        ts = now - timedelta(
            hours=offset_hours % 168,
            minutes=(i * 23) % 60,
        )

        tags = dict(ev["properties"])
        tags["eventId"] = event_id
        tags["schemaVersion"] = "1.0"

        records.append(TelemetryRecord(
            id=event_id,
            timestamp=ts,
            service=ev["service"],
            event_type=ev["event_type"],
            level=ev["level"],
            value=_extract_value(ev["event_type"], ev["properties"]),
            message=_build_message(ev["event_type"], ev["properties"]),
            tags=tags,
        ))

    if records:
        with Session(engine) as session:
            session.add_all(records)
            session.commit()

    return len(records)


def _seed_dimensions(sku: SKU, warehouse: str) -> dict[str, str]:
    warehouse_values = {"LA": "los_angeles", "ZGZ": "zaragoza"}
    category_values = {
        "fashion": "moda",
        "electronics": "electrónica",
        "cosmetics": "cosmética",
    }
    assert sku.client_id is not None
    return {
        "warehouse": warehouse_values[warehouse],
        "client_id": sku.client_id,
        "product_id": str(sku.id),
        "product_category": category_values[sku.category],
    }


def _seed_event(session: Session, event_type: str, properties: dict[str, object], event_id: str):
    return record_event(
        session,
        event_type=event_type,
        properties=properties,
        delivery="stream",
        event_id=event_id,
        user_id=USER_UUID,
    )


def _stock_for_seed(session: Session, sku_id: int, warehouse: str) -> int:
    entries = session.exec(
        select(StockEntry.quantity).where(
            StockEntry.sku_id == sku_id, StockEntry.warehouse == warehouse
        )
    ).all()
    exits = session.exec(
        select(StockExit.quantity).where(
            StockExit.sku_id == sku_id, StockExit.warehouse == warehouse
        )
    ).all()
    return sum(entries) - sum(exits)


if __name__ == "__main__":
    seed()
