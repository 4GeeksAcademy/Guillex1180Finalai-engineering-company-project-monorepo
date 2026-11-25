'use client';

import { getAccessToken } from './auth';

const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '/trackflow-api').replace(/\/$/, '');

export type IncidentAnalysis = {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  invalid_breakdown: { code: string; label: string; count: number }[];
  category_counts: Record<string, number>;
  status_counts: Record<string, number>;
  country_counts: Record<string, number>;
  satisfaction: {
    scored_closed_count: number;
    closed_count: number;
    average_score: number | null;
    score_counts: Record<string, number>;
  };
};

export class IncidentApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'IncidentApiError';
  }
}

function errorMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const body = data as { detail?: unknown; message?: unknown; error?: unknown };
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
  }
  return undefined;
}

function safeError(status: number, details?: string): string {
  if (status === 401) return 'Tu sesión ha caducado. Inicia sesión de nuevo e inténtalo otra vez.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontraron resultados. Analiza un archivo antes de descargar.';
  if (status >= 500) return 'El servicio de análisis no está disponible en este momento. Inténtalo de nuevo más tarde.';
  void details;
  return 'No se pudo completar el análisis. Revisa el archivo e inténtalo de nuevo.';
}

async function responseError(response: Response): Promise<string> {
  let body: unknown;
  try { body = await response.json(); } catch { /* Use a safe fallback for non-JSON errors. */ }
  return safeError(response.status, errorMessage(body));
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    throw new IncidentApiError(0, 'El servicio devolvió una respuesta inesperada. Actualiza la página e inténtalo de nuevo.');
  }
}

function authHeaders(): Headers {
  const token = getAccessToken();
  if (!token) throw new IncidentApiError(401, 'No hay una sesión activa. Inicia sesión para continuar.');
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export const incidentsApi = {
  async analyze(file: File): Promise<IncidentAnalysis> {
    const form = new FormData();
    form.append('file', file);
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/incidents/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
        cache: 'no-store',
      });
    } catch {
      throw new IncidentApiError(0, 'No se pudo conectar con el servicio de análisis. Comprueba tu conexión e inténtalo de nuevo.');
    }
    if (!response.ok) {
      throw new IncidentApiError(response.status, await responseError(response));
    }
    return readJson<IncidentAnalysis>(response);
  },

  async downloadResults(): Promise<Blob> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/incidents/results/export`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
    } catch {
      throw new IncidentApiError(0, 'No se pudo conectar con el servicio de análisis. Comprueba tu conexión e inténtalo de nuevo.');
    }
    if (!response.ok) {
      throw new IncidentApiError(response.status, await responseError(response));
    }
    return response.blob();
  },
};
