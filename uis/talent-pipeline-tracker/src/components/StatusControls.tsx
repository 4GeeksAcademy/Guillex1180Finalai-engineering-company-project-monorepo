'use client';

import { useCallback, useState } from 'react';
import { updateCandidate } from '@/lib/api';
import type { CandidateStatus, CandidateStage } from '@/lib/types';

interface StatusControlsProps {
  recordId: string;
  initialStatus: CandidateStatus;
  initialStage: CandidateStage;
  onStatusChange: (status: CandidateStatus) => void;
  onStageChange: (stage: CandidateStage) => void;
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

export default function StatusControls({
  recordId,
  initialStatus,
  initialStage,
  onStatusChange,
  onStageChange,
}: StatusControlsProps) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = useCallback(
    async (field: 'status' | 'stage', value: string) => {
      setUpdating(true);
      try {
        await updateCandidate(recordId, { [field]: value });
        if (field === 'status') {
          onStatusChange(value as CandidateStatus);
        } else {
          onStageChange(value as CandidateStage);
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al actualizar');
      } finally {
        setUpdating(false);
      }
    },
    [recordId, onStatusChange, onStageChange],
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actualizar estado y etapa</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Status control */}
        <div>
          <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1.5">
            Estado
          </label>
          <select
            id="status-select"
            value={initialStatus}
            onChange={(e) => handleUpdate('status', e.target.value)}
            disabled={updating}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stage control */}
        <div>
          <label htmlFor="stage-select" className="block text-sm font-medium text-gray-700 mb-1.5">
            Etapa
          </label>
          <select
            id="stage-select"
            value={initialStage}
            onChange={(e) => handleUpdate('stage', e.target.value)}
            disabled={updating}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-60"
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {updating && <p className="text-xs text-blue-600 mt-2">Actualizando…</p>}
    </div>
  );
}