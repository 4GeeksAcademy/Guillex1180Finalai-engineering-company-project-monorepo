'use client';

import { ChangeEvent, DragEvent, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { incidentsApi, type IncidentAnalysis } from '@/lib/incidents';

const CATEGORIES = ['LOST_PARCEL', 'DELAYED_DELIVERY', 'WRONG_ADDRESS', 'RETURN_REQUEST', 'DAMAGE'];
const STATUSES = ['OPEN', 'CLOSED', 'DISCARDED'];
const SCORES = ['1', '2', '3', '4', '5'];

export default function IncidentsAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function acceptFile(candidate?: File) {
    setError('');
    setMessage('');
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.csv')) {
      setFile(null);
      setError('Selecciona un archivo con extensión .csv.');
      return;
    }
    setFile(candidate);
    setAnalysis(null);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function runAnalysis() {
    if (!file) {
      setError('Selecciona un archivo CSV antes de analizarlo.');
      return;
    }
    setAnalyzing(true);
    setError('');
    setMessage('');
    try {
      setAnalysis(await incidentsApi.analyze(file));
      setMessage('Análisis completado. Los resultados contienen solo métricas agregadas.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo analizar el CSV.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function downloadResults() {
    setDownloading(true);
    setError('');
    try {
      const blob = await incidentsApi.downloadResults();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = 'incidents-results.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      setMessage('Descarga iniciada: incidents-results.csv.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo descargar el CSV.');
    } finally {
      setDownloading(false);
    }
  }

  return <ProtectedPage>
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">TrackFlow · Customer Experience</p>
      <h1 className="mt-1 text-3xl font-bold">Análisis de incidencias</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Carga el CSV del helpdesk para revisar volumen, calidad de datos y satisfacción. Los correos se usan solo para validación y nunca se muestran ni se exportan.</p>
    </div>

    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="upload-title">
      <h2 id="upload-title" className="text-lg font-semibold">Cargar archivo CSV</h2>
      <label
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center ${dragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-500'}`}
      >
        <span className="font-semibold text-slate-800">Arrastra aquí el CSV o selecciónalo</span>
        <span className="mt-1 text-sm text-slate-500">UTF-8, separado por comas, con encabezados de TrackFlow</span>
        <input className="sr-only" type="file" accept=".csv,text/csv" onChange={onInputChange} />
      </label>
      {file && <p className="mt-3 text-sm text-slate-700">Archivo seleccionado: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)</p>}
      <button type="button" onClick={runAnalysis} disabled={!file || analyzing} className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">
        {analyzing ? 'Analizando…' : 'Analizar incidencias'}
      </button>
    </section>

    {error && <div className="mt-5"><Feedback kind="error">{error}</Feedback></div>}
    {message && <div className="mt-5"><Feedback kind="success">{message}</Feedback></div>}

    {analysis && <section className="mt-7 space-y-6" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Resumen del análisis</h2><p className="mt-1 text-sm text-slate-600">Los desgloses se calculan solo sobre los registros válidos.</p></div>
        <button type="button" onClick={downloadResults} disabled={downloading} className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50">{downloading ? 'Preparando…' : 'Descargar resultados CSV'}</button>
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
    </section>}
  </ProtectedPage>;
}

function Metric({ title, value, tone = 'blue' }: { title: string; value: number; tone?: 'blue' | 'green' | 'amber' }) {
  const tones = { blue: 'text-blue-800', green: 'text-emerald-800', amber: 'text-amber-800' };
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{title}</p><p className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</p></div>;
}

function Breakdown({ title, values, keys }: { title: string; values: Record<string, number>; keys: string[] }) {
  const total = Object.values(values).reduce((sum, count) => sum + count, 0);
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-semibold">{title}</h3><ul className="mt-3 space-y-2">{keys.map((key) => { const count = values[key] ?? 0; const percent = total ? (count / total * 100).toFixed(1) : '0.0'; return <li key={key} className="flex justify-between gap-4 border-t border-slate-100 pt-2 text-sm"><span className="font-mono text-slate-700">{key}</span><span className="font-semibold">{count} <span className="font-normal text-slate-500">({percent}%)</span></span></li>; })}</ul></section>;
}
