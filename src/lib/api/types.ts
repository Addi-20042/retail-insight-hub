// User & Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GoogleAuthPayload {
  id_token: string;
}

// Sales Forecast Types
export interface ForecastData {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface ForecastResponse {
  data: ForecastData[];
  total_predicted: number;
  avg_daily: number;
  trend: 'upward' | 'downward';
}

// Customer Segmentation Types
export interface Segment {
  id: number;
  name: string;
  count: number;
  avgSpend: number;
  totalRevenue: number;
  description: string;
  color: string;
}

export interface ProductSegment {
  product: string;
  quantity: number;
  revenue: number;
  segment: number;
}

export interface SegmentationResponse {
  segments: Segment[];
  products: ProductSegment[];
  total_customers: number;
  total_revenue: number;
}

// Market Basket Analysis Types
export interface AssociationRule {
  productA: string;
  productB: string;
  support: number;
  confidence: number;
  lift: number;
}

export interface BasketResponse {
  rules: AssociationRule[];
  avg_confidence: number;
  avg_lift: number;
}

// Alerts Types
export interface Alert {
  id: number;
  type: 'spike' | 'drop' | 'pattern' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AlertsResponse {
  alerts: Alert[];
  high_count: number;
  medium_count: number;
  low_count: number;
}

// Data Upload Types
export interface UploadResponse {
  success: boolean;
  message: string;
  rows_processed: number;
  models_retrained: string[];
}

// POS / Realtime Scanning Types
export interface ProductRecord {
  id: string;
  user_id: string;
  barcode: string;
  sku: string | null;
  name: string;
  category: string | null;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosTransactionRecord {
  id: string;
  user_id: string;
  transaction_number: string;
  customer_id: string | null;
  cashier_name: string | null;
  device_id: string | null;
  status: 'open' | 'completed' | 'cancelled';
  item_count: number;
  total_amount: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosTransactionItemRecord {
  id: string;
  user_id: string;
  transaction_id: string;
  product_id: string;
  barcode: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  scan_id: string | null;
  scanned_at: string;
  created_at: string;
}

export interface PosActionResponse {
  ok: boolean;
  error?: string;
  message?: string;
  transaction?: PosTransactionRecord;
  restored_items?: number;
  seeded?: number;
}

export interface PosScanResponse extends PosActionResponse {
  duplicate?: boolean;
  item?: PosTransactionItemRecord;
  product?: {
    id: string;
    name: string;
    barcode: string;
    remaining_stock: number;
  };
  available_stock?: number;
}

// Health Check
export interface HealthResponse {
  status: 'ok' | 'error';
  database: boolean;
  models_loaded: boolean;
  version: string;
}
