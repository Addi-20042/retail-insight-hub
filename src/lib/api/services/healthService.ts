import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { HealthResponse } from '../types';

export const healthService = {
  // Check backend health
  checkHealth: async (): Promise<HealthResponse> => {
    try {
      return await apiClient<HealthResponse>(ENDPOINTS.health, { skipAuth: true });
    } catch {
      return {
        status: 'error',
        database: false,
        models_loaded: false,
        version: 'unknown',
      };
    }
  },
};
