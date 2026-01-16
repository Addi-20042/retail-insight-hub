import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  forecastService, 
  segmentationService, 
  basketService, 
  alertsService, 
  uploadService,
  healthService 
} from '@/lib/api';

// Query Keys
export const queryKeys = {
  health: ['health'],
  forecast: (days: number) => ['forecast', days],
  segments: ['segments'],
  basket: ['basket'],
  basketSearch: (product: string) => ['basket', 'search', product],
  alerts: ['alerts'],
};

// Health Check Hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthService.checkHealth(),
    staleTime: 30000, // 30 seconds
    retry: false,
  });
};

// Sales Forecast Hook
export const useForecast = (days: number) => {
  return useQuery({
    queryKey: queryKeys.forecast(days),
    queryFn: () => forecastService.getForecast(days),
    staleTime: 60000, // 1 minute
  });
};

// Customer Segmentation Hook
export const useSegmentation = () => {
  return useQuery({
    queryKey: queryKeys.segments,
    queryFn: () => segmentationService.getSegments(),
    staleTime: 300000, // 5 minutes
  });
};

// Market Basket Analysis Hooks
export const useBasketRules = () => {
  return useQuery({
    queryKey: queryKeys.basket,
    queryFn: () => basketService.getAllRules(),
    staleTime: 300000, // 5 minutes
  });
};

export const useBasketSearch = (product: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.basketSearch(product),
    queryFn: () => basketService.searchProduct(product),
    enabled: enabled,
    staleTime: 60000, // 1 minute
  });
};

// Alerts Hook
export const useAlerts = () => {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => alertsService.getAlerts(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// File Upload Hook
export const useFileUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadFile(file),
    onSuccess: () => {
      // Invalidate all data queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.segments });
      queryClient.invalidateQueries({ queryKey: queryKeys.basket });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
};
