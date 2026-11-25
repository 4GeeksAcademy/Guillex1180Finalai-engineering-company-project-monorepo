'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { inventoryApi } from '@/lib/inventory';
import type { StockOrder } from '@/lib/types';

const StockOrdersTable = dynamic(() => import('@/components/inventory/StockOrdersTable'), {
  loading: () => <p className="text-slate-500">Preparando historial…</p>,
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    [orders],
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const items = await inventoryApi.listOrders();
      setOrders(items);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  return (
    <ProtectedPage>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Auditoría operativa</p>
        <h1 className="mt-1 text-3xl font-bold">Historial de movimientos de stock</h1>
        <p className="mt-2 text-slate-600">Vista de solo lectura de las recepciones de mercancía y los despachos o pérdidas de TrackFlow.</p>
        <div className="mt-6 space-y-4">
          {error && <div className="space-y-2"><Feedback kind="error">{error}</Feedback><button type="button" onClick={() => void loadOrders()} disabled={loading} className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">{loading ? 'Actualizando…' : 'Reintentar'}</button></div>}
          {loading ? <p className="text-slate-500">Cargando órdenes…</p> : orders.length === 0 && !error ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay movimientos de stock registrados.</p>
          ) : !loading && orders.length > 0 ? (
            <StockOrdersTable orders={sortedOrders} />
          ) : null}
        </div>
      </div>
    </ProtectedPage>
  );
}
