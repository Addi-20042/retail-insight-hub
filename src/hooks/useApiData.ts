import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ForecastResponse,
  SegmentationResponse,
  BasketResponse,
  AlertsResponse,
  PosActionResponse,
  PosScanResponse,
} from '@/lib/api/types';

// Query Keys
export const queryKeys = {
  health: ['health'],
  forecast: (days: number) => ['forecast', days],
  segments: ['segments'],
  basket: ['basket'],
  basketSearch: (product: string) => ['basket', 'search', product],
  alerts: ['alerts'],
  products: ['products'],
  posTransaction: ['pos', 'transaction'],
  posItems: (transactionId?: string | null) => ['pos', 'items', transactionId ?? 'none'],
};

const getRpcErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const ensureRpcResult = <T extends { ok?: boolean; error?: string }>(data: T | null, fallback: string): T => {
  if (!data) {
    throw new Error(fallback);
  }

  return data;
};

// Helper to call edge functions with auth
const callEdgeFunction = async <T>(
  functionName: string,
  options?: {
    method?: 'GET' | 'POST';
    params?: Record<string, string>;
    body?: unknown;
  }
): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const queryString = options?.params ? '?' + new URLSearchParams(options.params).toString() : '';
  const method = options?.method ?? 'GET';
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}${queryString}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: method === 'POST' ? JSON.stringify(options?.body ?? {}) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `Function error: ${response.status}`);
  }

  return response.json();
};

// Sales Forecast Hook
export const useForecast = (days: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.forecast(days),
    queryFn: () => callEdgeFunction<ForecastResponse>('forecast', { params: { days: String(days) } }),
    staleTime: 60000,
    enabled: !!user,
    retry: 1,
  });
};

// Customer Segmentation Hook
export const useSegmentation = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.segments,
    queryFn: () => callEdgeFunction<SegmentationResponse>('segments'),
    staleTime: 300000,
    enabled: !!user,
    retry: 1,
  });
};

// Market Basket Analysis Hooks
export const useBasketRules = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.basket,
    queryFn: () => callEdgeFunction<BasketResponse>('basket'),
    staleTime: 300000,
    enabled: !!user,
    retry: 1,
  });
};

export const useBasketSearch = (product: string, enabled: boolean = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.basketSearch(product),
    queryFn: () => callEdgeFunction<BasketResponse>('basket', { params: { product } }),
    enabled: enabled && !!user && !!product,
    staleTime: 60000,
    retry: 1,
  });
};

// Alerts Hook
export const useAlerts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => callEdgeFunction<AlertsResponse>('alerts'),
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: !!user,
    retry: 1,
  });
};

// Health Check Hook (just checks Supabase connectivity)
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => {
      try {
        const { error } = await supabase.from('sales_data').select('id').limit(1);
        return {
          status: error ? 'error' as const : 'ok' as const,
          database: !error,
          models_loaded: true,
          version: '2.0.0',
        };
      } catch {
        return { status: 'error' as const, database: false, models_loaded: false, version: 'unknown' };
      }
    },
    staleTime: 30000,
    retry: false,
  });
};

// Send Report Hook
export const useSendReport = () => {
  return useMutation({
    mutationFn: async ({ reportType, recipients, reportName }: { 
      reportType: string; recipients: string[]; reportName: string 
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ reportType, recipients, reportName }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || 'Failed to send report');
      }

      return response.json();
    },
  });
};

// File Upload Hook (reusing existing mutation but invalidating edge function queries too)
export const useFileUpload = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAnalytics: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.segments });
      queryClient.invalidateQueries({ queryKey: queryKeys.basket });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  };
};

const invalidateRetailQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['sales_data'] });
  queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
  queryClient.invalidateQueries({ queryKey: ['activity_log'] });
  queryClient.invalidateQueries({ queryKey: ['forecast'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.segments });
  queryClient.invalidateQueries({ queryKey: queryKeys.basket });
  queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
  queryClient.invalidateQueries({ queryKey: queryKeys.products });
  queryClient.invalidateQueries({ queryKey: queryKeys.posTransaction });
  queryClient.invalidateQueries({ queryKey: ['pos', 'items'] });
};

const startPosTransactionRpc = async (payload?: {
  customer_id?: string;
  cashier_name?: string;
  device_id?: string;
}) => {
  const { data, error } = await supabase.rpc('start_pos_transaction', {
    p_customer_id: payload?.customer_id ?? null,
    p_cashier_name: payload?.cashier_name ?? null,
    p_device_id: payload?.device_id ?? null,
  });

  if (error) {
    throw new Error(getRpcErrorMessage(error, 'Unable to start transaction'));
  }

  return ensureRpcResult(data as PosActionResponse | null, 'Unable to start transaction');
};

const scanPosBarcodeRpc = async (payload: {
  barcode: string;
  quantity?: number;
  transaction_id?: string | null;
  customer_id?: string;
  cashier_name?: string;
  device_id?: string;
  scan_id?: string;
}) => {
  const { data, error } = await supabase.rpc('process_pos_scan', {
    p_barcode: payload.barcode,
    p_quantity: payload.quantity ?? 1,
    p_transaction_id: payload.transaction_id ?? null,
    p_customer_id: payload.customer_id ?? null,
    p_cashier_name: payload.cashier_name ?? null,
    p_device_id: payload.device_id ?? null,
    p_scan_id: payload.scan_id ?? null,
  });

  if (error) {
    throw new Error(getRpcErrorMessage(error, 'Scan failed'));
  }

  return ensureRpcResult(data as PosScanResponse | null, 'Scan failed');
};

const completePosTransactionRpc = async (transactionId: string) => {
  const { data, error } = await supabase.rpc('complete_pos_transaction', {
    p_transaction_id: transactionId,
  });

  if (error) {
    throw new Error(getRpcErrorMessage(error, 'Unable to complete transaction'));
  }

  return ensureRpcResult(data as PosActionResponse | null, 'Unable to complete transaction');
};

const cancelPosTransactionRpc = async (transactionId: string) => {
  const { data, error } = await supabase.rpc('cancel_pos_transaction', {
    p_transaction_id: transactionId,
  });

  if (error) {
    throw new Error(getRpcErrorMessage(error, 'Unable to cancel transaction'));
  }

  return ensureRpcResult(data as PosActionResponse | null, 'Unable to cancel transaction');
};

const seedDemoProductsRpc = async () => {
  const { data, error } = await supabase.rpc('seed_demo_products');

  if (error) {
    throw new Error(getRpcErrorMessage(error, 'Unable to seed demo products'));
  }

  return ensureRpcResult(data as PosActionResponse | null, 'Unable to seed demo products');
};

export const useStartPosTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startPosTransactionRpc,
    onSuccess: () => invalidateRetailQueries(queryClient),
  });
};

export const useScanPosBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scanPosBarcodeRpc,
    onSuccess: () => invalidateRetailQueries(queryClient),
  });
};

export const useCompletePosTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completePosTransactionRpc,
    onSuccess: () => invalidateRetailQueries(queryClient),
  });
};

export const useCancelPosTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPosTransactionRpc,
    onSuccess: () => invalidateRetailQueries(queryClient),
  });
};

export const useSeedDemoProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seedDemoProductsRpc,
    onSuccess: () => invalidateRetailQueries(queryClient),
  });
};
