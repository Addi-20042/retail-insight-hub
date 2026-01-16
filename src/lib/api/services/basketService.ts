import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { BasketResponse, AssociationRule } from '../types';

// Fallback mock data
const mockRules: AssociationRule[] = [
  { productA: 'Laptop', productB: 'Laptop Bag', support: 0.42, confidence: 0.78, lift: 2.3 },
  { productA: 'Smartphone', productB: 'Screen Protector', support: 0.38, confidence: 0.85, lift: 2.8 },
  { productA: 'Coffee Maker', productB: 'Coffee Beans', support: 0.35, confidence: 0.72, lift: 2.1 },
  { productA: 'Camera', productB: 'Memory Card', support: 0.31, confidence: 0.89, lift: 3.2 },
  { productA: 'Running Shoes', productB: 'Sports Socks', support: 0.28, confidence: 0.65, lift: 1.9 },
  { productA: 'Tablet', productB: 'Tablet Case', support: 0.33, confidence: 0.81, lift: 2.5 },
  { productA: 'Headphones', productB: 'Headphone Stand', support: 0.22, confidence: 0.58, lift: 1.7 },
  { productA: 'Gaming Console', productB: 'Extra Controller', support: 0.29, confidence: 0.74, lift: 2.4 },
  { productA: 'Printer', productB: 'Ink Cartridge', support: 0.45, confidence: 0.92, lift: 3.5 },
  { productA: 'Yoga Mat', productB: 'Yoga Blocks', support: 0.19, confidence: 0.54, lift: 1.6 },
];

export const basketService = {
  // Get all association rules
  getAllRules: async (): Promise<BasketResponse> => {
    try {
      return await apiClient<BasketResponse>(ENDPOINTS.basket);
    } catch (error) {
      console.warn('Backend unavailable, using mock data:', error);
      
      return {
        rules: mockRules,
        avg_confidence: mockRules.reduce((sum, r) => sum + r.confidence, 0) / mockRules.length,
        avg_lift: mockRules.reduce((sum, r) => sum + r.lift, 0) / mockRules.length,
      };
    }
  },

  // Search for product associations
  searchProduct: async (product: string): Promise<BasketResponse> => {
    try {
      return await apiClient<BasketResponse>(`${ENDPOINTS.basket}/${encodeURIComponent(product)}`);
    } catch (error) {
      console.warn('Backend unavailable, using mock data:', error);
      
      const filtered = product 
        ? mockRules.filter(
            r => r.productA.toLowerCase().includes(product.toLowerCase()) ||
                 r.productB.toLowerCase().includes(product.toLowerCase())
          )
        : mockRules;
      
      return {
        rules: filtered,
        avg_confidence: filtered.length > 0 
          ? filtered.reduce((sum, r) => sum + r.confidence, 0) / filtered.length 
          : 0,
        avg_lift: filtered.length > 0 
          ? filtered.reduce((sum, r) => sum + r.lift, 0) / filtered.length 
          : 0,
      };
    }
  },
};
