'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Feedback from '@/components/Feedback';
import ProtectedPage from '@/components/ProtectedPage';
import {
  SUPPLIER_CATEGORIES,
  suppliersApi,
  type SupplierRecord,
  type SupplierCategory,
  type SupplierCountry,
  type SupplierCreate,
  type SupplierStatus,
} from '@/lib/suppliers';

const blankForm: SupplierCreate = {
  name: '', country: 'USA', categories: [], rate_per_shipment: 0,
  currency: 'USD', status: 'active', service_zone: '', contact_email: '', notes: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [country, setCountry] = useState<SupplierCountry | ''>('');
  const [category, setCategory] = useState<SupplierCategory | ''>('');
  const [form, setForm] = useState<SupplierCreate>(blankForm);
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [pendingRows, setPendingRows] = useState<Record<string, 'rate' | 'status' | undefined>>({});

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await suppliersApi.list({ country: country || undefined, category: category || undefined });
      setSuppliers(result);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el directorio de proveedores.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [country, category]);

  useEffect(() => { void loadSuppliers(); }, [loadSuppliers]);

  const categoryOptions = useMemo(() => SUPPLIER_CATEGORIES.map((value) => ({ value, label: formatCategory(value) })), []);

  function changeCountry(value: SupplierCountry) {
    setForm((current) => ({ ...current, country: value, currency: value === 'USA' ? 'USD' : 'EUR' }));
  }

  function toggleCategory(value: SupplierCategory) {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(value)
        ? current.categories.filter((item) => item !== value)
        : [...current.categories, value],
    }));
  }

  async function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    setRefreshError('');
    try {
      const payload: SupplierCreate = {
        ...form,
        name: form.name.trim(),
        rate_per_shipment: Number(form.rate_per_shipment),
        ...(form.service_zone?.trim() ? { service_zone: form.service_zone.trim() } : { service_zone: undefined }),
        ...(form.contact_email?.trim() ? { contact_email: form.contact_email.trim() } : { contact_email: undefined }),
        ...(form.notes?.trim() ? { notes: form.notes.trim() } : { notes: undefined }),
      };
      const created = await suppliersApi.create(payload);
      setForm(blankForm);
      if (await loadSuppliers()) setMessage(`Proveedor “${created.name}” registrado correctamente.`);
      else {
        setMessage(`Proveedor “${created.name}” creado correctamente.`);
        setRefreshError('No se pudo actualizar el directorio. Reintenta la carga para ver los cambios.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La API rechazó el proveedor. Revisa los campos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function saveRate(supplier: SupplierRecord) {
    const rawRate = rateDrafts[supplier.id] ?? String(supplier.rate_per_shipment);
    const rate = Number(rawRate);
    setRowErrors((current) => ({ ...current, [supplier.id]: '' }));
    if (!Number.isFinite(rate) || rate <= 0) {
      setRowErrors((current) => ({ ...current, [supplier.id]: 'La tarifa debe ser un número mayor que cero.' }));
      return;
    }
    setPendingRows((current) => ({ ...current, [supplier.id]: 'rate' }));
    try {
      const updated = await suppliersApi.updateRate(supplier.id, rate);
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setRateDrafts((current) => ({ ...current, [supplier.id]: String(updated.rate_per_shipment) }));
      setRowErrors((current) => ({ ...current, [supplier.id]: '' }));
      setMessage(`Tarifa de ${updated.name} actualizada.`);
    } catch (reason) {
      setRowErrors((current) => ({ ...current, [supplier.id]: reason instanceof Error ? reason.message : 'No se pudo actualizar la tarifa.' }));
    } finally {
      setPendingRows((current) => ({ ...current, [supplier.id]: undefined }));
    }
  }

  async function changeStatus(supplier: SupplierRecord) {
    const nextStatus: SupplierStatus = supplier.status === 'active' ? 'suspended' : 'active';
    setRowErrors((current) => ({ ...current, [supplier.id]: '' }));
    setPendingRows((current) => ({ ...current, [supplier.id]: 'status' }));
    try {
      const updated = await suppliersApi.updateStatus(supplier.id, nextStatus);
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${updated.name} ahora está ${nextStatus === 'active' ? 'activo' : 'suspendido'}.`);
    } catch (reason) {
      setRowErrors((current) => ({ ...current, [supplier.id]: reason instanceof Error ? reason.message : 'No se pudo cambiar el estado.' }));
    } finally {
      setPendingRows((current) => ({ ...current, [supplier.id]: undefined }));
    }
  }

  return <ProtectedPage>
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">TrackFlow · Operaciones</p>
      <h1 className="mt-1 text-3xl font-bold">Directorio de proveedores</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Consulta y administra proveedores de USA y España, sus categorías, tarifas vigentes y estado operativo.</p>
    </div>

    {(error || refreshError) && <div className="mt-5 space-y-2"><Feedback kind="error">{refreshError || error}</Feedback><button type="button" onClick={() => { setRefreshError(''); void loadSuppliers(); }} disabled={loading} className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">{loading ? 'Actualizando…' : 'Reintentar carga'}</button></div>}
    {message && <div className="mt-5"><Feedback kind="success">{message}</Feedback></div>}

    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="supplier-create-title">
      <h2 id="supplier-create-title" className="text-lg font-semibold">Registrar proveedor</h2>
      <form onSubmit={submitSupplier} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">Nombre comercial
          <input required minLength={1} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">País
          <select value={form.country} onChange={(event) => changeCountry(event.target.value as SupplierCountry)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="USA">USA</option><option value="Spain">Spain</option></select>
        </label>
        <label className="text-sm font-medium text-slate-700">Tarifa por envío ({form.currency})
          <input required type="number" min="0.000001" step="any" value={form.rate_per_shipment || ''} onChange={(event) => setForm((current) => ({ ...current, rate_per_shipment: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <fieldset className="md:col-span-2 xl:col-span-3">
          <legend className="text-sm font-medium text-slate-700">Categorías (selecciona al menos una)</legend>
          <div className="mt-2 flex flex-wrap gap-2">{categoryOptions.map(({ value, label }) => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={form.categories.includes(value)} onChange={() => toggleCategory(value)} />{label}</label>)}</div>
        </fieldset>
        <label className="text-sm font-medium text-slate-700">Zona de servicio (opcional)
          <input value={form.service_zone ?? ''} onChange={(event) => setForm((current) => ({ ...current, service_zone: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">Email de contacto (opcional)
          <input type="email" value={form.contact_email ?? ''} onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">Notas (opcional)
          <input value={form.notes ?? ''} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-700">Estado inicial
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SupplierStatus }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="active">Activo</option><option value="suspended">Suspendido</option></select>
        </label>
        <div className="md:col-span-2 xl:col-span-3"><button type="submit" disabled={saving || form.categories.length === 0} className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">{saving ? 'Guardando…' : 'Registrar proveedor'}</button></div>
      </form>
    </section>

    <section className="mt-7" aria-labelledby="supplier-directory-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 id="supplier-directory-title" className="text-2xl font-bold">Proveedores</h2><p className="mt-1 text-sm text-slate-600">{loading ? 'Cargando directorio…' : `${suppliers.length} proveedor${suppliers.length === 1 ? '' : 'es'}`}</p></div>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-medium text-slate-700">País<select value={country} onChange={(event) => setCountry(event.target.value as SupplierCountry | '')} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Todos</option><option value="USA">USA</option><option value="Spain">Spain</option></select></label>
          <label className="text-sm font-medium text-slate-700">Categoría<select value={category} onChange={(event) => setCategory(event.target.value as SupplierCategory | '')} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Todas</option>{categoryOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">País</th><th className="px-4 py-3">Categorías</th><th className="px-4 py-3">Tarifa</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Cargando proveedores…</td></tr>
                : suppliers.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay proveedores para estos filtros.</td></tr>
                  : suppliers.map((supplier) => <tr key={supplier.id} className={supplier.status === 'suspended' ? 'bg-slate-50 text-slate-500' : ''}>
                    <td className="px-4 py-4"><div className={`font-semibold ${supplier.status === 'active' ? 'text-slate-900' : 'text-slate-600'}`}>{supplier.name}</div>{supplier.service_zone && <div className="mt-1 text-xs">{supplier.service_zone}</div>}</td>
                    <td className="px-4 py-4">{supplier.country}</td>
                    <td className="px-4 py-4"><div className="flex max-w-md flex-wrap gap-1">{supplier.categories.map((item) => <span key={item} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">{formatCategory(item)}</span>)}</div></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2"><input aria-label={`Nueva tarifa para ${supplier.name}`} type="number" min="0.000001" step="any" value={rateDrafts[supplier.id] ?? supplier.rate_per_shipment} onChange={(event) => setRateDrafts((current) => ({ ...current, [supplier.id]: event.target.value }))} className="w-28 rounded border border-slate-300 px-2 py-1 text-slate-900" /><span>{supplier.currency}</span><button type="button" onClick={() => void saveRate(supplier)} disabled={pendingRows[supplier.id] !== undefined} className="rounded border border-blue-700 px-2 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50">{pendingRows[supplier.id] === 'rate' ? 'Guardando…' : 'Guardar'}</button></div>{rowErrors[supplier.id] && <p role="alert" className="mt-1 max-w-xs text-xs text-red-700">{rowErrors[supplier.id]}</p>}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{supplier.status === 'active' ? 'Activo' : 'Suspendido'}</span></td>
                    <td className="px-4 py-4"><button type="button" onClick={() => void changeStatus(supplier)} disabled={pendingRows[supplier.id] !== undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${supplier.status === 'active' ? 'border border-amber-600 text-amber-900 hover:bg-amber-50' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>{pendingRows[supplier.id] === 'status' ? 'Actualizando…' : supplier.status === 'active' ? 'Suspender' : 'Activar'}</button></td>
                  </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </ProtectedPage>;
}

function formatCategory(category: SupplierCategory): string {
  return category.replaceAll('_', ' ');
}
