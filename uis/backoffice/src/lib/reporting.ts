/* Tipos y cliente API para el módulo de reporting (HITO 20).

   Consume el endpoint ``/reporting/weekly-warehouse-client-performance``
   de la API de TrackFlow para mostrar los KPIs semanales.
*/

import { getAccessToken } from './auth';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface WeeklyPerformanceEntry {
  warehouse: string;
  client_id: string;
  week_start: string;
  inbound_units_count: number;
  outbound_orders_count: number;
  stockout_events_count: number;
  discrepancy_rate: number;
  updated_at: string;
}

export interface WeeklyPerformanceResponse {
  week_start: string | null;
  entries: WeeklyPerformanceEntry[];
}

export interface PipelineRunInfo {
  id: string | null;
  pipeline_name: string;
  start_time: string | null;
  end_time: string | null;
  records_processed: number;
  status: string;
  error_message: string | null;
}

export interface PipelineLatestResponse {
  status: string;
  pipeline: PipelineRunInfo;
}

// ---------------------------------------------------------------------------
// Cliente API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

async function apiGet<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Funciones del módulo
// ---------------------------------------------------------------------------

/** Obtener KPIs semanales, opcionalmente filtrados por semana. */
export async function fetchWeeklyPerformance(
  weekStart?: string,
): Promise<WeeklyPerformanceResponse> {
  const qs = weekStart ? `?week_start=${weekStart}` : '';
  return apiGet<WeeklyPerformanceResponse>(
    `/reporting/weekly-warehouse-client-performance${qs}`,
  );
}

/** Obtener metadata de la última corrida del pipeline. */
export async function fetchLatestPipelineRun(): Promise<PipelineLatestResponse> {
  return apiGet<PipelineLatestResponse>('/reporting/pipeline-runs/latest');
}