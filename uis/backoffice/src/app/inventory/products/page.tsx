'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { inventoryApi } from '@/lib/inventory';
import type { SKU } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<SKU[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.listSKUs().then(setProducts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKUs.')).finally(() => setLoading(false));
  }, []);

  return <ProtectedPage>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Inventario</p><h1 className="mt-1 text-3xl font-bold">Productos y stock</h1><p className="mt-2 text-slate-600">Existencias por SKU y almacén.</p></div>
      <div className="flex gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100" href="/inventory/orders">Ver historial</Link><Link className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/inventory/orders/inbound">Registrar entrada</Link></div>
    </div>
    <div className="mt-6 space-y-4">
      {error && <Feedback kind="error">{error}</Feedback>}
      {loading ? <p className="text-slate-500">Cargando inventario…</p> : products.length === 0 && !error ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay SKUs registrados.</p> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Producto / SKU</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Almacén</th><th className="px-4 py-3">Stock actual</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => {
          // UX thresholds: 0 unidades es agotado, 1-9 bajo y 10+ saludable.
          const level = product.current_stock <= 0 ? 'Agotado' : product.current_stock < 10 ? 'Stock bajo' : 'Saludable';
          const badge = product.current_stock <= 0 ? 'bg-red-100 text-red-800' : product.current_stock < 10 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800';
          return <tr key={product.id} className="align-top"><td className="px-4 py-4"><div className="font-semibold text-slate-900">{product.name}</div><div className="mt-1 font-mono text-xs text-slate-500">{product.sku}</div></td><td className="px-4 py-4">{product.client_name}</td><td className="px-4 py-4 capitalize">{product.category}</td><td className="px-4 py-4"><span className="rounded bg-slate-100 px-2 py-1 font-medium">{product.warehouse}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{product.current_stock} · {level}</span></td><td className="px-4 py-4"><div className="flex gap-3 whitespace-nowrap"><Link className="font-semibold text-blue-700 hover:underline" href={`/inventory/orders/inbound?sku_id=${product.id}`}>Entrada</Link><Link className="font-semibold text-blue-700 hover:underline" href={`/inventory/orders/outbound?sku_id=${product.id}`}>Salida</Link></div></td></tr>;
        })}</tbody></table></div>
      </div>}
    </div>
  </ProtectedPage>;
}
