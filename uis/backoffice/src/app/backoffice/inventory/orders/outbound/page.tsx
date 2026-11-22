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
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    inventoryApi.listSKUs().then((items) => {
      setProducts(items);
      const requestedId = new URLSearchParams(window.location.search).get('sku_id');
      if (requestedId && items.some((item) => item.id === Number(requestedId))) setSkuId(requestedId);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKU.'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const selected = products.find((item) => item.id === Number(skuId));
  const requestedQuantity = Number(quantity);
  const insufficient = Boolean(selected && requestedQuantity > 0 && requestedQuantity > selected.current_stock);
  const trackingRequired = exitType === 'dispatch';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!selected) { setError('Selecciona un SKU válido.'); return; }
    if (!getUserUuid()) { setError('Falta el UUID del coordinador logístico que autoriza la salida. Cierra sesión y configúralo de nuevo.'); return; }
    if (requestedQuantity <= 0 || !Number.isInteger(requestedQuantity)) { setError('La cantidad debe ser un número entero mayor que cero.'); return; }
    if (insufficient) { setError(`Stock insuficiente: disponible ${selected.current_stock}, solicitado ${requestedQuantity}.`); return; }
    if (trackingRequired && !tracking.trim()) { setError('El número de seguimiento es obligatorio para un despacho.'); return; }
    setBusy(true);
    try {
      await inventoryApi.createOutbound({ sku_id: selected.id, quantity: requestedQuantity, exit_type: exitType, tracking_number: trackingRequired ? tracking.trim() : null, warehouse: selected.warehouse as Warehouse, user_uuid: getUserUuid() });
      setSuccess('Salida de stock registrada correctamente.'); setQuantity(''); setTracking('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar la salida de stock.'); }
    finally { setBusy(false); }
    // A refresh failure must not report a failed StockExit after the POST succeeded.
    try {
      const updated = await inventoryApi.listSKUs();
      setProducts(updated);
    } catch {
      // Keep the successful confirmation; the operator can reload to refresh stock.
    }
  }

  return <ProtectedPage><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">StockExit · despacho o pérdida confirmada</p><h1 className="mt-1 text-3xl font-bold">Registrar salida de stock</h1><p className="mt-2 text-slate-600">Consulta el stock actual del almacén antes de registrar un despacho a cliente o una pérdida confirmada.</p>
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-medium">SKU / descripción<select required value={skuId} onChange={(event) => setSkuId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="">{loadingProducts ? 'Cargando SKU…' : 'Seleccionar SKU…'}</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku} · stock {item.current_stock} · {item.warehouse}</option>)}</select></label>
      {selected && <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm">Stock actual en {selected.warehouse}: <strong>{selected.current_stock} unidades</strong></div>}
      <label className="block text-sm font-medium">Unidades a despachar o dar de baja<input required min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
      {insufficient && <Feedback kind="warning">La cantidad supera el stock actual ({selected?.current_stock} unidades). Reduce la cantidad para continuar.</Feedback>}
      <label className="block text-sm font-medium">Tipo de salida<select value={exitType} onChange={(event) => setExitType(event.target.value as ExitType)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="dispatch">Despacho a cliente</option><option value="loss">Pérdida confirmada</option></select></label>
      {trackingRequired && <label className="block text-sm font-medium">Número de seguimiento del transportista<input required value={tracking} onChange={(event) => setTracking(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" placeholder="1Z999AA10123456784" /></label>}
      {error && <Feedback kind="error">{error}</Feedback>}{success && <Feedback kind="success">{success}</Feedback>}
      <button disabled={busy || loadingProducts || !selected || insufficient} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Guardando…' : loadingProducts ? 'Cargando SKU…' : 'Registrar salida de stock'}</button>
    </form>
  </div></ProtectedPage>;
}
