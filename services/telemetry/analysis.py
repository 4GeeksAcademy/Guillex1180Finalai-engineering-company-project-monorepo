"""Pipeline de análisis de telemetría para HITO 18.

Cada función recibe *start_date* / *end_date* como strings ISO-8601 en UTC
(ya resueltos por el endpoint).  Sigue el patrón:
  cargar (SQL) → refinar (Pandas) → pd.to_datetime(utc=True) → agrupar → agregar → servir.

NOTA sobre portabilidad PostgreSQL/SQLite:
  Los parámetros :start_date y :end_date se vinculan directamente sin CAST,
  SQLAlchemy y el driver DB gestionan la comparación con la columna
  ``timestamp`` de forma transparente en ambos dialectos.
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
from sqlalchemy import text as sa_text

from services.api.database import engine

logger = logging.getLogger("uvicorn.error")

# ---------------------------------------------------------------------------
# Constantes de tipos de evento
# ---------------------------------------------------------------------------
_EVENT_API_LATENCY = "api_latency_recorded"
_EVENT_API_ERROR = "api_error_recorded"
_EVENT_AUTH_FAILED = "auth_login_failed"
_EVENT_AUTH_SUCCEEDED = "auth_login_succeeded"

# ═══════════════════════════════════════════════════════════════════════════
# Métrica 1 — Volumen por tipo de evento y día
# ═══════════════════════════════════════════════════════════════════════════


def volume_by_type_and_day(
    start_date: str,
    end_date: str,
) -> list[dict[str, Any]]:
    """Agrupa eventos por ``(event_type, fecha)`` y cuenta ocurrencias.

    1) Cargar filas desde telemetry_events filtradas por rango temporal.
    2) Refinar: sin limpieza adicional para esta métrica.
    3) Convertir timestamp con pd.to_datetime(utc=True).
    4) Agrupar por event_type y fecha (extraída del timestamp ya en UTC).
    """
    sql = sa_text("""
        SELECT event_type, timestamp
        FROM telemetry_events te
        WHERE te.timestamp >= :start_date
          AND te.timestamp < :end_date
        ORDER BY te.timestamp
    """).bindparams(start_date=start_date, end_date=end_date)

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    # Convertir timestamp a UTC
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df["date"] = df["timestamp"].dt.strftime("%Y-%m-%d")

    # Agrupar por event_type y fecha
    grouped = (
        df.groupby(["event_type", "date"])
        .size()
        .reset_index(name="count")
        .sort_values(["date", "count"], ascending=[False, False])
    )

    return grouped.to_dict(orient="records")


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 2 — Tasa de error diaria (%)
# ═══════════════════════════════════════════════════════════════════════════


def error_rate_by_day(
    start_date: str,
    end_date: str,
) -> list[dict[str, Any]]:
    """Calcula el porcentaje de eventos con nivel ``error`` sobre el total por día.

    1) Cargar filas desde telemetry_events filtradas por rango temporal.
    2) Refinar: sin limpieza adicional; level ya es columna en DB.
    3) Convertir timestamp con pd.to_datetime(utc=True).
    4) Agrupar por día y agregar con .agg() -> count total + sum de errors.
    """
    sql = sa_text("""
        SELECT level, timestamp
        FROM telemetry_events te
        WHERE te.timestamp >= :start_date
          AND te.timestamp < :end_date
        ORDER BY te.timestamp
    """).bindparams(start_date=start_date, end_date=end_date)

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    # Convertir timestamp a UTC
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df["date"] = df["timestamp"].dt.strftime("%Y-%m-%d")
    df["is_error"] = (df["level"] == "error").astype(int)

    # Agrupar por día
    grouped = (
        df.groupby("date")
        .agg(total_events=("is_error", "count"), errors=("is_error", "sum"))
        .reset_index()
        .sort_values("date", ascending=False)
    )

    grouped["error_rate_pct"] = (
        (grouped["errors"] / grouped["total_events"] * 100).round(2)
    )
    grouped["errors"] = grouped["errors"].astype(int)
    grouped["total_events"] = grouped["total_events"].astype(int)

    return grouped.to_dict(orient="records")


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 3 — Latencia de API (media, P50, P95, P99) por día
# ═══════════════════════════════════════════════════════════════════════════


def api_latency_stats(
    start_date: str,
    end_date: str,
) -> list[dict[str, Any]]:
    """Estadísticas de latencia (ms) para peticiones API por día.

    1) Cargar filas con event_type = api_latency_recorded y value no nulo.
    2) Refinar: forzar value a numérico, descartar nulos.
    3) Convertir timestamp con pd.to_datetime(utc=True).
    4) Agrupar por día y agregar con .agg() — sin bucles.
    """
    sql = sa_text("""
        SELECT timestamp, value
        FROM telemetry_events te
        WHERE te.timestamp >= :start_date
          AND te.timestamp < :end_date
          AND te.event_type = :event_type
          AND te.value IS NOT NULL
        ORDER BY te.timestamp
    """).bindparams(
        start_date=start_date, end_date=end_date,
        event_type=_EVENT_API_LATENCY,
    )

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    # Refinar: convertir value a numérico, descartar nulos
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df = df.dropna(subset=["value"])

    if df.empty:
        return []

    # Convertir timestamp a UTC
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df["date"] = df["timestamp"].dt.strftime("%Y-%m-%d")

    # Agrupar por día y agregar métricas
    grouped = (
        df.groupby("date")["value"]
        .agg(["mean", "median", lambda x: x.quantile(0.95), lambda x: x.quantile(0.99), "count"])
        .reset_index()
    )
    grouped.columns = ["date", "avg_ms",
                       "p50_ms", "p95_ms", "p99_ms", "samples"]
    grouped["avg_ms"] = grouped["avg_ms"].round(1)
    grouped["p50_ms"] = grouped["p50_ms"].round(1)
    grouped["p95_ms"] = grouped["p95_ms"].round(1)
    grouped["p99_ms"] = grouped["p99_ms"].round(1)
    grouped["samples"] = grouped["samples"].astype(int)

    return grouped.to_dict(orient="records")


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 4 — Tasa de fallo de autenticación por día
# ═══════════════════════════════════════════════════════════════════════════


def auth_failure_rate(
    start_date: str,
    end_date: str,
) -> list[dict[str, Any]]:
    """Proporción de intentos fallidos de login sobre el total por día.

    1) Cargar filas con event_type IN (auth_login_failed, auth_login_succeeded).
    2) Refinar: sin limpieza adicional.
    3) Convertir timestamp con pd.to_datetime(utc=True).
    4) Agrupar con pivot_table: failed / succeeded por día.
    """
    sql = sa_text("""
        SELECT event_type, timestamp
        FROM telemetry_events te
        WHERE te.timestamp >= :start_date
          AND te.timestamp < :end_date
          AND te.event_type IN (:ev_fail, :ev_ok)
        ORDER BY te.timestamp
    """).bindparams(
        start_date=start_date, end_date=end_date,
        ev_fail=_EVENT_AUTH_FAILED,
        ev_ok=_EVENT_AUTH_SUCCEEDED,
    )

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    # Convertir timestamp a UTC
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df["date"] = df["timestamp"].dt.strftime("%Y-%m-%d")

    # Pivot: una fila por día con columnas failed / succeeded
    pivot = (
        df.pivot_table(
            index="date",
            columns="event_type",
            values="timestamp",
            aggfunc="count",
            fill_value=0,
        )
        .reset_index()
    )

    col_fail = _EVENT_AUTH_FAILED
    col_ok = _EVENT_AUTH_SUCCEEDED

    pivot["attempts"] = pivot.get(col_fail, 0) + pivot.get(col_ok, 0)
    pivot["failures"] = pivot.get(col_fail, 0)
    pivot["failure_rate_pct"] = (
        (pivot["failures"] / pivot["attempts"] * 100)
        .round(1)
        .fillna(0.0)
    )

    pivot["attempts"] = pivot["attempts"].astype(int)
    pivot["failures"] = pivot["failures"].astype(int)

    return pivot[["date", "attempts", "failures", "failure_rate_pct"]].to_dict(
        orient="records"
    )
