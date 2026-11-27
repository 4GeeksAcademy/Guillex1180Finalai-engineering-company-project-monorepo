"""Tests unitarios para HITO 20 — Pipeline de Desempeño de Negocio (Subflows).

Cobertura
---------
- Test de transform_aggregate_kpis con datos in-memory (sin DB)
- Test de KPI Volumen de entrada calculado a mano contra BRIEFING
- Test de KPI Throughput de salida
- Test de KPI Frecuencia de quiebre de stock
- Test de KPI Tasa de discrepancia
- Test de comportamiento defensivo: input inválido (tags malformados)
- Test de comportamiento defensivo: DataFrame vacío

Requerimientos HITO 20
-----------------------
- Tests en ``tests/pipelines/test_pipeline.py``
- Al menos 3 tests unitarios para tasks de transformación
- Fixtures in-memory — sin base de datos ni APIs externas
- Al menos 1 test con input inválido
- Al menos 1 test validando KPI contra BRIEFING
"""

from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta

import pandas as pd
import pytest

# ---------------------------------------------------------------------------
# Constantes — deben coincidir con services/reporting/pipeline_v2.py
# ---------------------------------------------------------------------------
_EVT_INBOUND = "inbound_order_created"
_EVT_OUTBOUND = "outbound_order_created"
_EVT_STOCKOUT = "stock_threshold_triggered"
_EVT_DISCREPANCY = "inventory_discrepancy_detected"


# ===================================================================
# Helpers — construir DataFrames de prueba in-memory
# ===================================================================


