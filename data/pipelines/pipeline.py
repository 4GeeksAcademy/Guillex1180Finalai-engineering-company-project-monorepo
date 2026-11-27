#!/usr/bin/env python
"""TrackFlow — Pipeline ETL semanal (entrypoint HITO 20, Parte 3).

Este archivo es el entrypoint oficial del pipeline de desempeño de negocio.
Refactorizado en subflows (HITO 20), conserva el CLI de la Parte 2.

Los 3 subflows (`@flow`) viven en ``services/reporting/pipeline_v2.py``:
  1. subflow_extract    — Extraer client_map + eventos de telemetría
  2. subflow_transform  — Parsear, resolver clientes, agregar KPIs
  3. subflow_load       — UPSERT resultados + log de corrida

Runtimes
--------
    # Local (uv)
    uv run python data/pipelines/pipeline.py
    uv run python data/pipelines/pipeline.py --start-date 2026-07-13 --end-date 2026-07-20

    # Directo (pip)
    python data/pipelines/pipeline.py
    python data/pipelines/pipeline.py --start-date 2026-07-13 --end-date 2026-07-20
"""

from __future__ import annotations

import argparse
import json
import sys

from services.reporting.pipeline_v2 import run_pipeline_flow

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
    sys.exit(0 if result.get("status") == "success" else 1)
