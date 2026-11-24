'use client';

import dynamic from 'next/dynamic';
import { ChangeEvent, DragEvent, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { incidentsApi, type IncidentAnalysis } from '@/lib/incidents';

const IncidentResults = dynamic(() => import('@/components/incidents/IncidentResults'), {
  loading: () => <p className="mt-7 text-slate-500" role="status">Preparando el panel de resultados…</p>,
});

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

    {analysis && <IncidentResults analysis={analysis} downloading={downloading} onDownload={() => void downloadResults()} />}
  </ProtectedPage>;
}