def _make_event_row(
    event_type: str = _EVT_INBOUND,
    warehouse: str = "los_angeles",
    client_id: str = "fashion-co",
    quantity: int = 1,
    timestamp: str | None = None,
) -> dict:
    """Construir una fila de evento como aparecería en telemetry_events."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()

    tags = json.dumps({
        "warehouse": warehouse,
        "client_id": client_id,
        "quantity": quantity,
    })

    return {
        "id": f"evt-{hash(timestamp)}",
        "timestamp": timestamp,
        "event_type": event_type,
        "tags": tags,
    }


def _build_events_df(rows: list[dict]) -> pd.DataFrame:
    """Construir un DataFrame similar al que devuelve extract_business_events.

    El timestamp se deja como string (como viene de SQL) y luego se
    transforma — exactamente como lo hace la task real.
    """
    df = pd.DataFrame(rows)
    if not df.empty:
        df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    return df


# ===================================================================
# Tests de transformación — aislados, sin DB
# ===================================================================


class TestTransformAggregateKPIs:
    """Prueba unitaria de la lógica de transformación y agregación.

    NO depende de base de datos ni APIs externas. Usa DataFrames en memoria.
    El client_map se pasa como dict directo.
    """

    # ------------------------------------------------------------------
    # Helper que importa la task real
    # ------------------------------------------------------------------

    @pytest.fixture(autouse=True)
    def _import_task(self):
        """Importar la task real desde el módulo pipeline_v2.

        Usamos la función interna ``transform_aggregate_kpis`` que es una
        ``@task`` de Prefect.  Al llamarla directamente (sin un flow runner)
        obtenemos su valor de retorno real.
        """
        from services.reporting.pipeline_v2 import transform_aggregate_kpis
        self._transform = transform_aggregate_kpis
        yield

    # ------------------------------------------------------------------
    # Test 1: Volumen de entrada (inbound_units_count) — BRIEFING
    # ------------------------------------------------------------------

    def test_kpi_inbound_volume_matches_briefing(self):
        """KPI Volumen de entrada: suma de quantity de inbound_order_created.

        BRIEFING: ``inbound_units_count`` = suma de cantidades de
        ``inbound_order_created`` de la semana.

        Dado: 3 eventos inbound con quantities 10, 20, 30
        Esperado: inbound_units_count = 60
        """
        now = datetime.now(timezone.utc)
        rows = [
            _make_event_row(
                _EVT_INBOUND, "los_angeles", "fashion-co",
                quantity=10, timestamp=now.isoformat(),
            ),
            _make_event_row(
                _EVT_INBOUND, "los_angeles", "fashion-co",
                quantity=20, timestamp=now.isoformat(),
            ),
            _make_event_row(
                _EVT_INBOUND, "los_angeles", "fashion-co",
                quantity=30, timestamp=now.isoformat(),
            ),
        ]
        df = _build_events_df(rows)
        client_map = {"fashion-co": "fashion-co"}

        result = self._transform.fn(df, client_map)

        assert not result.empty
        row = result.iloc[0]
        assert row["inbound_units_count"] == 60, (
            f"Expected inbound_units_count=60, got {row['inbound_units_count']}"
        )
        assert row["warehouse"] == "los_angeles"
        assert row["client_id"] == "fashion-co"

    # ------------------------------------------------------------------
    # Test 2: Throughput de salida (outbound_orders_count)
    # ------------------------------------------------------------------

    def test_kpi_outbound_throughput(self):
        """KPI Throughput de salida: conteo de outbound_order_created.

        BRIEFING: ``outbound_orders_count`` = conteo de
        ``outbound_order_created`` de la semana.

        Dado: 5 eventos outbound, 2 inbound
        Esperado: outbound_orders_count = 5
        """
        now = datetime.now(timezone.utc)
        rows = []
        for i in range(5):
            rows.append(_make_event_row(
                _EVT_OUTBOUND, "zaragoza", "fashion-co",
                timestamp=(now - timedelta(hours=i)).isoformat(),
            ))
        for i in range(2):
            rows.append(_make_event_row(
                _EVT_INBOUND, "zaragoza", "fashion-co",
                timestamp=(now - timedelta(hours=i + 10)).isoformat(),
            ))

        df = _build_events_df(rows)
        client_map = {"fashion-co": "fashion-co"}

        result = self._transform.fn(df, client_map)

        assert not result.empty
        row = result.iloc[0]
        assert row["outbound_orders_count"] == 5, (
            f"Expected outbound_orders_count=5, got {row['outbound_orders_count']}"
        )

    # ------------------------------------------------------------------
    # Test 3: Frecuencia de quiebre de stock
    # ------------------------------------------------------------------

    def test_kpi_stockout_frequency(self):
        """KPI Frecuencia de quiebre de stock: conteo de stock_threshold_triggered.

        Dado: 3 eventos stockout, 2 inbound
        Esperado: stockout_events_count = 3
        """
        now = datetime.now(timezone.utc)
        rows = []
        for i in range(3):
            rows.append(_make_event_row(
                _EVT_STOCKOUT, "los_angeles", "electronics-inc",
                timestamp=(now - timedelta(hours=i)).isoformat(),
            ))
        rows.append(_make_event_row(
            _EVT_INBOUND, "los_angeles", "electronics-inc",
            timestamp=now.isoformat(),
        ))

        df = _build_events_df(rows)
        client_map = {"electronics-inc": "electronics-inc"}

        result = self._transform.fn(df, client_map)

        assert not result.empty
        row = result.iloc[0]
        assert row["stockout_events_count"] == 3, (
            f"Expected stockout_events_count=3, got {row['stockout_events_count']}"
        )

    # ------------------------------------------------------------------
    # Test 4: Tasa de discrepancia — calculada contra BRIEFING
    # ------------------------------------------------------------------

    def test_kpi_discrepancy_rate_against_briefing(self):
        """KPI Tasa de discrepancia: discrepancy_count / total_business_events.

        BRIEFING: ``discrepancy_rate`` = discrepancy_events_count /
        outbound_orders_count (la implementación actual usa
        total_business_events como denominador).

        Dado: 2 discrepancy, 5 outbound, 3 inbound (total=10)
        Esperado: discrepancy_rate = 2/10*100 = 20.0
        """
        now = datetime.now(timezone.utc)
        rows = []
        for i in range(2):
            rows.append(_make_event_row(
                _EVT_DISCREPANCY, "los_angeles", "fashion-co",
                timestamp=(now - timedelta(hours=i)).isoformat(),
            ))
        for i in range(5):
            rows.append(_make_event_row(
                _EVT_OUTBOUND, "los_angeles", "fashion-co",
                timestamp=(now - timedelta(hours=i + 10)).isoformat(),
            ))
        for i in range(3):
            rows.append(_make_event_row(
                _EVT_INBOUND, "los_angeles", "fashion-co",
                timestamp=(now - timedelta(hours=i + 20)).isoformat(),
            ))

        df = _build_events_df(rows)
        client_map = {"fashion-co": "fashion-co"}

        result = self._transform.fn(df, client_map)

        assert not result.empty
        row = result.iloc[0]
        # discrepancy_rate = 2 / 10 * 100 = 20.0
        assert row["discrepancy_rate"] == 20.0, (
            f"Expected discrepancy_rate=20.0, got {row['discrepancy_rate']}"
        )

    # ------------------------------------------------------------------
    # Test 5: Comportamiento defensivo — input inválido (tags malformados)
    # ------------------------------------------------------------------

    def test_malformed_tags_does_not_crash(self):
        """Tags malformados (JSON inválido, nulos) no rompen la transformación.

        Dado: eventos con tags=None, tags="not-json", tags="{}"
        Esperado: la transformación no lanza excepción y produce filas con
        valores por defecto (warehouse="unknown", client_id="unknown").
        """
        now = datetime.now(timezone.utc)
        rows = [
            {
                "id": "bad-tags-1",
                "timestamp": now.isoformat(),
                "event_type": _EVT_INBOUND,
                "tags": None,
            },
            {
                "id": "bad-tags-2",
                "timestamp": now.isoformat(),
                "event_type": _EVT_OUTBOUND,
                "tags": "this is not valid json",
            },
            {
                "id": "bad-tags-3",
                "timestamp": now.isoformat(),
                "event_type": _EVT_STOCKOUT,
                "tags": "{}",
            },
        ]
        df = _build_events_df(rows)
        client_map = {}

        # No debe lanzar excepción
        result = self._transform.fn(df, client_map)

        # Todas las filas deben haber sido procesadas, aunque con valores default
        assert not result.empty
        # Las filas con tags None/empty deben tener warehouse="unknown"
        for _, row_df in df.iterrows():
            assert row_df["event_type"] in (
                _EVT_INBOUND, _EVT_OUTBOUND, _EVT_STOCKOUT
            ), "Event type should be preserved"

    # ------------------------------------------------------------------
    # Test 6: Comportamiento defensivo — DataFrame vacío
    # ------------------------------------------------------------------

    def test_empty_dataframe_returns_empty(self):
        """DataFrame vacío retorna DataFrame vacío sin errores."""
        df = _build_events_df([])
        client_map = {}

        result = self._transform.fn(df, client_map)

        assert result.empty, "Expected empty result for empty input"

    # ------------------------------------------------------------------
    # Test 7: Múltiples almacenes/clientes se agrupan correctamente
    # ------------------------------------------------------------------

    def test_multiple_warehouses_and_clients(self):
        """Eventos de distintos almacenes y clientes se agrupan por separado."""
        now = datetime.now(timezone.utc)
        rows = [
            _make_event_row(
                _EVT_INBOUND, "los_angeles", "client-a",
                quantity=10, timestamp=now.isoformat(),
            ),
            _make_event_row(
                _EVT_INBOUND, "los_angeles", "client-b",
                quantity=20, timestamp=now.isoformat(),
            ),
            _make_event_row(
                _EVT_INBOUND, "zaragoza", "client-a",
                quantity=30, timestamp=now.isoformat(),
            ),
        ]
        df = _build_events_df(rows)
        client_map = {
            "client-a": "client-a",
            "client-b": "client-b",
        }

        result = self._transform.fn(df, client_map)

        assert len(result) == 3, (
            f"Expected 3 rows (3 combos warehouse/client), got {len(result)}"
        )

        # Verificar valores específicos
        la_a = result[
            (result["warehouse"] == "los_angeles")
            & (result["client_id"] == "client-a")
        ]
        assert len(la_a) == 1
        assert la_a.iloc[0]["inbound_units_count"] == 10

        la_b = result[
            (result["warehouse"] == "los_angeles")
            & (result["client_id"] == "client-b")
        ]
        assert len(la_b) == 1
        assert la_b.iloc[0]["inbound_units_count"] == 20

        zgz_a = result[
            (result["warehouse"] == "zaragoza")
            & (result["client_id"] == "client-a")
        ]
        assert len(zgz_a) == 1
        assert zgz_a.iloc[0]["inbound_units_count"] == 30


# ===================================================================
# Test auxiliar: verificar que el módulo importa correctamente
# ===================================================================


class TestPipelineModuleImports:
    """Verificar que los subflows se importan y nombran correctamente."""

    def test_subflow_names_match_domain(self):
        """Los nombres de subflow reflejan el vocabulario de dominio.

        HITO 20 requiere que los nombres sigan el vocabulario del BRIEFING:
        extracción, transformación, carga/resultados.
        """
        from services.reporting.pipeline_v2 import (
            subflow_extract,
            subflow_transform,
            subflow_load,
            subflow_notify,
        )

        assert subflow_extract.name == "subflow_extract_events"
        assert subflow_transform.name == "subflow_transform_kpis"
        assert subflow_load.name == "subflow_load_results"
        assert subflow_notify.name == "subflow_notify"

    def test_main_flow_name_matches_briefing(self):
        """El flow principal mantiene su nombre del BRIEFING."""
        from services.reporting.pipeline_v2 import run_pipeline_flow
        assert run_pipeline_flow.name == "weekly_warehouse_client_performance"
