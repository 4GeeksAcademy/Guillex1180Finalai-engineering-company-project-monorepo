'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedPage from '@/components/ProtectedPage';
import Feedback from '@/components/Feedback';
import {
  fetchWeeklyPerformance,
  fetchLatestPipelineRun,
  type WeeklyPerformanceEntry,
  type PipelineRunInfo,
} from '@/lib/reporting';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Nombres de KPI según el BRIEFING de TrackFlow (sección 2). */
const KPI_LABELS: Record<string, { label: string; description: string; unit: string }> = {
  inbound_units_count: {
    label: 'Volumen de entrada',
    description: 'Unidades de mercancía recibidas en el almacén durante la semana.',
    unit: 'unidades',
  },
  outbound_orders_count: {
    label: 'Throughput de salida',
    description: 'Pedidos preparados y despachados por el almacén durante la semana.',
    unit: 'pedidos',
  },
  stockout_events_count: {
    label: 'Frecuencia de quiebre de stock',
    description: 'Veces que un SKU cayó por debajo del mínimo configurado.',
    unit: 'eventos',
  },
  discrepancy_rate: {
    label: 'Tasa de discrepancia',
    description: 'Proporción de pedidos con discrepancia de inventario detectada.',
    unit: '%',
  },
};

/** Traducción de nombres de almacén. */
const WAREHOUSE_LABELS: Record<string, string> = {
  los_angeles: 'Los Ángeles',
  zaragoza: 'Zaragoza',
  unknown: 'Desconocido',
};

// ---------------------------------------------------------------------------
// Componentes auxiliares
// ---------------------------------------------------------------------------

/** Tarjeta individual de KPI con valor grande. */
function KpiCard({
  kpiKey,
  value,
  warehouse,
  client,
}: {
  kpiKey: string;
  value: number | string;
  warehouse: string;
  client: string;
}) {
  const info = KPI_LABELS[kpiKey];
  if (!info) return null;

  const formattedValue =
    kpiKey === 'discrepancy_rate'
      ? `${Number(value).toFixed(2)}%`
      : Number(value).toLocaleString('es-ES');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
        {info.label}
      </div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{formattedValue}</div>
      <div className="mt-1 text-xs text-slate-500">{info.description}</div>
      <div className="mt-2 flex gap-2 text-xs text-slate-400">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">
          {WAREHOUSE_LABELS[warehouse] ?? warehouse}
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{client}</span>
      </div>
    </div>
  );
}

