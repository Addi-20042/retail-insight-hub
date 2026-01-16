import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, getToken, removeToken, setToken } from '@/lib/api';
import type { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  backendConnected: boolean;
  login: (googleIdToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (token) {
        try {
          // Try to verify token with backend
          const verifiedUser = await authService.verifyToken();
          if (verifiedUser) {
            setUser(verifiedUser);
            setBackendConnected(true);
          }
        } catch {
          // Token invalid or backend unavailable
          // Check localStorage for mock user
          const storedUser = localStorage.getItem('retailmind_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } else {
        // No token, check for mock user
        const storedUser = localStorage.getItem('retailmind_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (googleIdToken?: string) => {
    setIsLoading(true);
    
    try {
      if (googleIdToken) {
        // Real Google OAuth flow
        const response = await authService.googleLogin(googleIdToken);
        setUser(response.user);
        localStorage.setItem('retailmind_user', JSON.stringify(response.user));
        setBackendConnected(true);
      } else {
        // Demo mode - mock login when backend unavailable
        console.warn('Backend unavailable, using demo login');
        const mockUser: User = {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@retailmind.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        };
        
        // Store mock token for API calls
        setToken('demo_token_' + Date.now());
        setUser(mockUser);
        localStorage.setItem('retailmind_user', JSON.stringify(mockUser));
        setBackendConnected(false);
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Fallback to demo mode
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: 'demo@retailmind.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
      };
      
      setToken('demo_token_' + Date.now());
      setUser(mockUser);
      localStorage.setItem('retailmind_user', JSON.stringify(mockUser));
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Backend might be unavailable, still proceed with local logout
    }
    
    removeToken();
    setUser(null);
    localStorage.removeItem('retailmind_user');
    setBackendConnected(false);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        backendConnected,
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
