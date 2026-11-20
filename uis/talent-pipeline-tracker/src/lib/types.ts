export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface CandidateDetail extends Candidate {
  /** Notes are only included in detail endpoint */
  notes?: Note[];
}

export interface Note {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export type CandidateStatus = 'received' | 'in_progress' | 'selected' | 'discarded';
export type CandidateStage = 'pending' | 'review' | 'personal_interview' | 'technical_interview' | 'offer_presented';

export interface CandidateListResponse {
  total: number;
  page: number;
  limit: number;
  data: Candidate[];
}

export interface NotesListResponse {
  data: Note[];
  meta: { total: number };
}

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: 'Recibida',
  in_progress: 'En proceso',
  selected: 'Seleccionada',
  discarded: 'Descartada',
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: 'Pendiente de revisión',
  review: 'En revisión',
  personal_interview: 'Entrevista personal',
  technical_interview: 'Entrevista técnica',
  offer_presented: 'Oferta presentada',
};

export const STATUS_COLORS: Record<CandidateStatus, string> = {
  received: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  selected: 'bg-green-100 text-green-800 border-green-300',
  discarded: 'bg-red-100 text-red-800 border-red-300',
};

export const STAGE_COLORS: Record<CandidateStage, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-300',
  review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  personal_interview: 'bg-orange-100 text-orange-800 border-orange-300',
  technical_interview: 'bg-purple-100 text-purple-800 border-purple-300',
  offer_presented: 'bg-green-100 text-green-800 border-green-300',
};