/** Tabla de KPIs por almacén/cliente. */
function KpiTable({ entries }: { entries: WeeklyPerformanceEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
        No hay datos de KPIs para esta semana.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Almacén</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Volumen de entrada</th>
              <th className="px-4 py-3 text-right">Throughput de salida</th>
              <th className="px-4 py-3 text-right">Quiebres de stock</th>
              <th className="px-4 py-3 text-right">Tasa de discrepancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry, i) => (
              <tr key={`${entry.warehouse}-${entry.client_id}-${i}`} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  {WAREHOUSE_LABELS[entry.warehouse] ?? entry.warehouse}
                </td>
                <td className="px-4 py-3">{entry.client_id}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.inbound_units_count.toLocaleString('es-ES')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.outbound_orders_count.toLocaleString('es-ES')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.stockout_events_count.toLocaleString('es-ES')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.discrepancy_rate.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Estado del pipeline (última corrida). */
function PipelineStatus({ info }: { info: PipelineRunInfo | null }) {
  if (!info || !info.start_time) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        El pipeline aún no se ha ejecutado.
      </div>
    );
  }

  const statusBadge =
    info.status === 'success'
      ? 'bg-emerald-100 text-emerald-800'
      : info.status === 'error'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-900';

  const startDate = new Date(info.start_time).toLocaleString('es-ES');
  const endDate = info.end_time
    ? new Date(info.end_time).toLocaleString('es-ES')
    : '—';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">Estado del pipeline</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}>
          {info.status === 'success' ? 'Correcto' : info.status === 'error' ? 'Error' : 'En ejecución'}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600">
        <div>
          <span className="text-xs text-slate-400">Inicio</span>
          <p>{startDate}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Fin</span>
          <p>{endDate}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Registros procesados</span>
          <p className="tabular-nums">{info.records_processed.toLocaleString('es-ES')}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Pipeline</span>
          <p className="font-mono text-xs">{info.pipeline_name}</p>
        </div>
      </div>
      {info.error_message && (
        <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
          {info.error_message}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function ReportingPage() {
  const [entries, setEntries] = useState<WeeklyPerformanceEntry[]>([]);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [pipelineInfo, setPipelineInfo] = useState<PipelineRunInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (week?: string) => {
    setLoading(true);
    setError('');
    try {
      const [perf, latest] = await Promise.all([
        fetchWeeklyPerformance(week),
        fetchLatestPipelineRun(),
      ]);
      setEntries(perf.entries);
      setWeekStart(perf.week_start);
      setPipelineInfo(latest.pipeline);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error al cargar datos de reporting.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <ProtectedPage>
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            TrackFlow · Reporte Semanal
          </p>
          <h1 className="mt-1 text-3xl font-bold">Desempeño por Almacén y Cliente</h1>
          <p className="mt-2 text-slate-600">
            {weekStart
              ? `Semana del ${new Date(weekStart + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
              : 'Cargando período…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            href="/backoffice/inventory/products"
          >
            ← Volver a inventario
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 space-y-2">
          <Feedback kind="error">{error}</Feedback>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Reintentar'}
          </button>
        </div>
      )}

      {/* Estado del pipeline */}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Estado del pipeline de datos</h2>
        {loading && !pipelineInfo ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : (
          <PipelineStatus info={pipelineInfo} />
        )}
      </div>

      {/* KPIs — vista de tarjetas */}
      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Indicadores clave (KPIs)</h2>
        <p className="mb-4 text-sm text-slate-500">
          Datos calculados por el pipeline semanal de desempeño. Fuente: {''}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            reporting.weekly_warehouse_client_performance
          </code>
        </p>

        {loading ? (
          <p className="text-slate-500">Cargando KPIs…</p>
        ) : entries.length === 0 && !error ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            No hay datos de KPIs disponibles. Ejecuta el pipeline primero.
          </p>
        ) : (
          <>
            {/* Tarjetas resumen — totales por KPI */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                kpiKey="inbound_units_count"
                value={entries.reduce((s, e) => s + e.inbound_units_count, 0)}
                warehouse="—"
                client="Total"
              />
              <KpiCard
                kpiKey="outbound_orders_count"
                value={entries.reduce((s, e) => s + e.outbound_orders_count, 0)}
                warehouse="—"
                client="Total"
              />
              <KpiCard
                kpiKey="stockout_events_count"
                value={entries.reduce((s, e) => s + e.stockout_events_count, 0)}
                warehouse="—"
                client="Total"
              />
              <KpiCard
                kpiKey="discrepancy_rate"
                value={
                  entries.length > 0
                    ? (entries.reduce((s, e) => s + e.discrepancy_rate, 0) / entries.length).toFixed(2)
                    : '0.00'
                }
                warehouse="—"
                client="Promedio"
              />
            </div>

            {/* Tabla detallada por almacén/cliente */}
            <h3 className="mb-2 text-md font-semibold text-slate-800">
              Desglose por almacén y cliente
            </h3>
            <KpiTable entries={entries} />
          </>
        )}
      </div>

      {/* Nota al pie */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold">TrackFlow · Reporte Semanal de Desempeño por Almacén y Cliente</p>
        <p className="mt-1">
          Destinado a Thomas (CEO) y Ana (Head of Warehouse Operations). Los datos se actualizan
          cada lunes por la mañana tras la ejecución del pipeline ETL.
        </p>
      </div>
    </ProtectedPage>
  );
}