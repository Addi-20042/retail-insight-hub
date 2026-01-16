import { apiClient } from '../client';
import { ENDPOINTS, setToken, removeToken } from '../config';
import type { AuthResponse, GoogleAuthPayload, User } from '../types';

export const authService = {
  // Authenticate with Google OAuth token
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const payload: GoogleAuthPayload = { id_token: idToken };
    
    const response = await apiClient<AuthResponse>(ENDPOINTS.auth.google, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    
    // Store JWT token
    setToken(response.token);
    
    return response;
  },

  // Verify current token
  verifyToken: async (): Promise<User | null> => {
    try {
      const response = await apiClient<{ user: User }>(ENDPOINTS.auth.verify);
      return response.user;
    } catch {
      removeToken();
      return null;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient(ENDPOINTS.auth.logout, { method: 'POST' });
    } finally {
      removeToken();
    }
  },
};
