import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, getToken, removeToken, setToken } from '@/lib/api';
import type { User } from '@/lib/api';

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  backendConnected: boolean;
  login: (accessToken?: string, googleUser?: GoogleUserInfo) => Promise<void>;
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
          const verifiedUser = await authService.verifyToken();
          if (verifiedUser) {
            setUser(verifiedUser);
            setBackendConnected(true);
          }
        } catch {
          const storedUser = localStorage.getItem('retailmind_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } else {
        const storedUser = localStorage.getItem('retailmind_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (accessToken?: string, googleUser?: GoogleUserInfo) => {
    setIsLoading(true);
    
    try {
      if (accessToken && googleUser) {
        // Real Google OAuth flow - try backend first
        try {
          const response = await authService.googleLogin(accessToken);
          setUser(response.user);
          localStorage.setItem('retailmind_user', JSON.stringify(response.user));
          setBackendConnected(true);
        } catch {
          // Backend unavailable, use Google user info directly
          const mockUser: User = {
            id: googleUser.sub || '1',
            name: googleUser.name || 'Google User',
            email: googleUser.email || 'user@gmail.com',
            avatar: googleUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.email}`,
          };
          
          setToken('google_token_' + Date.now());
          setUser(mockUser);
          localStorage.setItem('retailmind_user', JSON.stringify(mockUser));
          setBackendConnected(false);
        }
      } else {
        // Demo mode - mock login
        const mockUser: User = {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@retailmind.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        };
        
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
      // Backend might be unavailable
    }
    
    removeToken();
    setUser(null);
    localStorage.removeItem('retailmind_user');
    setBackendConnected(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, backendConnected, login, logout }}>
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
