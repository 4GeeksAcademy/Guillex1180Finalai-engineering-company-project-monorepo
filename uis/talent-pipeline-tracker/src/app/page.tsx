'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import type { Candidate, CandidateStatus, CandidateStage } from '@/lib/types';
import { STATUS_LABELS, STAGE_LABELS, STATUS_COLORS, STAGE_COLORS } from '@/lib/types';
import { fetchCandidates, createCandidate } from '@/lib/api';
import CandidateForm, { type CandidateFormData } from '@/components/CandidateForm';

/** Available filter options */
const STATUSES: Array<{ value: CandidateStatus | ''; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'received', label: 'Recibida' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'selected', label: 'Seleccionada' },
  { value: 'discarded', label: 'Descartada' },
];

const STAGES: Array<{ value: CandidateStage | ''; label: string }> = [
  { value: '', label: 'Todas las etapas' },
  { value: 'pending', label: 'Pendiente de revisión' },
  { value: 'review', label: 'En revisión' },
  { value: 'personal_interview', label: 'Entrevista personal' },
  { value: 'technical_interview', label: 'Entrevista técnica' },
  { value: 'offer_presented', label: 'Oferta presentada' },
];

function HomePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const statusParam = (searchParams.get('status') as CandidateStatus | '') || '';
  const stageParam = (searchParams.get('stage') as CandidateStage | '') || '';

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const load = useCallback(async (status: string, stage: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCandidates({
        status: (status || undefined) as CandidateStatus | undefined,
        stage: (stage || undefined) as CandidateStage | undefined,
        limit: 100,
      });
      setCandidates(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar candidatos');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateCandidate = useCallback(async (data: CandidateFormData) => {
    const created = await createCandidate(data);
    setCandidates((prev) => [created, ...prev]);
    setTotal((prev) => prev + 1);
    setShowCreateForm(false);
    setCreateSuccess(`Candidatura de "${created.full_name}" creada correctamente`);
    setTimeout(() => setCreateSuccess(null), 4000);
  }, []);

  // Fetch candidates when filters change
  useEffect(() => {
    load(statusParam, stageParam);
  }, [statusParam, stageParam, load]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
        router.replace(`/?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [candidates, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidaturas</h2>
          <p className="text-gray-500 mt-1">
            {total} candidatura{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
            {search && ` · ${filtered.length} coinciden`}
          </p>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setCreateSuccess(null); }}
          className="shrink-0 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva candidatura
        </button>
      </div>

      {/* Success feedback */}
      {createSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <span>✅</span> {createSuccess}
        </div>
      )}

      {/* Create form modal/inline */}
      {showCreateForm && (
        <div className="mb-6">
          <CandidateForm
            title="Nueva candidatura"
            submitLabel="Crear candidatura"
            onSubmit={handleCreateCandidate}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Filters + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              id="search"
              type="text"
              placeholder="Nombre o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={statusParam}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stage filter */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
              Etapa
            </label>
            <select
              id="stage"
              value={stageParam}
              onChange={(e) => updateFilter('stage', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters tags */}
        {(statusParam || stageParam || search) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {statusParam && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                Estado: {STATUS_LABELS[statusParam as CandidateStatus]}
                <button onClick={() => updateFilter('status', '')} className="hover:text-blue-900 ml-0.5" aria-label="Quitar filtro de estado">×</button>
              </span>
            )}
            {stageParam && (
              <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                Etapa: {STAGE_LABELS[stageParam as CandidateStage]}
                <button onClick={() => updateFilter('stage', '')} className="hover:text-purple-900 ml-0.5" aria-label="Quitar filtro de etapa">×</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                Búsqueda: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} className="hover:text-gray-900 ml-0.5" aria-label="Limpiar búsqueda">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" role="status" aria-label="Cargando" />
          <p className="text-gray-500">Cargando candidaturas…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">❌ Error al cargar datos</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => load(statusParam, stageParam)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium">No se encontraron candidatos</p>
          <p className="text-gray-400 text-sm mt-1">Prueba con otros filtros o términos de búsqueda</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Puesto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Etapa</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{candidate.full_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{candidate.position}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[candidate.status as CandidateStatus] || ''}`}>
                        {STATUS_LABELS[candidate.status as CandidateStatus] || candidate.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${STAGE_COLORS[candidate.stage as CandidateStage] || ''}`}>
                        {STAGE_LABELS[candidate.stage as CandidateStage] || candidate.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="inline-block text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" role="status" aria-label="Cargando" />
        <p className="text-gray-500 mt-4">Cargando…</p>
      </div>
    }>
      <HomePageInner />
    </Suspense>
  );
}