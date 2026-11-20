'use client';

import { FormEvent, useEffect, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import { getUserUuid } from '@/lib/auth';
import { inventoryApi } from '@/lib/inventory';
import type { ExitType, SKU, Warehouse } from '@/lib/types';

export default function OutboundPage() {
  const [products, setProducts] = useState<SKU[]>([]);
  const [skuId, setSkuId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [exitType, setExitType] = useState<ExitType>('dispatch');
  const [tracking, setTracking] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    inventoryApi.listSKUs().then((items) => {
      setProducts(items);
      const requestedId = new URLSearchParams(window.location.search).get('sku_id');
      if (requestedId && items.some((item) => item.id === Number(requestedId))) setSkuId(requestedId);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKUs.'));
  }, []);

  const selected = products.find((item) => item.id === Number(skuId));
  const requestedQuantity = Number(quantity);
  const insufficient = Boolean(selected && requestedQuantity > 0 && requestedQuantity > selected.current_stock);
  const trackingRequired = exitType === 'dispatch';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!selected) { setError('Selecciona un SKU válido.'); return; }
    if (!getUserUuid()) { setError('Falta el UUID del operario. Cierra sesión y configúralo de nuevo.'); return; }
    if (requestedQuantity <= 0 || !Number.isInteger(requestedQuantity)) { setError('La cantidad debe ser un entero mayor que cero.'); return; }
    if (insufficient) { setError(`Stock insuficiente: disponible ${selected.current_stock}, solicitado ${requestedQuantity}.`); return; }
    if (trackingRequired && !tracking.trim()) { setError('El tracking es obligatorio para una salida por despacho.'); return; }
    setBusy(true);
    try {
      await inventoryApi.createOutbound({ sku_id: selected.id, quantity: requestedQuantity, exit_type: exitType, tracking_number: trackingRequired ? tracking.trim() : null, warehouse: selected.warehouse as Warehouse, user_uuid: getUserUuid() });
      setSuccess('Salida registrada correctamente.'); setQuantity(''); setTracking('');
      // Refresh the visible stock to avoid allowing consecutive overdraws in this form.
      const updated = await inventoryApi.listSKUs(); setProducts(updated);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar la salida.'); }
    finally { setBusy(false); }
  }

  return <ProtectedPage><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Despacho y ajustes</p><h1 className="mt-1 text-3xl font-bold">Registrar salida de stock</h1><p className="mt-2 text-slate-600">El stock disponible se muestra al seleccionar un producto y se valida antes del envío.</p>
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-medium">Producto / SKU<select required value={skuId} onChange={(event) => setSkuId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="">Seleccionar producto…</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku} · stock {item.current_stock} · {item.warehouse}</option>)}</select></label>
      {selected && <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm">Stock disponible en {selected.warehouse}: <strong>{selected.current_stock}</strong></div>}
      <label className="block text-sm font-medium">Cantidad de salida<input required min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      {insufficient && <Feedback kind="warning">Cantidad superior al stock disponible ({selected?.current_stock}). Reduce la cantidad para continuar.</Feedback>}
      <label className="block text-sm font-medium">Tipo de salida<select value={exitType} onChange={(event) => setExitType(event.target.value as ExitType)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="dispatch">Despacho</option><option value="loss">Merma / pérdida</option></select></label>
      {trackingRequired && <label className="block text-sm font-medium">Número de tracking<input required value={tracking} onChange={(event) => setTracking(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="TRACK-001234" /></label>}
      {error && <Feedback kind="error">{error}</Feedback>}{success && <Feedback kind="success">{success}</Feedback>}
      <button disabled={busy || !selected || insufficient} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Guardando…' : 'Registrar salida'}</button>
    </form>
  </div></ProtectedPage>;
}
