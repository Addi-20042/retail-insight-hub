import { apiClient } from '../client';
import { ENDPOINTS } from '../config';
import type { ForecastResponse, ForecastData } from '../types';

// Fallback mock data when backend is unavailable
const generateMockForecastData = (days: number): ForecastData[] => {
  const data: ForecastData[] = [];
  const baseDate = new Date();
  const baseValue = 12000;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    const variance = Math.sin(i * 0.5) * 2000 + Math.random() * 1500;
    const trend = i * 50;
    const predicted = Math.round(baseValue + variance + trend);
    const confidence = Math.round(predicted * 0.1);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted,
      lower: predicted - confidence,
      upper: predicted + confidence,
    });
  }
  return data;
};

export const forecastService = {
  // Get sales forecast
  getForecast: async (days: number): Promise<ForecastResponse> => {
    try {
      return await apiClient<ForecastResponse>(`${ENDPOINTS.forecast}?days=${days}`);
    } catch (error) {
      console.warn('Backend unavailable, using mock data:', error);
      
      // Return mock data for demo purposes
      const data = generateMockForecastData(days);
      const total = data.reduce((sum, d) => sum + d.predicted, 0);
      
      return {
        data,
        total_predicted: total,
        avg_daily: Math.round(total / days),
        trend: data[data.length - 1].predicted > data[0].predicted ? 'upward' : 'downward',
      };
    }
  },
};
