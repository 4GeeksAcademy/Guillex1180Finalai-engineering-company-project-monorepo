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
    throw new InventoryApiError(0, 'No se pudo conectar con el servicio de inventario. Comprueba tu conexión e inténtalo de nuevo.');
  }

  if (!response.ok) {
    const message = response.status === 401
      ? 'Tu sesión ha caducado. Inicia sesión de nuevo e inténtalo otra vez.'
      : response.status === 403
        ? 'No tienes permiso para realizar esta acción.'
        : response.status === 404
          ? 'No se encontró el elemento solicitado. Actualiza la página e inténtalo de nuevo.'
          : response.status >= 500
            ? 'El servicio de inventario no está disponible en este momento. Inténtalo de nuevo más tarde.'
            : 'No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.';
    throw new InventoryApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new InventoryApiError(0, 'El servicio devolvió una respuesta inesperada. Actualiza la página e inténtalo de nuevo.');
  }
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
