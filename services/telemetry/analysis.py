"""Pipeline de análisis de telemetría para HITO 18.

Sigue el patrón: cargar (SQL) → refinar (Pandas) → convertir tipos → agrupar → agregar → servir.
Cada función recibe *start_date* / *end_date* opcionales (strings ISO-8601),
filtra en SQL, refina con Pandas y retorna ``list[dict]``.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
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

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_date_filter(
    start_date: date | None,
    end_date: date | None,
    alias: str = "te",
) -> tuple[str, dict[str, Any]]:
    """Build a SQL WHERE fragment + param dict for the date range.

    Returns ``(fragment, params_dict)``.
    The fragment starts with `` AND `` so it can be used in ``WHERE 1=1 {fragment}``.
    """
    params: dict[str, Any] = {}
    parts: list[str] = []

    if start_date is not None:
        parts.append(f"{alias}.timestamp >= :start_date")
        params["start_date"] = datetime.combine(
            start_date, datetime.min.time(), tzinfo=timezone.utc
        )
    if end_date is not None:
        parts.append(f"{alias}.timestamp < :end_date_plus")
        end_plus = datetime.combine(
            end_date, datetime.min.time(), tzinfo=timezone.utc
        ) + timedelta(days=1)
        params["end_date_plus"] = end_plus

    if not parts:
        return "", {}
    return " AND " + " AND ".join(parts), params


def _parse_dates(
    start_date: str | None,
    end_date: str | None,
    default_days: int = 7,
) -> tuple[date | None, date | None]:
    """Parse optional ISO-8601 strings into ``date`` objects.

    If neither is provided, defaults to the last *default_days* days.
    """
    now = datetime.now(timezone.utc)

    if start_date is None and end_date is None:
        end = now.date()
        start = end - timedelta(days=default_days)
        return start, end

    parsed_start: date | None = None
    parsed_end: date | None = None

    if start_date is not None:
        parsed_start = date.fromisoformat(start_date)
    if end_date is not None:
        parsed_end = date.fromisoformat(end_date)

    return parsed_start, parsed_end


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 1 — Volumen por tipo de evento y día
# ═══════════════════════════════════════════════════════════════════════════


def volume_by_type_and_day(
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Agrupa eventos por ``(event_type, fecha)`` y cuenta ocurrencias.

    Retorna::

        [
          {"event_type": "api_latency_recorded", "date": "2025-01-15", "count": 12},
          ...
        ]
    """
    start, end = _parse_dates(start_date, end_date)
    clause, params = _build_date_filter(start, end)

    sql = sa_text(f"""
        SELECT event_type, DATE(timestamp) AS day, COUNT(*) AS cnt
        FROM telemetry_events te
        WHERE 1=1 {clause}
        GROUP BY event_type, day
        ORDER BY day DESC, cnt DESC
    """).bindparams(**params)

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    df = df.rename(columns={"cnt": "count"})
    df["date"] = df["day"].astype(str)
    return df[["event_type", "date", "count"]].to_dict(orient="records")


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 2 — Tasa de error diaria (%)
# ═══════════════════════════════════════════════════════════════════════════


