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
      throw new IncidentApiError(0, `No se pudo conectar con la API (${API_BASE}). Comprueba que el backend esté ejecutándose.`);
    }
    if (!response.ok) {
      let message: string | undefined;
      try { message = errorMessage(await response.json()); } catch { /* use status fallback */ }
      throw new IncidentApiError(response.status, `Error ${response.status}: ${message || response.statusText}`);
    }
    return response.json() as Promise<IncidentAnalysis>;
  },

  async downloadResults(): Promise<Blob> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/incidents/results/export`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
    } catch {
      throw new IncidentApiError(0, `No se pudo conectar con la API (${API_BASE}).`);
    }
    if (!response.ok) {
      let message: string | undefined;
      try { message = errorMessage(await response.json()); } catch { /* use status fallback */ }
      throw new IncidentApiError(response.status, `Error ${response.status}: ${message || response.statusText}`);
    }
    return response.blob();
  },
};
