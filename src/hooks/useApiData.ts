import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ForecastResponse, SegmentationResponse, BasketResponse, AlertsResponse } from '@/lib/api/types';

// Query Keys
export const queryKeys = {
  health: ['health'],
  forecast: (days: number) => ['forecast', days],
  segments: ['segments'],
  basket: ['basket'],
  basketSearch: (product: string) => ['basket', 'search', product],
  alerts: ['alerts'],
};

// Helper to call edge functions with auth
const callEdgeFunction = async <T>(functionName: string, params?: Record<string, string>): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}${queryString}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
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
    queryFn: () => callEdgeFunction<ForecastResponse>('forecast', { days: String(days) }),
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
    queryFn: () => callEdgeFunction<BasketResponse>('basket', { product }),
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
