'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { inventoryApi } from '@/lib/inventory';
import { track } from '@/lib/telemetry';
import type { SKU } from '@/lib/types';

export default function ProductsPage() {
	const [products, setProducts] = useState<SKU[]>([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		track('backoffice_page_viewed', { view: 'inventory_products', client_version: '1.0.0' });
	}, []);

	const loadProducts = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			setProducts(await inventoryApi.listSKUs());
		} catch (reason: unknown) {
			setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKUs. Comprueba tu conexión e inténtalo de nuevo.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { void loadProducts(); }, [loadProducts]);

	return <ProtectedPage>
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Inventario TrackFlow</p><h1 className="mt-1 text-3xl font-bold">SKU y stock actual</h1><p className="mt-2 text-slate-600">Existencias calculadas por SKU y almacén.</p></div>
			<div className="flex gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100" href="/backoffice/inventory/orders">Ver historial de movimientos</Link><Link className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/backoffice/inventory/orders/inbound">Registrar recepción</Link></div>
		</div>
		<div className="mt-6 space-y-4">
			{error && <div className="space-y-2"><Feedback kind="error">{error}</Feedback><button type="button" onClick={() => void loadProducts()} disabled={loading} className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">{loading ? 'Actualizando…' : 'Reintentar'}</button></div>}
			{loading ? <p className="text-slate-500">Cargando inventario…</p> : products.length === 0 && !error ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay SKUs registrados.</p> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">SKU / descripción</th><th className="px-4 py-3">Marca cliente</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Almacén</th><th className="px-4 py-3">Stock actual</th><th className="px-4 py-3">Movimientos</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => {
					// UX thresholds: 0 unidades es agotado, 1-9 bajo y 10+ saludable.
					const level = product.current_stock <= 0 ? 'Agotado' : product.current_stock < 10 ? 'Stock bajo' : 'Saludable';
					const badge = product.current_stock <= 0 ? 'bg-red-100 text-red-800' : product.current_stock < 10 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800';
					return <tr key={product.id} className="align-top"><td className="px-4 py-4"><div className="font-semibold text-slate-900">{product.name}</div><div className="mt-1 font-mono text-xs text-slate-500">{product.sku}</div></td><td className="px-4 py-4">{product.client_name}</td><td className="px-4 py-4 capitalize">{product.category}</td><td className="px-4 py-4"><span className="rounded bg-slate-100 px-2 py-1 font-medium">{product.warehouse}</span></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{product.current_stock} · {level}</span></td><td className="px-4 py-4"><div className="flex gap-3 whitespace-nowrap"><Link className="font-semibold text-blue-700 hover:underline" href={`/backoffice/inventory/orders/inbound?sku_id=${product.id}`}>Crear recepción</Link><Link className="font-semibold text-blue-700 hover:underline" href={`/backoffice/inventory/orders/outbound?sku_id=${product.id}`}>Registrar despacho o pérdida</Link></div></td></tr>;
				})}</tbody></table></div>
			</div>}
		</div>
	</ProtectedPage>;
}
