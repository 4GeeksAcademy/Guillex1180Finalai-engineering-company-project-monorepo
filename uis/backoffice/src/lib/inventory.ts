import { getAccessToken } from './auth';
import type {
  InboundCreate,
  OutboundCreate,
  SKU,
  SKUCreate,
  StockOrder,
} from './types';

const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class InventoryApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new InventoryApiError(0, `No se pudo conectar con la API (${API_BASE}). Comprueba que el backend esté ejecutándose.`);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let message = raw || response.statusText || 'Error desconocido';
    try {
      const body: unknown = JSON.parse(raw);
      if (body && typeof body === 'object') {
        const errorBody = body as { detail?: unknown; message?: unknown; error?: unknown };
        const candidate = errorBody.detail ?? errorBody.message ?? errorBody.error;
        if (typeof candidate === 'string') message = candidate;
        else if (candidate !== undefined) message = JSON.stringify(candidate);
      }
    } catch {
      // Preserve plain-text API errors as-is.
    }
    throw new InventoryApiError(response.status, `Error ${response.status}: ${message}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const inventoryApi = {
  listSKUs: async () => {
    const result = await request<SKU[] | { products: SKU[] }>('/inventory/products');
    return Array.isArray(result) ? result : result.products;
  },
  getSKU: (id: number) => request<SKU>(`/inventory/products/${id}`),
  createSKU: (data: SKUCreate) => request<SKU>('/inventory/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createInbound: (data: InboundCreate) => request('/inventory/orders/inbound', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createOutbound: (data: OutboundCreate) => request('/inventory/orders/outbound', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listOrders: async () => {
    const result = await request<StockOrder[] | { orders: StockOrder[] }>('/inventory/orders');
    return Array.isArray(result) ? result : result.orders;
  },
};
