import { getAccessToken } from './auth';

export const SUPPLIER_CATEGORIES = [
  'carrier_last_mile',
  'carrier_international',
  'warehouse_supplies',
  'packaging_materials',
  'reverse_logistics',
  'fleet_maintenance',
  'it_and_wms_software',
  'cleaning_and_facilities',
] as const;

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];
export type SupplierCountry = 'USA' | 'Spain';
export type SupplierStatus = 'active' | 'suspended';
export type SupplierCurrency = 'USD' | 'EUR';

export interface Supplier {
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  updated_at: string;
  status: SupplierStatus;
  service_zone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

export interface SupplierRecord extends Supplier {
  id: string;
}

export interface SupplierCreate {
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  status: SupplierStatus;
  service_zone?: string;
  contact_email?: string;
  notes?: string;
}

export type SupplierRateUpdate = Pick<Supplier, 'rate_per_shipment'>;
export type SupplierStatusUpdate = Pick<Supplier, 'status'>;

const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '/trackflow-api').replace(/\/$/, '');

export class SuppliersApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'SuppliersApiError';
  }
}

function errorMessage(raw: string, fallback: string): string {
  try {
    const body: unknown = JSON.parse(raw);
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((item) => item && typeof item === 'object' && 'msg' in item ? String((item as { msg: unknown }).msg) : String(item)).join('; ');
      }
    }
  } catch {
    if (raw.trim()) return raw.trim();
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new SuppliersApiError(401, 'No hay una sesión activa. Inicia sesión para continuar.');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new SuppliersApiError(0, `No se pudo conectar con la API (${API_BASE}). Comprueba que el backend esté ejecutándose.`);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    throw new SuppliersApiError(response.status, `Error ${response.status}: ${errorMessage(raw, response.statusText || 'Solicitud rechazada.')}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const suppliersApi = {
  list: (filters: { country?: SupplierCountry; category?: SupplierCategory; status?: SupplierStatus } = {}) => {
    const query = new URLSearchParams();
    if (filters.country) query.set('country', filters.country);
    if (filters.category) query.set('category', filters.category);
    if (filters.status) query.set('status', filters.status);
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<SupplierRecord[]>(`/suppliers${suffix}`);
  },
  create: (supplier: SupplierCreate) => request<SupplierRecord>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  }),
  updateRate: (id: string, rate_per_shipment: SupplierRateUpdate['rate_per_shipment']) => request<SupplierRecord>(`/suppliers/${encodeURIComponent(id)}/rate`, {
    method: 'PATCH',
    body: JSON.stringify({ rate_per_shipment }),
  }),
  updateStatus: (id: string, status: SupplierStatusUpdate['status']) => request<SupplierRecord>(`/suppliers/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};
