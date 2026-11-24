'use client';

import type { IncidentAnalysis } from '@/lib/incidents';

const CATEGORIES = ['LOST_PARCEL', 'DELAYED_DELIVERY', 'WRONG_ADDRESS', 'RETURN_REQUEST', 'DAMAGE'];
const STATUSES = ['OPEN', 'CLOSED', 'DISCARDED'];
const SCORES = ['1', '2', '3', '4', '5'];

export default function IncidentResults({
  analysis,
  downloading,
  onDownload,
}: {
  analysis: IncidentAnalysis;
  downloading: boolean;
  onDownload: () => void;
}) {
  return <section className="mt-7 space-y-6" aria-live="polite">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-2xl font-bold">Resumen del análisis</h2><p className="mt-1 text-sm text-slate-600">Los desgloses se calculan solo sobre los registros válidos.</p></div>
      <button type="button" onClick={onDownload} disabled={downloading} className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50">{downloading ? 'Preparando…' : 'Descargar resultados CSV'}</button>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <Metric title="Registros procesados" value={analysis.total_records} />
      <Metric title="Registros válidos" value={analysis.valid_records} tone="green" />
      <Metric title="Inválidos / incompletos" value={analysis.invalid_records} tone={analysis.invalid_records ? 'amber' : 'green'} />
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Breakdown title="Incidencias por categoría" values={analysis.category_counts} keys={CATEGORIES} />
      <Breakdown title="Incidencias por estado" values={analysis.status_counts} keys={STATUSES} />
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Índice de satisfacción</h3>
        <p className="mt-3 text-3xl font-bold text-blue-800">{analysis.satisfaction.average_score === null ? 'N/D' : `${analysis.satisfaction.average_score.toFixed(2)} / 5`}</p>
        <p className="mt-1 text-sm text-slate-600">Puntuaciones registradas en casos cerrados: {analysis.satisfaction.scored_closed_count} de {analysis.satisfaction.closed_count}</p>
        <div className="mt-4 space-y-2">{SCORES.map((score) => <div key={score} className="flex justify-between border-t border-slate-100 pt-2 text-sm"><span>Puntuación {score}</span><strong>{analysis.satisfaction.score_counts[score] ?? 0}</strong></div>)}</div>
      </section>
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-lg font-semibold text-amber-950">Registros inválidos por motivo</h3>
        <p className="mt-1 text-sm text-amber-900">Un registro puede incumplir más de una regla; el total de registros inválidos se cuenta una sola vez.</p>
        <ul className="mt-4 space-y-2">{analysis.invalid_breakdown.filter((item) => item.count > 0).map((item) => <li key={item.code} className="flex justify-between gap-4 border-t border-amber-200 pt-2 text-sm"><span>{item.label}</span><strong>{item.count}</strong></li>)}</ul>
        {analysis.invalid_records === 0 && <p className="mt-3 text-sm text-emerald-800">No se encontraron registros inválidos.</p>}
      </section>
    </div>
  </section>;
}

function Metric({ title, value, tone = 'blue' }: { title: string; value: number; tone?: 'blue' | 'green' | 'amber' }) {
  const tones = { blue: 'text-blue-800', green: 'text-emerald-800', amber: 'text-amber-800' };
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{title}</p><p className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</p></div>;
}

function Breakdown({ title, values, keys }: { title: string; values: Record<string, number>; keys: string[] }) {
  const total = Object.values(values).reduce((sum, count) => sum + count, 0);
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-semibold">{title}</h3><ul className="mt-3 space-y-2">{keys.map((key) => { const count = values[key] ?? 0; const percent = total ? (count / total * 100).toFixed(1) : '0.0'; return <li key={key} className="flex justify-between gap-4 border-t border-slate-100 pt-2 text-sm"><span className="font-mono text-slate-700">{key}</span><span className="font-semibold">{count} <span className="font-normal text-slate-500">({percent}%)</span></span></li>; })}</ul></section>;
}
