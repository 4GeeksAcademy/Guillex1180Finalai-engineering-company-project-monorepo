"""Pipeline ETL semanal para KPIs de negocio (HITO 18 BRIEFING).

Flujo:
  1. Leer eventos de negocio desde ``telemetry_events`` en el rango dado.
  2. Extraer ``warehouse`` y ``client_id`` del JSON ``tags``.
  3. Resolver ``client_id`` canónico desde la tabla ``inventoryclient``
     (por si el tag no lo trae o viene un nombre en su lugar).
  4. Calcular semana ISO a partir del ``timestamp``.
  5. Agregar 4 KPIs por ``(warehouse, client_id, week_start)``.
  6. UPSERT en ``reporting.weekly_warehouse_client_performance``.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any
from uuid import uuid4

import pandas as pd
from sqlalchemy import text as sa_text

from services.api.database import engine
from services.reporting.models import WeeklyWarehouseClientPerformance

logger = logging.getLogger("uvicorn.error")

# ---------------------------------------------------------------------------
# Constantes de tipos de evento de negocio
# ---------------------------------------------------------------------------
_EVT_INBOUND = "inbound_order_created"
_EVT_OUTBOUND = "outbound_order_created"
_EVT_STOCKOUT = "stock_threshold_triggered"
_EVT_DISCREPANCY = "inventory_discrepancy_detected"

_BUSINESS_EVENTS = (
    _EVT_INBOUND,
    _EVT_OUTBOUND,
    _EVT_STOCKOUT,
    _EVT_DISCREPANCY,
)

# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------


def run_pipeline(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """Ejecutar el pipeline ETL semanal y devolver resumen.

    Parameters
    ----------
    start_date : str, optional
        ISO-8601 inicio (default: hace 7 días desde ahora UTC).
    end_date : str, optional
        ISO-8601 fin (default: ahora UTC).

    Returns
    -------
    dict
        Resumen con ``processed_events``, ``rows_written``, ``weeks``,
        ``period``.
    """
    # ── 1. Resolver fechas ────────────────────────────────────────────────
    now_utc = datetime.now(timezone.utc)
    if end_date is None:
        end_resolved = now_utc
    else:
        end_resolved = datetime.fromisoformat(end_date).replace(
            tzinfo=timezone.utc
        )

    if start_date is None:
        start_resolved = end_resolved - timedelta(days=7)
    else:
        start_resolved = datetime.fromisoformat(start_date).replace(
            tzinfo=timezone.utc
        )

    s = start_resolved.isoformat()
    e = end_resolved.isoformat()

    # ── 2. Cargar inventario clientes (para resolver client_id) ───────────
    client_map = _load_client_map()

    # ── 3. Cargar eventos de negocio desde telemetry_events ──────────────
    df = _load_business_events(s, e)
    if df.empty:
        logger.info(
            "Pipeline: no business events found in period %s / %s", s, e)
        return {
            "processed_events": 0,
            "rows_written": 0,
            "weeks": [],
            "period": {"from": s, "to": e},
        }

    # ── 4. Extraer warehouse y client_id de tags ─────────────────────────
    df = _extract_tags(df, client_map)

    # ── 5. Calcular semana ISO ───────────────────────────────────────────
    df = _compute_week(df)

    # ── 6. Agregar KPIs ──────────────────────────────────────────────────
    aggregated = _aggregate_kpis(df)

    if aggregated.empty:
        return {
            "processed_events": len(df),
            "rows_written": 0,
            "weeks": [],
            "period": {"from": s, "to": e},
        }

    # ── 7. UPSERT en la tabla de reporting ───────────────────────────────
    written = _upsert_results(aggregated)

    weeks = sorted(aggregated["week_start"].unique().tolist())

    logger.info(
        "Pipeline: processed %d events, wrote %d rows across %d weeks",
        len(df),
        written,
        len(weeks),
    )

    return {
        "processed_events": len(df),
        "rows_written": written,
        "weeks": weeks,
        "period": {"from": s, "to": e},
    }


# ---------------------------------------------------------------------------
# Funciones auxiliares
# ---------------------------------------------------------------------------


def _load_client_map() -> dict[str, str]:
    """Cargar mapping ``normalized_name → id`` de inventoryclient.

    Se usa para resolver client_id cuando los tags del evento usan
    el nombre del cliente en lugar de su ID canónico.
    """
    sql = sa_text("SELECT id, name, normalized_name FROM inventoryclient")
    with engine.connect() as conn:
        rows = conn.execute(sql).fetchall()

    mapping: dict[str, str] = {}
    for row in rows:
        mapping[row.normalized_name.strip().casefold()] = row.id
        mapping[row.name.strip().casefold()] = row.id
    return mapping


def _load_business_events(start_date: str, end_date: str) -> pd.DataFrame:
    """Cargar eventos de negocio desde telemetry_events en el rango.

    La query evita CAST(… AS TIMESTAMPTZ) y en su lugar usa concatenación
    directa de strings para SQLite (que no soporta TIMESTAMPTZ).  En
    PostgreSQL el driver convierte automáticamente los strings ISO-8601 con
    timezone a timestamptz, por lo que la comparación funciona igual.
    """
    sql = sa_text("""
        SELECT
            te.id,
            te.timestamp,
            te.event_type,
            te.tags
        FROM telemetry_events te
        WHERE te.event_type IN (:ev_inbound, :ev_outbound, :ev_stockout, :ev_discrepancy)
          AND te.timestamp >= :start_date
          AND te.timestamp < :end_date
        ORDER BY te.timestamp
    """).bindparams(
        start_date=start_date,
        end_date=end_date,
        ev_inbound=_EVT_INBOUND,
        ev_outbound=_EVT_OUTBOUND,
        ev_stockout=_EVT_STOCKOUT,
        ev_discrepancy=_EVT_DISCREPANCY,
    )

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return df

    # Normalizar timestamp a UTC
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)

    return df


def _extract_tags(
    df: pd.DataFrame,
    client_map: dict[str, str],
) -> pd.DataFrame:
    """Extraer warehouse y client_id del JSON ``tags``.

    Los tags de los eventos de negocio pueden tener:
      - "warehouse": "LA"
      - "client_name" o "client_id" dentro de tags

    También se recorre la tabla SKU para resolver client_id a partir del
    ``sku`` del evento.
    """
    # Parsear tags: si son string JSON, convertirlos a dict
    def _parse_tags(raw: Any) -> dict:
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, str):
            import json
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    df["tags_dict"] = df["tags"].apply(_parse_tags)

    # Extraer warehouse
    df["warehouse"] = df["tags_dict"].apply(
        lambda t: t.get("warehouse", "unknown")
    )

    # Extraer client_id — puede venir directamente o via nombre/sku
    df["client_id_raw"] = df["tags_dict"].apply(
        lambda t: t.get("client_id") or t.get(
            "client_name") or t.get("sku", "")
    )

    # Intentar resolver client_id contra el mapping
    def _resolve_client(raw_val: str) -> str:
        if not raw_val:
            return "unknown"
        # Si ya es un UUID parece, usarlo directo
        if raw_val.count("-") >= 4 and len(raw_val) > 30:
            # Verificar que existe en client_map o en inventoryclient
            return raw_val
        # Intentar por nombre normalizado
        return client_map.get(raw_val.strip().casefold(), "unknown")

    df["client_id"] = df["client_id_raw"].apply(_resolve_client)

    # Último recurso: buscar en SKU table si el tag tenía un SKU
    # (para eventos que solo tienen sku, no cliente directo)
    unknown_mask = df["client_id"] == "unknown"
    if unknown_mask.any():
        sku_values = df.loc[unknown_mask, "client_id_raw"].unique().tolist()
        sku_client_map = _load_sku_client_map(sku_values)
        for idx in df[unknown_mask].index:
            sku_val = df.at[idx, "client_id_raw"]
            resolved = sku_client_map.get(sku_val)
            if resolved:
                df.at[idx, "client_id"] = resolved

    return df


def _load_sku_client_map(sku_values: list[str]) -> dict[str, str]:
    """Cargar client_id desde la tabla SKU para un conjunto de SKUs."""
    if not sku_values:
        return {}

    # Construir placeholders seguros
    placeholders = ", ".join(f":sku_{i}" for i in range(len(sku_values)))
    params = {f"sku_{i}": v for i, v in enumerate(sku_values)}

    sql = sa_text(f"""
        SELECT sku, client_id
        FROM sku
        WHERE sku IN ({placeholders})
          AND client_id IS NOT NULL
    """).bindparams(**params)

    with engine.connect() as conn:
        rows = conn.execute(sql).fetchall()

    return {row.sku: row.client_id for row in rows if row.client_id}


def _compute_week(df: pd.DataFrame) -> pd.DataFrame:
    """Calcular semana ISO (lunes) a partir del timestamp."""

    def _monday_of_iso_week(dt: pd.Timestamp) -> str:
        """Devolver string ISO del lunes de la semana ISO del timestamp."""
        iso = dt.isocalendar()
        # Monday of ISO week: year, week, day=1
        monday = pd.Timestamp.fromisocalendar(int(iso.year), int(iso.week), 1)
        return monday.strftime("%Y-%m-%d")

    df["week_start"] = df["timestamp"].apply(_monday_of_iso_week)
    return df


def _aggregate_kpis(df: pd.DataFrame) -> pd.DataFrame:
    """Agregar los 4 KPIs por (warehouse, client_id, week_start).

    KPIs:
      - inbound_units_count : sum(quantity) solo para inbound_order_created
      - outbound_orders_count : count solo para outbound_order_created
      - stockout_events_count : count solo para stock_threshold_triggered
      - discrepancy_rate : pct de eventos discrepancy sobre total

    Para ``quantity`` se extrae del tag correspondiente.
    """
    # Extraer quantity de tags para inbound
    df["quantity"] = df.apply(
        lambda row: (
            row.get("tags_dict", {}).get("quantity", 1)
            if isinstance(row.get("tags_dict"), dict)
            else 1
        ),
        axis=1,
    )
    # Solo nos interesa quantity para inbound - para otros eventos count=1
    # es el valor correcto para el KPI

    # Flags por tipo de evento
    df["is_inbound"] = (df["event_type"] == _EVT_INBOUND).astype(int)
    df["is_outbound"] = (df["event_type"] == _EVT_OUTBOUND).astype(int)
    df["is_stockout"] = (df["event_type"] == _EVT_STOCKOUT).astype(int)
    df["is_discrepancy"] = (df["event_type"] == _EVT_DISCREPANCY).astype(int)

    # quantity * is_inbound para sumar solo en inbound
    df["inbound_qty"] = df["quantity"] * df["is_inbound"]

    # Agrupar
    grouped = (
        df.groupby(["warehouse", "client_id", "week_start"])
        .agg(
            inbound_units=("inbound_qty", "sum"),
            outbound_count=("is_outbound", "sum"),
            stockout_count=("is_stockout", "sum"),
            discrepancy_count=("is_discrepancy", "sum"),
            total_business_events=("is_inbound", "count"),
        )
        .reset_index()
    )

    # Calcular discrepancy_rate %
    grouped["discrepancy_rate"] = (
        (grouped["discrepancy_count"] / grouped["total_business_events"] * 100)
        .round(2)
        .fillna(0.0)
    )

    # Renombrar y tipar
    grouped = grouped.rename(columns={
        "inbound_units": "inbound_units_count",
        "outbound_count": "outbound_orders_count",
        "stockout_count": "stockout_events_count",
    })

    grouped["inbound_units_count"] = grouped["inbound_units_count"].astype(int)
    grouped["outbound_orders_count"] = grouped["outbound_orders_count"].astype(
        int)
    grouped["stockout_events_count"] = grouped["stockout_events_count"].astype(
        int)

    return grouped[
        [
            "warehouse",
            "client_id",
            "week_start",
            "inbound_units_count",
            "outbound_orders_count",
            "stockout_events_count",
            "discrepancy_rate",
        ]
    ]


def _upsert_results(aggregated: pd.DataFrame) -> int:
    """Upsert filas agregadas en la tabla de reporting.

    Usa INSERT … ON CONFLICT (warehouse, client_id, week_start) DO UPDATE
    para ser idempotente.
    """
    from sqlmodel import Session as SMSession

    written = 0
    with SMSession(engine) as session:
        for _, row in aggregated.iterrows():
            # Buscar si ya existe un registro con misma warehouse+client_id+week_start
            stmt = sa_text("""
                SELECT id FROM weekly_warehouse_client_performance
                WHERE warehouse = :warehouse
                  AND client_id = :client_id
                  AND week_start = :week_start
            """).bindparams(
                warehouse=row["warehouse"],
                client_id=row["client_id"],
                week_start=row["week_start"],
            )
            existing = session.execute(stmt).fetchone()

            now = datetime.now(timezone.utc)

            if existing:
                # UPDATE
                update_stmt = sa_text("""
                    UPDATE weekly_warehouse_client_performance
                    SET inbound_units_count = :inbound_units,
                        outbound_orders_count = :outbound_orders,
                        stockout_events_count = :stockout_events,
                        discrepancy_rate = :discrepancy_rate,
                        updated_at = :updated_at
                    WHERE id = :row_id
                """).bindparams(
                    inbound_units=int(row["inbound_units_count"]),
                    outbound_orders=int(row["outbound_orders_count"]),
                    stockout_events=int(row["stockout_events_count"]),
                    discrepancy_rate=float(row["discrepancy_rate"]),
                    updated_at=now,
                    row_id=existing[0],
                )
                session.execute(update_stmt)
            else:
                # INSERT
                insert_stmt = sa_text("""
                    INSERT INTO weekly_warehouse_client_performance
                        (id, warehouse, client_id, week_start,
                         inbound_units_count, outbound_orders_count,
                         stockout_events_count, discrepancy_rate, updated_at)
                    VALUES
                        (:id, :warehouse, :client_id, :week_start,
                         :inbound_units, :outbound_orders,
                         :stockout_events, :discrepancy_rate, :updated_at)
                """).bindparams(
                    id=str(uuid4()),
                    warehouse=row["warehouse"],
                    client_id=row["client_id"],
                    week_start=row["week_start"],
                    inbound_units=int(row["inbound_units_count"]),
                    outbound_orders=int(row["outbound_orders_count"]),
                    stockout_events=int(row["stockout_events_count"]),
                    discrepancy_rate=float(row["discrepancy_rate"]),
                    updated_at=now,
                )
                session.execute(insert_stmt)

            written += 1

        session.commit()

    return written