def error_rate_by_day(
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Calcula el porcentaje de eventos con nivel ``error`` sobre el total por día.

    Retorna::

        [
          {"date": "2025-01-15", "total_events": 48, "errors": 7, "error_rate_pct": 14.58},
          ...
        ]
    """
    start, end = _parse_dates(start_date, end_date)
    clause, params = _build_date_filter(start, end)

    sql = sa_text(f"""
        SELECT
            DATE(timestamp) AS day,
            COUNT(*)             AS total_events,
            SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) AS errors
        FROM telemetry_events te
        WHERE 1=1 {clause}
        GROUP BY day
        ORDER BY day DESC
    """).bindparams(**params)

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    df["error_rate_pct"] = (df["errors"] / df["total_events"] * 100).round(2)
    df["date"] = df["day"].astype(str)
    return df[["date", "total_events", "errors", "error_rate_pct"]].to_dict(
        orient="records"
    )


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 3 — Latencia de API (media, P50, P95, P99) por día
# ═══════════════════════════════════════════════════════════════════════════


def api_latency_stats(
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Estadísticas de latencia (ms) para peticiones API por día.

    Filtra solo eventos ``api_latency_recorded`` con ``value`` no nulo.
    Agrupa por día y calcula promedio, mediana (P50), P95 y P99.

    Retorna::

        [
          {"date": "2025-01-15", "avg_ms": 61.9, "p50_ms": 55.9,
           "p95_ms": 152.7, "p99_ms": 152.7, "samples": 5},
          ...
        ]
    """
    start, end = _parse_dates(start_date, end_date)
    clause, params = _build_date_filter(start, end)

    sql = sa_text(f"""
        SELECT DATE(timestamp) AS day, value
        FROM telemetry_events te
        WHERE 1=1 {clause}
          AND event_type = :event_type
          AND value IS NOT NULL
        ORDER BY day
    """).bindparams(event_type=_EVENT_API_LATENCY, **params)

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df = df.dropna(subset=["value"])

    if df.empty:
        return []

    # Agrupar por día y calcular percentiles en una sola pasada
    grouped = (
        df.groupby("day")["value"]
        .agg(["mean", "median", lambda x: x.quantile(0.95), lambda x: x.quantile(0.99), "count"])
        .reset_index()
    )
    grouped.columns = ["day", "avg_ms",
                       "p50_ms", "p95_ms", "p99_ms", "samples"]

    grouped["avg_ms"] = grouped["avg_ms"].round(1)
    grouped["p50_ms"] = grouped["p50_ms"].round(1)
    grouped["p95_ms"] = grouped["p95_ms"].round(1)
    grouped["p99_ms"] = grouped["p99_ms"].round(1)
    grouped["samples"] = grouped["samples"].astype(int)
    grouped["date"] = grouped["day"].astype(str)

    return grouped[["date", "avg_ms", "p50_ms", "p95_ms", "p99_ms", "samples"]].to_dict(
        orient="records"
    )


# ═══════════════════════════════════════════════════════════════════════════
# Métrica 4 (bonus) — Tasa de fallo de autenticación por día
# ═══════════════════════════════════════════════════════════════════════════


def auth_failure_rate(
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Proporción de intentos fallidos de login sobre el total por día.

    Retorna::

        [
          {"date": "2025-01-15", "attempts": 4, "failures": 2, "failure_rate_pct": 50.0},
          ...
        ]
    """
    start, end = _parse_dates(start_date, end_date)
    clause, params = _build_date_filter(start, end)

    sql = sa_text(f"""
        SELECT
            DATE(timestamp) AS day,
            event_type,
            COUNT(*) AS cnt
        FROM telemetry_events te
        WHERE 1=1 {clause}
          AND event_type IN (:ev_fail, :ev_ok)
        GROUP BY day, event_type
        ORDER BY day DESC
    """).bindparams(ev_fail=_EVENT_AUTH_FAILED, ev_ok=_EVENT_AUTH_SUCCEEDED, **params)

    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        return []

    # Pivot: una fila por día con columnas failed / succeeded
    pivot = df.pivot_table(
        index="day",
        columns="event_type",
        values="cnt",
        aggfunc="sum",
        fill_value=0,
    ).reset_index()

    col_fail = _EVENT_AUTH_FAILED
    col_ok = _EVENT_AUTH_SUCCEEDED

    pivot["attempts"] = pivot.get(col_fail, 0) + pivot.get(col_ok, 0)
    pivot["failures"] = pivot.get(col_fail, 0)
    pivot["failure_rate_pct"] = (
        (pivot["failures"] / pivot["attempts"] * 100)
        .round(1)
        .fillna(0.0)
    )
    pivot["date"] = pivot["day"].astype(str)

    return pivot[["date", "attempts", "failures", "failure_rate_pct"]].to_dict(
        orient="records"
    )
