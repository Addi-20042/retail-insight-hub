import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { AlertsResponse } from '../types';

export const alertsService = {
  // Get all alerts from backend
  getAlerts: async (): Promise<AlertsResponse> => {
    return await apiClient<AlertsResponse>(ENDPOINTS.alerts);
  },
};
