import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { AlertsResponse, Alert } from '../types';

// Fallback mock data
const mockAlerts: Alert[] = [
  {
    id: 1,
    type: 'spike',
    title: 'Sales Spike Detected',
    message: 'Electronics category experienced a 45% increase in sales compared to the weekly average. This may indicate seasonal demand or successful marketing campaign.',
    timestamp: '2 hours ago',
    category: 'Electronics',
    severity: 'high'
  },
  {
    id: 2,
    type: 'drop',
    title: 'Sudden Sales Drop',
    message: 'Furniture category sales have dropped by 28% compared to the previous week. Consider reviewing pricing strategy or checking for supply chain issues.',
    timestamp: '5 hours ago',
    category: 'Furniture',
    severity: 'high'
  },
  {
    id: 3,
    type: 'pattern',
    title: 'New Buying Pattern',
    message: 'Customers purchasing laptops are now 35% more likely to also buy extended warranties. Consider creating a bundle offer.',
    timestamp: '1 day ago',
    category: 'Electronics',
    severity: 'medium'
  },
  {
    id: 4,
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Popular items in Sports category are running low. Based on current demand forecast, stock will deplete in 5 days.',
    timestamp: '1 day ago',
    category: 'Sports',
    severity: 'medium'
  },
  {
    id: 5,
    type: 'spike',
    title: 'Weekend Performance',
    message: 'Weekend sales outperformed weekday sales by 62% this week. Consider adjusting staff schedules and inventory.',
    timestamp: '2 days ago',
    category: 'All Categories',
    severity: 'low'
  },
  {
    id: 6,
    type: 'pattern',
    title: 'Customer Segment Shift',
    message: 'Premium buyer segment has grown by 12% this month. These customers show higher loyalty and average order value.',
    timestamp: '3 days ago',
    category: 'Customer Analysis',
    severity: 'low'
  },
];

export const alertsService = {
  // Get all alerts
  getAlerts: async (): Promise<AlertsResponse> => {
    try {
      return await apiClient<AlertsResponse>(ENDPOINTS.alerts);
    } catch (error) {
      console.warn('Backend unavailable, using mock data:', error);
      
      return {
        alerts: mockAlerts,
        high_count: mockAlerts.filter(a => a.severity === 'high').length,
        medium_count: mockAlerts.filter(a => a.severity === 'medium').length,
        low_count: mockAlerts.filter(a => a.severity === 'low').length,
      };
    }
  },
};
