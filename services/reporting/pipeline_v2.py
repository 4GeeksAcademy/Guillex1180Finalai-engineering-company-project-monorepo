"""Prefect 3 ETL pipeline for TrackFlow weekly business KPIs (HITO 20).

This pipeline reads business events from ``telemetry_events``, aggregates
the four KPIs defined in the BRIEFING (inbound volume, outbound throughput,
stockout frequency, discrepancy rate), and upserts the results into
``reporting.weekly_warehouse_client_performance``.

Architecture (HITO 20 — Subflows)
----------------------------------
The pipeline is divided into **3 subflows** (`@flow`), each independently
executable with explicit inputs and outputs:

  1. ``subflow_extract``      — Load client_map + extract business events
  2. ``subflow_transform``    — Parse tags, resolve clients, aggregate KPIs
  3. ``subflow_load``         — UPSERT results + log pipeline run

A 4th optional subflow (``subflow_notify``) is invoked via
``return_state=True`` so a failure there never aborts the ETL.

Resilience features
-------------------
- ``retries`` / ``retry_delay_seconds`` on tasks that touch the database.
- ``cache_key_fn`` / ``cache_expiration`` on the expensive transform task.
- Optional subflow uses ``return_state=True`` so a notification failure
  does not abort the ETL.
- Idempotent UPSERT (SELECT + UPDATE/INSERT).
- Run metadata logged to ``reporting.pipeline_run_log``.

Usage
-----
    python services/reporting/pipeline_v2.py

    python services/reporting/pipeline_v2.py --start-date 2026-07-13 --end-date 2026-07-20
"""

from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any
from uuid import uuid4

import pandas as pd
from prefect import flow, task
from sqlalchemy import text as sa_text
from sqlmodel import Session

from services.api.database import engine, create_db_and_tables

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("trackflow.pipeline")

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


# ===================================================================
# Tasks (operaciones atómicas reutilizables por los subflows)
# ===================================================================


@task(
    retries=3,
    retry_delay_seconds=10,
)
def extract_business_events(
    start_date: str,
    end_date: str,
) -> pd.DataFrame:
    """Extraer eventos de negocio desde telemetry_events.

    Se configuran 3 reintentos con espera constante de 10 s porque la base
    de datos es un servicio externo que puede experimentar fallos transitorios
    (timeout de conexión, reinicio del servidor, etc.).  Tres reintentos
    cubren la mayoría de los escenarios sin alargar la espera total más de 30 s.
    """
    logger.info(
        "Extracting business events from %s to %s", start_date, end_date
    )

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
        logger.info("No business events found in period")
        return df

    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    logger.info("Extracted %d business events", len(df))
    return df


