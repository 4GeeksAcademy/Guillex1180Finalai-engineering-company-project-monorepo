'use client';

import type { StockOrder } from '@/lib/types';

function movementKind(order: StockOrder): 'inbound' | 'outbound' {
  return order.order_type;
}

export default function StockOrdersTable({ orders }: { orders: StockOrder[] }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
          <tr><th className="px-4 py-3">Tipo de movimiento</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Unidades</th><th className="px-4 py-3">Almacén</th><th className="px-4 py-3">Fecha de creación</th><th className="px-4 py-3">UUID del usuario</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const kind = movementKind(order);
            const inbound = kind === 'inbound';
            const outbound = kind === 'outbound';
            const date = new Date(order.created_at);
            return <tr key={`${order.order_type ?? (order.exit_type ? 'outbound' : 'inbound')}-${order.id}`}>
              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inbound ? 'bg-emerald-100 text-emerald-800' : outbound ? 'bg-orange-100 text-orange-900' : 'bg-slate-100 text-slate-700'}`}>{inbound ? '↓ Recepción de mercancía' : outbound ? `↑ ${order.exit_type === 'loss' ? 'Pérdida confirmada' : 'Despacho'}` : 'Tipo de movimiento desconocido'}</span></td>
              <td className="px-4 py-4"><div className="font-medium">{order.sku_name}</div><div className="mt-1 font-mono text-xs text-slate-500">{order.sku_code}</div></td>
              <td className="px-4 py-4 font-semibold">{order.quantity}</td><td className="px-4 py-4">{order.warehouse}</td><td className="whitespace-nowrap px-4 py-4">{Number.isNaN(date.getTime()) ? order.created_at : date.toLocaleString('es-ES')}</td><td className="px-4 py-4 font-mono text-xs">{order.user_uuid || '—'}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}
