import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { ForecastResponse } from '../types';

export const forecastService = {
  // Get sales forecast from backend
  getForecast: async (days: number): Promise<ForecastResponse> => {
    return await apiClient<ForecastResponse>(`${ENDPOINTS.forecast}?days=${days}`);
  },
};
