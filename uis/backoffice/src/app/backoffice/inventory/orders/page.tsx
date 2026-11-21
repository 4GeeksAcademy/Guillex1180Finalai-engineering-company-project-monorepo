'use client';

import { useEffect, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { inventoryApi } from '@/lib/inventory';
import type { StockOrder } from '@/lib/types';

function movementKind(order: StockOrder): 'inbound' | 'outbound' | 'unknown' {
  if (order.order_type === 'inbound' || order.order_type === 'entry') return 'inbound';
  if (order.order_type === 'outbound' || order.order_type === 'exit' || order.exit_type) return 'outbound';
  return 'unknown';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.listOrders()
      .then((items) => setOrders([...items].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedPage>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Auditoría operativa</p>
        <h1 className="mt-1 text-3xl font-bold">Historial de movimientos de stock</h1>
        <p className="mt-2 text-slate-600">Vista de solo lectura de las recepciones de mercancía y los despachos o pérdidas de TrackFlow.</p>
        <div className="mt-6 space-y-4">
          {error && <Feedback kind="error">{error}</Feedback>}
          {loading ? <p className="text-slate-500">Cargando órdenes…</p> : orders.length === 0 && !error ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay movimientos de stock registrados.</p>
          ) : !loading && orders.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Tipo de movimiento</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Unidades</th>
                      <th className="px-4 py-3">Almacén</th>
                      <th className="px-4 py-3">Fecha de creación</th>
                      <th className="px-4 py-3">UUID del usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const kind = movementKind(order);
                      const inbound = kind === 'inbound';
                      const outbound = kind === 'outbound';
                      const date = new Date(order.created_at);
                      return (
                        <tr key={`${order.order_type ?? (order.exit_type ? 'outbound' : 'inbound')}-${order.id}`}>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inbound ? 'bg-emerald-100 text-emerald-800' : outbound ? 'bg-orange-100 text-orange-900' : 'bg-slate-100 text-slate-700'}`}>
                              {inbound ? '↓ Recepción de mercancía' : outbound ? `↑ ${order.exit_type === 'loss' ? 'Pérdida confirmada' : 'Despacho'}` : 'Tipo de movimiento desconocido'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium">{order.sku?.name ?? order.sku_code ?? `SKU ${order.sku_id}`}</div>
                            {(order.sku?.sku ?? order.sku_code) && <div className="mt-1 font-mono text-xs text-slate-500">{order.sku?.sku ?? order.sku_code}</div>}
                          </td>
                          <td className="px-4 py-4 font-semibold">{order.quantity}</td>
                          <td className="px-4 py-4">{order.warehouse}</td>
                          <td className="whitespace-nowrap px-4 py-4">{Number.isNaN(date.getTime()) ? order.created_at : date.toLocaleString('es-ES')}</td>
                          <td className="px-4 py-4 font-mono text-xs">{order.user_uuid || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedPage>
  );
}
