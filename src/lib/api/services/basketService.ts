import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { BasketResponse } from '../types';

export const basketService = {
  // Get all association rules from backend
  getAllRules: async (): Promise<BasketResponse> => {
    return await apiClient<BasketResponse>(ENDPOINTS.basket);
  },

  // Search for product associations from backend
  searchProduct: async (product: string): Promise<BasketResponse> => {
    return await apiClient<BasketResponse>(`${ENDPOINTS.basket}/${encodeURIComponent(product)}`);
  },
};
