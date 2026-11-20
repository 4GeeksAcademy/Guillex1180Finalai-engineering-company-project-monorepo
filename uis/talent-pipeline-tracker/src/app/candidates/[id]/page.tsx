'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type {
  CandidateDetail,
  CandidateStatus,
  CandidateStage,
} from '@/lib/types';
import {
  STATUS_LABELS,
  STAGE_LABELS,
  STATUS_COLORS,
  STAGE_COLORS,
} from '@/lib/types';
import {
  fetchCandidate,
  replaceCandidate,
} from '@/lib/api';
import CandidateForm, { type CandidateFormData } from '@/components/CandidateForm';
import StatusControls from '@/components/StatusControls';
import NotesPanel from '@/components/NotesPanel';

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const loadCandidate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidate(id);
      setCandidate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar candidato');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  const handleEditCandidate = useCallback(async (data: CandidateFormData) => {
    const updated = await replaceCandidate(id, data);
    setCandidate((prev) => (prev ? { ...prev, ...updated } : prev));
    setShowEditForm(false);
    setEditSuccess('Datos actualizados correctamente');
    setTimeout(() => setEditSuccess(null), 4000);
  }, [id]);

  const handleStatusChange = useCallback((status: CandidateStatus) => {
    setCandidate((prev) => (prev ? { ...prev, status } : prev));
  }, []);

  const handleStageChange = useCallback((stage: CandidateStage) => {
    setCandidate((prev) => (prev ? { ...prev, stage } : prev));
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" role="status" aria-label="Cargando" />
        <p className="text-gray-500">Cargando candidato…</p>
      </div>
    );
  }

  // Error
  if (error || !candidate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <p className="text-3xl mb-3">❌</p>
          <p className="text-red-700 font-medium mb-2">Error al cargar el candidato</p>
          <p className="text-red-500 text-sm mb-4">{error || 'Candidato no encontrado'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadCandidate}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600 hover:underline">
          Candidaturas
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{candidate.full_name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h2>
            <p className="text-gray-500">{candidate.position}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[candidate.status as CandidateStatus]}`}>
              {STATUS_LABELS[candidate.status as CandidateStatus]}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STAGE_COLORS[candidate.stage as CandidateStage]}`}>
              {STAGE_LABELS[candidate.stage as CandidateStage]}
            </span>
          </div>
        </div>

        {/* Fields grid */}
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-500 font-medium">Email</dt>
            <dd className="text-gray-900 mt-0.5">
              <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                {candidate.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Teléfono</dt>
            <dd className="text-gray-900 mt-0.5">
              <a href={`tel:${candidate.phone}`} className="hover:underline">
                {candidate.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">LinkedIn</dt>
            <dd className="text-gray-900 mt-0.5 truncate">
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {candidate.linkedin_url}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">CV</dt>
            <dd className="text-gray-900 mt-0.5">
              <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Ver currículum →
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Años de experiencia</dt>
            <dd className="text-gray-900 mt-0.5">{candidate.experience_years} años</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Fecha de aplicación</dt>
            <dd className="text-gray-900 mt-0.5">
              {new Date(candidate.applied_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>

        {/* Edit button */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => setShowEditForm(true)}
            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar datos
          </button>
        </div>
      </div>

      {/* Edit success feedback */}
      {editSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <span>✅</span> {editSuccess}
        </div>
      )}

      {/* Edit form */}
      {showEditForm && (
        <div className="mb-6">
          <CandidateForm
            title="Editar candidatura"
            submitLabel="Guardar cambios"
            initialData={{
              full_name: candidate.full_name,
              email: candidate.email,
              phone: candidate.phone,
              position: candidate.position,
              linkedin_url: candidate.linkedin_url,
              cv_url: candidate.cv_url,
              status: candidate.status as CandidateStatus,
              stage: candidate.stage as CandidateStage,
              experience_years: candidate.experience_years,
            }}
            onSubmit={handleEditCandidate}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}

      {/* Status and Stage controls — manages its own state */}
      <StatusControls
        recordId={id}
        initialStatus={candidate.status as CandidateStatus}
        initialStage={candidate.stage as CandidateStage}
        onStatusChange={handleStatusChange}
        onStageChange={handleStageChange}
      />

      {/* Notes section — manages its own state */}
      <NotesPanel recordId={id} />

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block text-sm text-gray-500 hover:text-blue-600 hover:underline"
        >
          ← Volver al listado de candidaturas
        </Link>
      </div>
    </div>
  );
}