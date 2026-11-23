'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { getUserUuid } from '@/lib/auth';
import { inventoryApi } from '@/lib/inventory';
import type { SKU, Warehouse } from '@/lib/types';

export default function InboundPage() {
  const router = useRouter();
  const [products, setProducts] = useState<SKU[]>([]);
  const [skuId, setSkuId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [warehouse, setWarehouse] = useState<Warehouse>('LA');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setError('');
    try {
      const items = await inventoryApi.listSKUs();
      setProducts(items);
      const requestedId = new URLSearchParams(window.location.search).get('sku_id');
      if (requestedId && items.some((item) => item.id === Number(requestedId))) setSkuId(requestedId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKU.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const selected = products.find((item) => item.id === Number(skuId));
  useEffect(() => { if (selected) setWarehouse(selected.warehouse); }, [selected]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!selected) { setError('Selecciona un SKU válido.'); return; }
    if (!getUserUuid()) { setError('Falta el UUID del operario de almacén. Cierra sesión y configúralo de nuevo.'); return; }
    setBusy(true);
    try {
      await inventoryApi.createInbound({ sku_id: selected.id, quantity: Number(quantity), reference: reference.trim(), warehouse, user_uuid: getUserUuid() });
      setSuccess('Recepción de mercancía registrada correctamente.'); setSkuId(''); setQuantity(''); setReference(''); setWarehouse('LA');
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar la entrada.'); }
    finally { setBusy(false); }
  }

  return <ProtectedPage><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">StockEntry · recepción</p><h1 className="mt-1 text-3xl font-bold">Registrar recepción de mercancía</h1><p className="mt-2 text-slate-600">Registra las unidades recibidas de una marca cliente en el almacén de TrackFlow.</p>
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-medium">SKU / descripción<select required value={skuId} onChange={(event) => setSkuId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="">{loadingProducts ? 'Cargando SKU…' : 'Seleccionar SKU…'}</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku} · {item.warehouse}</option>)}</select></label>
      <label className="block text-sm font-medium">Unidades recibidas<input required min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      <label className="block text-sm font-medium">Referencia de despacho del cliente<input required value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="PO-2024-0098" /></label>
      <label className="block text-sm font-medium">Almacén receptor<select value={warehouse} onChange={(event) => setWarehouse(event.target.value as Warehouse)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="LA">LA — Los Ángeles</option><option value="ZGZ">ZGZ — Zaragoza</option></select></label>
      {error && <div className="space-y-2"><Feedback kind="error">{error}</Feedback>{products.length === 0 && <button type="button" onClick={() => void loadProducts()} disabled={loadingProducts} className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">{loadingProducts ? 'Cargando…' : 'Reintentar carga de SKU'}</button>}</div>}{success && <Feedback kind="success">{success}</Feedback>}
      <button disabled={busy || loadingProducts || products.length === 0} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Guardando…' : loadingProducts ? 'Cargando SKU…' : 'Confirmar recepción'}</button>
    </form>
  </div></ProtectedPage>;
}
