import type {
  Candidate,
  CandidateDetail,
  CandidateListResponse,
  CandidateStatus,
  CandidateStage,
  Note,
  NotesListResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://playground.4geeks.com/tracker/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servicio de candidaturas. Comprueba tu conexión e inténtalo de nuevo.');
  }

  if (!res.ok) {
    let detail: unknown;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === 'object' && 'detail' in body) detail = (body as { detail: unknown }).detail;
    } catch {
      // Ignore unstructured response bodies; they may contain internal details.
    }
    const message = res.status === 401
      ? 'Tu sesión ha caducado. Actualiza la página e inténtalo de nuevo.'
      : res.status === 403
        ? 'No tienes permiso para realizar esta acción.'
        : res.status === 404
          ? 'No se encontró el registro solicitado. Actualiza la página e inténtalo de nuevo.'
          : res.status >= 500
            ? 'El servicio de candidaturas no está disponible ahora. Inténtalo más tarde.'
              : 'No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.';
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  try {
    return await res.json() as T;
  } catch {
    throw new ApiError(0, 'El servicio devolvió una respuesta inesperada. Actualiza la página e inténtalo de nuevo.');
  }
}

export async function fetchCandidates(params?: {
  status?: CandidateStatus;
  stage?: CandidateStage;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CandidateListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.stage) searchParams.set('stage', params.stage);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);

  const qs = searchParams.toString();
  return request<CandidateListResponse>(`${API_BASE}/records${qs ? `?${qs}` : ''}`);
}

export async function fetchCandidate(id: string): Promise<CandidateDetail> {
  return request<CandidateDetail>(`${API_BASE}/records/${id}`);
}

export async function updateCandidate(
  id: string,
  data: Partial<{
    full_name: string;
    email: string;
    phone: string;
    position: string;
    linkedin_url: string;
    cv_url: string;
    status: CandidateStatus;
    stage: CandidateStage;
    experience_years: number;
  }>,
): Promise<Candidate> {
  return request<Candidate>(`${API_BASE}/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchNotes(recordId: string): Promise<Note[]> {
  const res = await request<NotesListResponse>(`${API_BASE}/records/${recordId}/notes`);
  return res.data;
}

export async function createNote(recordId: string, content: string): Promise<Note> {
  return request<Note>(`${API_BASE}/records/${recordId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function createCandidate(
  data: Omit<Candidate, 'id' | 'notes_count' | 'applied_at' | 'updated_at'>,
): Promise<Candidate> {
  return request<Candidate>(`${API_BASE}/records`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function replaceCandidate(
  id: string,
  data: Omit<Candidate, 'id' | 'notes_count' | 'applied_at' | 'updated_at'>,
): Promise<Candidate> {
  return request<Candidate>(`${API_BASE}/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(recordId: string, noteId: string): Promise<void> {
  await request<void>(`${API_BASE}/records/${recordId}/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export { ApiError };