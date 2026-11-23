'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/auth';
import { useProtectedSession } from '@/lib/useProtectedSession';
import { getAccessToken } from '@/lib/auth';

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useProtectedSession(getAccessToken);

  if (!ready) return <div className="p-8 text-sm text-slate-500">Verificando sesión…</div>;

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-4">
          <Link href="/backoffice/inventory/products" className="mr-auto text-lg font-bold text-slate-900">TrackFlow <span className="font-medium text-slate-500">/ Operaciones</span></Link>
          <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
            <Link href="/backoffice/inventory/products" className="hover:text-blue-700">Inventario</Link>
            <Link href="/backoffice/inventory/orders/inbound" className="hover:text-blue-700">Registrar recepción</Link>
            <Link href="/backoffice/inventory/orders/outbound" className="hover:text-blue-700">Registrar despacho o pérdida</Link>
            <Link href="/backoffice/inventory/orders" className="hover:text-blue-700">Movimientos de stock</Link>
            <Link href="/backoffice/suppliers" className="hover:text-blue-700">Proveedores</Link>
            <Link href="/backoffice/incidents" className="hover:text-blue-700">Análisis de incidencias</Link>
          </nav>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" onClick={() => { clearSession(); router.replace('/login'); }}>Cerrar sesión</button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-500">TrackFlow · Backoffice de inventario</footer>
    </>
  );
}
