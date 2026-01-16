// Flask Backend Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// API Endpoints
export const ENDPOINTS = {
  // Health
  health: '/health',
  
  // Authentication
  auth: {
    google: '/auth/google',
    verify: '/auth/verify',
    logout: '/auth/logout',
  },
  
  // Analytics
  forecast: '/forecast',
  segments: '/segments',
  basket: '/basket',
  alerts: '/alerts',
  
  // Data
  upload: '/upload',
};

// Get stored JWT token
export const getToken = (): string | null => {
  return localStorage.getItem('retailmind_token');
};

// Set JWT token
export const setToken = (token: string): void => {
  localStorage.setItem('retailmind_token', token);
};

// Remove JWT token
export const removeToken = (): void => {
  localStorage.removeItem('retailmind_token');
};
