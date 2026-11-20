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
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, `API error ${res.status}: ${text}`);
  }

  return res.json();
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
  const res = await fetch(`${API_BASE}/records/${recordId}/notes/${noteId}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, `API error ${res.status}: ${text}`);
  }
}

export { ApiError };