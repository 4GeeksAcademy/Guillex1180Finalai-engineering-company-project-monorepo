export type Warehouse = 'LA' | 'ZGZ';
export type Category = 'fashion' | 'electronics' | 'cosmetics';
export type ExitType = 'dispatch' | 'loss';

export interface SKU {
  id: number;
  name: string;
  sku: string;
  client_name: string;
  category: Category | string;
  warehouse: Warehouse;
  current_stock: number;
}

export interface StockEntry {
  id: number;
  sku_id: number;
  quantity: number;
  reference: string;
  warehouse: Warehouse;
  created_at: string;
  user_uuid: string;
  sku?: SKU;
}

export interface StockExit {
  id: number;
  sku_id: number;
  quantity: number;
  exit_type: ExitType;
  tracking_number: string | null;
  warehouse: Warehouse;
  created_at: string;
  user_uuid: string;
  sku?: SKU;
}

export interface StockOrder {
  id: number;
  order_type?: 'inbound' | 'entry' | 'outbound' | 'exit';
  sku_id: number;
  sku_code?: string;
  quantity: number;
  warehouse: Warehouse;
  created_at: string;
  user_uuid: string;
  sku?: SKU;
  exit_type?: ExitType;
  tracking_number?: string | null;
  reference?: string;
}

export interface SKUCreate {
  name: string;
  sku: string;
  client_name: string;
  category: Category;
  warehouse: Warehouse;
}

export interface InboundCreate {
  sku_id: number;
  quantity: number;
  reference: string;
  warehouse: Warehouse;
  user_uuid: string;
}

export interface OutboundCreate {
  sku_id: number;
  quantity: number;
  exit_type: ExitType;
  tracking_number: string | null;
  warehouse: Warehouse;
  user_uuid: string;
}
