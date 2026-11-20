'use client';

import { useEffect, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { inventoryApi } from '@/lib/inventory';
import type { StockOrder } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.listOrders().then((items) => setOrders([...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial.')).finally(() => setLoading(false));
  }, []);

  return <ProtectedPage><div><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Auditoría operativa</p><h1 className="mt-1 text-3xl font-bold">Historial de movimientos</h1><p className="mt-2 text-slate-600">Vista de solo lectura de entradas y salidas registradas.</p>
    <div className="mt-6 space-y-4">{error && <Feedback kind="error">{error}</Feedback>}{loading ? <p className="text-slate-500">Cargando movimientos…</p> : orders.length === 0 && !error ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay movimientos registrados.</p> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Cantidad</th><th className="px-4 py-3">Almacén</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">UUID operario</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => { const inbound = order.order_type === 'inbound' || order.order_type === 'entry' || (!order.order_type && !order.exit_type); return <tr key={`${order.order_type}-${order.id}`}><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inbound ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-900'}`}>{inbound ? 'Entrada' : `Salida${order.exit_type ? ` · ${order.exit_type}` : ''}`}</span></td><td className="px-4 py-4"><div className="font-medium">{order.sku?.name ?? order.sku_code ?? `SKU ${order.sku_id}`}</div><div className="font-mono text-xs text-slate-500">{order.sku?.sku ?? order.sku_code ?? ''}</div></td><td className="px-4 py-4 font-semibold">{order.quantity}</td><td className="px-4 py-4">{order.warehouse}</td><td className="px-4 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleString('es-ES')}</td><td className="px-4 py-4 font-mono text-xs">{order.user_uuid || '—'}</td></tr>; })}</tbody></table></div></div>}</div>
  </div></ProtectedPage>;
}
