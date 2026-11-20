'use client';

import { useState } from 'react';
import type { CandidateStatus, CandidateStage } from '@/lib/types';
import { STATUS_LABELS, STAGE_LABELS } from '@/lib/types';

export interface CandidateFormData {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
}

interface CandidateFormProps {
  initialData?: Partial<CandidateFormData>;
  onSubmit: (data: CandidateFormData) => Promise<void>;
  onCancel: () => void;
  title: string;
  submitLabel?: string;
}

const STATUS_OPTIONS: Array<{ value: CandidateStatus; label: string }> = [
  { value: 'received', label: 'Recibida' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'selected', label: 'Seleccionada' },
  { value: 'discarded', label: 'Descartada' },
];

const STAGE_OPTIONS: Array<{ value: CandidateStage; label: string }> = [
  { value: 'pending', label: 'Pendiente de revisión' },
  { value: 'review', label: 'En revisión' },
  { value: 'personal_interview', label: 'Entrevista personal' },
  { value: 'technical_interview', label: 'Entrevista técnica' },
  { value: 'offer_presented', label: 'Oferta presentada' },
];

export default function CandidateForm({
  initialData,
  onSubmit,
  onCancel,
  title,
  submitLabel = 'Guardar',
}: CandidateFormProps) {
  const [form, setForm] = useState<CandidateFormData>({
    full_name: initialData?.full_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    position: initialData?.position || '',
    linkedin_url: initialData?.linkedin_url || '',
    cv_url: initialData?.cv_url || '',
    status: initialData?.status || 'received',
    stage: initialData?.stage || 'pending',
    experience_years: initialData?.experience_years ?? 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CandidateFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CandidateFormData, string>> = {};

    if (!form.full_name.trim()) newErrors.full_name = 'El nombre es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email no válido';
    if (!form.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!form.position.trim()) newErrors.position = 'El puesto es obligatorio';
    if (form.experience_years < 0) newErrors.experience_years = 'No puede ser negativo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: keyof CandidateFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass = (field: keyof CandidateFormData) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      errors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <label htmlFor="cf-full_name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input id="cf-full_name" type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className={inputClass('full_name')} />
          {errors.full_name && <p className="text-xs text-red-600 mt-0.5">{errors.full_name}</p>}
        </div>

        <div>
          <label htmlFor="cf-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input id="cf-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass('email')} />
          {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="cf-phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
          <input id="cf-phone" type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass('phone')} />
          {errors.phone && <p className="text-xs text-red-600 mt-0.5">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="cf-position" className="block text-sm font-medium text-gray-700 mb-1">Puesto *</label>
          <input id="cf-position" type="text" value={form.position} onChange={(e) => set('position', e.target.value)} className={inputClass('position')} />
          {errors.position && <p className="text-xs text-red-600 mt-0.5">{errors.position}</p>}
        </div>

        <div>
          <label htmlFor="cf-experience" className="block text-sm font-medium text-gray-700 mb-1">Años de experiencia</label>
          <input id="cf-experience" type="number" min={0} value={form.experience_years} onChange={(e) => set('experience_years', Number(e.target.value))} className={inputClass('experience_years')} />
          {errors.experience_years && <p className="text-xs text-red-600 mt-0.5">{errors.experience_years}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cf-linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input id="cf-linkedin" type="url" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} className={inputClass('linkedin_url')} placeholder="https://linkedin.com/in/…" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cf-cv" className="block text-sm font-medium text-gray-700 mb-1">CV URL</label>
          <input id="cf-cv" type="url" value={form.cv_url} onChange={(e) => set('cv_url', e.target.value)} className={inputClass('cv_url')} placeholder="https://…" />
        </div>

        <div>
          <label htmlFor="cf-status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select id="cf-status" value={form.status} onChange={(e) => set('status', e.target.value as CandidateStatus)} className={inputClass('status')}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="cf-stage" className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
          <select id="cf-stage" value={form.stage} onChange={(e) => set('stage', e.target.value as CandidateStage)} className={inputClass('stage')}>
            {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}