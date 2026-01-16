import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { SegmentationResponse, Segment, ProductSegment } from '../types';

// Fallback mock data
const mockSegments: Segment[] = [
  { 
    id: 0, 
    name: 'Premium Buyers', 
    count: 234, 
    avgSpend: 458, 
    totalRevenue: 107172,
    color: 'hsl(168, 76%, 42%)',
    description: 'High-value customers with frequent large purchases'
  },
  { 
    id: 1, 
    name: 'Regular Customers', 
    count: 567, 
    avgSpend: 125, 
    totalRevenue: 70875,
    color: 'hsl(199, 89%, 48%)',
    description: 'Consistent buyers with moderate spending'
  },
  { 
    id: 2, 
    name: 'Occasional Shoppers', 
    count: 892, 
    avgSpend: 45, 
    totalRevenue: 40140,
    color: 'hsl(262, 83%, 58%)',
    description: 'Infrequent buyers with low average spend'
  },
  { 
    id: 3, 
    name: 'New Customers', 
    count: 345, 
    avgSpend: 78, 
    totalRevenue: 26910,
    color: 'hsl(38, 92%, 50%)',
    description: 'Recently acquired customers'
  },
];

const mockProducts: ProductSegment[] = [
  { product: 'Laptop Pro X1', quantity: 156, revenue: 155844, segment: 0 },
  { product: 'Wireless Earbuds', quantity: 892, revenue: 44600, segment: 1 },
  { product: 'Office Chair Deluxe', quantity: 234, revenue: 58266, segment: 0 },
  { product: 'Desk Organizer Set', quantity: 567, revenue: 14175, segment: 2 },
  { product: 'Smart Watch Series 5', quantity: 345, revenue: 103155, segment: 0 },
  { product: 'USB-C Hub', quantity: 678, revenue: 27120, segment: 1 },
  { product: 'Notebook Pack (12)', quantity: 1234, revenue: 12340, segment: 2 },
  { product: 'Monitor Stand Pro', quantity: 189, revenue: 17010, segment: 1 },
];

export const segmentationService = {
  // Get customer segments
  getSegments: async (): Promise<SegmentationResponse> => {
    try {
      return await apiClient<SegmentationResponse>(ENDPOINTS.segments);
    } catch (error) {
      console.warn('Backend unavailable, using mock data:', error);
      
      const totalCustomers = mockSegments.reduce((sum, s) => sum + s.count, 0);
      const totalRevenue = mockSegments.reduce((sum, s) => sum + s.totalRevenue, 0);
      
      return {
        segments: mockSegments,
        products: mockProducts,
        total_customers: totalCustomers,
        total_revenue: totalRevenue,
      };
    }
  },
};
