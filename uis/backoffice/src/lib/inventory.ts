import { getAccessToken } from './auth';
import type {
  InboundCreate,
  OutboundCreate,
  SKU,
  SKUCreate,
  StockOrder,
} from './types';

// Route requests through the same-origin Next.js server. This avoids browser
// access to the private API port URL in Codespaces and keeps CORS out of the path.
const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '/trackflow-api').replace(/\/$/, '');

export class InventoryApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

function readableError(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const messages = value.map((item) => {
      if (!item || typeof item !== 'object') return readableError(item);
      const error = item as { loc?: unknown[]; msg?: unknown; message?: unknown };
      const message = readableError(error.msg ?? error.message);
      return message ? `${Array.isArray(error.loc) ? `${error.loc.slice(1).join('.')}: ` : ''}${message}` : undefined;
    }).filter((item): item is string => Boolean(item));
    return messages.length ? messages.join('; ') : undefined;
  }
  if (value && typeof value === 'object') {
    const body = value as { detail?: unknown; message?: unknown; error?: unknown; msg?: unknown };
    const direct = readableError(body.detail ?? body.message ?? body.error ?? body.msg);
    if (direct) return direct;
  }
  return undefined;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new InventoryApiError(401, 'No hay una sesión activa. Inicia sesión para continuar.');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new InventoryApiError(0, `No se pudo conectar con la API (${API_BASE}). Comprueba que el backend esté ejecutándose.`);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let message: string | undefined;
    try {
      const body: unknown = JSON.parse(raw);
      if (body && typeof body === 'object') {
        message = readableError(body);
      }
    } catch {
      message = raw.trim() || undefined;
    }
    throw new InventoryApiError(response.status, `Error ${response.status}: ${message || response.statusText || 'No se recibió un mensaje de error.'}`);
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
