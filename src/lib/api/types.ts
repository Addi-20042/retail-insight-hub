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

// Health Check
export interface HealthResponse {
  status: 'ok' | 'error';
  database: boolean;
  models_loaded: boolean;
  version: string;
}