@task(
    cache_key_fn=lambda task_ctx, inputs: (
        f"transform:{task_ctx.parameters.get('start_date', '')}:"
        f"{task_ctx.parameters.get('end_date', '')}:"
        f"{hash(frozenset(inputs.get('client_map', {}).items()))}"
    ),
    cache_expiration=timedelta(hours=1),
)
def transform_aggregate_kpis(
    df: pd.DataFrame,
    client_map: dict[str, str],
) -> pd.DataFrame:
    """Agregar KPIs por (warehouse, client_id, week_start).

    Esta tarea tiene caché: la clave se compone del rango de fechas y un hash
    del client_map.  Si el pipeline se ejecuta dos veces en la misma hora con
    los mismos datos, Prefect reutilizará el resultado del cómputo anterior en
    lugar de repetir la transformación (que incluye parseo JSON, resolución
    de clientes, y agregación de pandas).
    """
    if df.empty:
        return df

    logger.info("Transforming %d events", len(df))

    # ── Parsear tags JSON ────────────────────────────────────────────────
    def _parse_tags(raw: Any) -> dict:
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, str):
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    df["tags_dict"] = df["tags"].apply(_parse_tags)

    # ── Extraer warehouse ────────────────────────────────────────────────
    df["warehouse"] = df["tags_dict"].apply(
        lambda t: t.get("warehouse", "unknown")
    )

    # ── Extraer client_id ────────────────────────────────────────────────
    df["client_id_raw"] = df["tags_dict"].apply(
        lambda t: t.get("client_id") or t.get(
            "client_name") or t.get("sku", "")
    )

    def _resolve_client(raw_val: str) -> str:
        if not raw_val:
            return "unknown"
        if raw_val.count("-") >= 4 and len(raw_val) > 30:
            return raw_val
        return client_map.get(raw_val.strip().casefold(), "unknown")

    df["client_id"] = df["client_id_raw"].apply(_resolve_client)

    # resolver SKU → client_id como fallback
    unknown_mask = df["client_id"] == "unknown"
    if unknown_mask.any():
        sku_values = df.loc[unknown_mask, "client_id_raw"].unique().tolist()
        sku_client_map = _load_sku_client_map(sku_values)
        for idx in df[unknown_mask].index:
            sku_val = df.at[idx, "client_id_raw"]
            resolved = sku_client_map.get(sku_val)
            if resolved:
                df.at[idx, "client_id"] = resolved

    # ── Calcular semana ISO ──────────────────────────────────────────────
    def _monday_of_iso_week(dt: pd.Timestamp) -> str:
        iso = dt.isocalendar()
        monday = pd.Timestamp.fromisocalendar(
            int(iso.year), int(iso.week), 1
        )
        return monday.strftime("%Y-%m-%d")

    df["week_start"] = df["timestamp"].apply(_monday_of_iso_week)

    # ── Extraer quantity para inbound ────────────────────────────────────
    df["quantity"] = df.apply(
        lambda row: (
            row.get("tags_dict", {}).get("quantity", 1)
            if isinstance(row.get("tags_dict"), dict)
            else 1
        ),
        axis=1,
    )

    # ── Flags por tipo de evento ─────────────────────────────────────────
    df["is_inbound"] = (df["event_type"] == _EVT_INBOUND).astype(int)
    df["is_outbound"] = (df["event_type"] == _EVT_OUTBOUND).astype(int)
    df["is_stockout"] = (df["event_type"] == _EVT_STOCKOUT).astype(int)
    df["is_discrepancy"] = (df["event_type"] == _EVT_DISCREPANCY).astype(int)

    df["inbound_qty"] = df["quantity"] * df["is_inbound"]

    # ── Agrupar ──────────────────────────────────────────────────────────
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

    grouped["discrepancy_rate"] = (
        (grouped["discrepancy_count"] / grouped["total_business_events"] * 100)
        .round(2)
        .fillna(0.0)
    )

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

    result = grouped[
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

    logger.info("Transformed into %d KPI rows", len(result))
    return result


@task(
    retries=2,
    retry_delay_seconds=5,
)
def load_upsert_results(aggregated: pd.DataFrame) -> int:
    """Upsert filas agregadas en la tabla de reporting.

    Idempotente: usa SELECT + UPDATE/INSERT manual con unique constraint
    (warehouse, client_id, week_start).
    """
    if aggregated.empty:
        logger.info("No rows to upsert")
        return 0

    logger.info("Upserting %d KPI rows", len(aggregated))

    written = 0
    with Session(engine) as session:
        for _, row in aggregated.iterrows():
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

    logger.info("Upserted %d rows", written)
    return written


@task
def _load_sku_client_map(sku_values: list[str]) -> dict[str, str]:
    """Cargar client_id desde la tabla SKU para un conjunto de SKUs."""
    if not sku_values:
        return {}

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


@task
def load_client_map() -> dict[str, str]:
    """Cargar mapping normalized_name → id desde inventoryclient."""
    sql = sa_text(
        "SELECT id, name, normalized_name FROM inventoryclient"
    )
    with engine.connect() as conn:
        rows = conn.execute(sql).fetchall()

    mapping: dict[str, str] = {}
    for row in rows:
        mapping[row.normalized_name.strip().casefold()] = row.id
        mapping[row.name.strip().casefold()] = row.id
    return mapping


@task
def log_pipeline_run(
    start_time: datetime,
    end_time: datetime,
    records_processed: int,
    status: str,
    error_message: str | None = None,
    details: dict | None = None,
) -> None:
    """Registrar metadata de la corrida en reporting.pipeline_run_log."""
    with Session(engine) as session:
        stmt = sa_text("""
            INSERT INTO pipeline_run_log
                (id, pipeline_name, start_time, end_time,
                 records_processed, status, error_message, details,
                 created_at)
            VALUES
                (:id, :pipeline_name, :start_time, :end_time,
                 :records_processed, :status, :error_message, :details,
                 :created_at)
        """).bindparams(
            id=str(uuid4()),
            pipeline_name="weekly_warehouse_client_performance",
            start_time=start_time,
            end_time=end_time,
            records_processed=records_processed,
            status=status,
            error_message=error_message,
            details=json.dumps(details) if details else None,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        session.execute(stmt)
        session.commit()

    logger.info(
        "Pipeline run logged: status=%s, records=%d, duration=%s",
        status,
        records_processed,
        end_time - start_time,
    )


# ===================================================================
# Subflows (HITO 20 — cada fase es un @flow independiente)
# ===================================================================


@flow(name="subflow_extract_events")
def subflow_extract(
    start_date: str,
    end_date: str,
) -> tuple[pd.DataFrame, dict[str, str]]:
    """Subflow 1/3: Extracción — cargar client_map + eventos de telemetría.

    Returns
    -------
    tuple[pd.DataFrame, dict[str, str]]
        (DataFrame de eventos, client_map para resolución de nombres).
    """
    logger.info("=== Subflow EXTRACT: %s → %s ===", start_date, end_date)
    client_map = load_client_map()
    df = extract_business_events(start_date, end_date)
    return df, client_map


@flow(name="subflow_transform_kpis")
def subflow_transform(
    df: pd.DataFrame,
    client_map: dict[str, str],
) -> pd.DataFrame:
    """Subflow 2/3: Transformación — parsear, resolver, agregar KPIs.

    Parameters
    ----------
    df : pd.DataFrame
        Eventos crudos de telemetry_events.
    client_map : dict[str, str]
        Mapping de nombres normalizados a client_id.

    Returns
    -------
    pd.DataFrame
        KPIs agregados por (warehouse, client_id, week_start).
    """
    logger.info("=== Subflow TRANSFORM: %d events ===", len(df))
    if df.empty:
        return df
    aggregated = transform_aggregate_kpis(df, client_map)
    return aggregated


@flow(name="subflow_load_results")
def subflow_load(
    aggregated: pd.DataFrame,
    df: pd.DataFrame,
    start_time: datetime,
) -> dict[str, Any]:
    """Subflow 3/3: Carga — UPSERT resultados + log de corrida.

    Parameters
    ----------
    aggregated : pd.DataFrame
        KPIs a escribir en la tabla de reporting.
    df : pd.DataFrame
        DataFrame original de eventos (solo para conteo).
    start_time : datetime
        Timestamp de inicio de la ejecución.

    Returns
    -------
    dict
        Resumen con ``processed_events``, ``rows_written``, ``weeks``,
        ``status``.
    """
    logger.info("=== Subflow LOAD: %d KPI rows ===", len(aggregated))

    result: dict[str, Any] = {
        "processed_events": len(df),
        "rows_written": 0,
        "weeks": [],
        "status": "success",
    }

    if aggregated.empty:
        logger.info("No KPI rows to load")
        end_time = datetime.now(timezone.utc)
        log_pipeline_run(
            start_time=start_time,
            end_time=end_time,
            records_processed=len(df),
            status="success",
            details=result,
        )
        return result

    written = load_upsert_results(aggregated)
    weeks = sorted(aggregated["week_start"].unique().tolist())

    result["rows_written"] = written
    result["weeks"] = weeks

    end_time = datetime.now(timezone.utc)
    log_pipeline_run(
        start_time=start_time,
        end_time=end_time,
        records_processed=len(df),
        status="success",
        details=result,
    )

    return result


@flow(name="subflow_notify")
def subflow_notify(summary: dict[str, Any]) -> str:
    """Subflow 4/4 (opcional): Notificar que el pipeline terminó.

    Se invoca con ``return_state=True`` desde el flow principal,
    por lo que un fallo aquí NO interrumpe el ETL.
    """
    msg = (
        f"Pipeline completed: {summary.get('processed_events', 0)} events, "
        f"{summary.get('rows_written', 0)} rows written, "
        f"status={summary.get('status', 'unknown')}"
    )
    logger.info("Notification: %s", msg)
    return msg


# ===================================================================
# Flow principal — coordina los 3 subflows en secuencia
# ===================================================================


@flow(name="weekly_warehouse_client_performance")
def run_pipeline_flow(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """Ejecutar el pipeline ETL semanal con tolerancia a fallos.

    El flow principal coordina 3 subflows en secuencia:
      1. ``subflow_extract``  — extrae datos
      2. ``subflow_transform`` — transforma y agrega KPIs
      3. ``subflow_load``     — carga resultados

    Un 4º subflow opcional (``subflow_notify``) se invoca con
    ``return_state=True`` para que un fallo no interrumpa el pipeline.

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
        ``period``, ``status``.
    """
    start_time = datetime.now(timezone.utc)

    # Asegurar que las tablas de reporting existan
    create_db_and_tables()

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

    result: dict[str, Any] = {
        "processed_events": 0,
        "rows_written": 0,
        "weeks": [],
        "period": {"from": s, "to": e},
        "status": "success",
    }

    try:
        # ── Subflow 1: Extracción ────────────────────────────────────────
        df, client_map = subflow_extract(s, e)

        if df.empty:
            logger.info("Pipeline: no business events found")
            end_time = datetime.now(timezone.utc)
            log_pipeline_run(
                start_time=start_time,
                end_time=end_time,
                records_processed=0,
                status="success",
                details=result,
            )
            return result

        # ── Subflow 2: Transformación ───────────────────────────────────
        aggregated = subflow_transform(df, client_map)

        # ── Subflow 3: Carga ─────────────────────────────────────────────
        load_result = subflow_load(aggregated, df, start_time)
        result.update(load_result)

        # ── Subflow 4 (opcional): Notificar ──────────────────────────────
        notify_state = subflow_notify.with_options(
            return_state=True
        )(result)
        if notify_state.is_failed():
            logger.warning(
                "Notification subflow failed (non-critical): %s",
                notify_state.result(),
            )

    except Exception as exc:
        logger.error("Pipeline failed: %s", exc, exc_info=True)
        result["status"] = "error"
        result["error"] = str(exc)
        end_time = datetime.now(timezone.utc)
        log_pipeline_run(
            start_time=start_time,
            end_time=end_time,
            records_processed=result.get("processed_events", 0),
            status="error",
            error_message=str(exc),
            details=result,
        )
        return result

    logger.info(
        "Pipeline: processed %d events, wrote %d rows across %d weeks",
        result["processed_events"],
        result["rows_written"],
        result["weeks"],
    )

    return result


# ===================================================================
# CLI entry point
# ===================================================================


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="TrackFlow Weekly Business Performance Pipeline (Prefect 3)",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default=None,
        help="ISO-8601 start date (default: 7 days ago from now UTC)",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        default=None,
        help="ISO-8601 end date (default: now UTC)",
    )
    args = parser.parse_args()

    result = run_pipeline_flow(
        start_date=args.start_date,
        end_date=args.end_date,
    )

    print(json.dumps(result, indent=2, default=str))
