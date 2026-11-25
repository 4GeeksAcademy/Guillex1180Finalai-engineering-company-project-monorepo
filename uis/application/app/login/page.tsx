'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Feedback from '@/components/Feedback';
import { saveSession } from '@/lib/auth';

const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '/trackflow-api').replace(/\/$/, '');

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [userUuid, setUserUuid] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedToken = token.trim().replace(/^Bearer\s+/i, '');
    const normalizedUuid = userUuid.trim();
    if (!normalizedToken || !normalizedUuid) {
      setError('Introduce el token de acceso emitido por el sistema de autenticación de TrackFlow.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${normalizedToken}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('El token no es válido o ha caducado. Genera uno nuevo e inténtalo otra vez.');
        if (response.status === 403) throw new Error('No tienes permiso para acceder al backoffice. Contacta con el administrador.');
        if (response.status >= 500) throw new Error('El servicio de autenticación no está disponible. Inténtalo de nuevo más tarde.');
        throw new Error('No se pudo validar la sesión. Revisa los datos e inténtalo de nuevo.');
      }

      try {
        saveSession(normalizedToken, normalizedUuid);
      } catch {
        setError('No se pudo guardar la sesión en este navegador. Habilita el almacenamiento del sitio e inténtalo de nuevo.');
        return;
      }
      router.replace('/backoffice/inventory/products');
    } catch (cause) {
      setError('No se pudo conectar con el servicio de autenticación. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">TrackFlow · Operaciones</p>
        <h1 className="mt-2 text-2xl font-bold">Acceso al backoffice</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Pega el bearer token de tu sesión autenticada. No se almacenan credenciales en este formulario.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium">Token de acceso
            <textarea autoComplete="off" required rows={4} value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Bearer token" />
          </label>
          <label className="block text-sm font-medium">UUID de usuario (TinyDB)
            <input required value={userUuid} onChange={(event) => setUserUuid(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="UUID del operario" />
          </label>
          {error && <Feedback kind="error">{error}</Feedback>}
          <button disabled={isSubmitting} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Validando…' : 'Continuar'}</button>
        </form>
        <p className="mt-5 text-xs leading-5 text-slate-500">La API debe estar configurada y en ejecución. Este formulario no sustituye un proveedor de autenticación ni valida el token localmente.</p>
      </section>
    </main>
  );
}
