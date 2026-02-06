import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Simulated real-time alerts
const SIMULATED_ALERTS = [
  { type: 'alert' as const, title: 'Demand Spike Detected', message: 'Electronics sales up 32% in the last hour', category: 'Electronics' },
  { type: 'warning' as const, title: 'Low Inventory Alert', message: 'Wireless Earbuds stock below threshold (15 units)', category: 'Inventory' },
  { type: 'success' as const, title: 'Sales Goal Achieved', message: 'Monthly revenue target exceeded by 8%!', category: 'Revenue' },
  { type: 'info' as const, title: 'New Pattern Discovered', message: 'Customers buying laptops also prefer premium accessories', category: 'Analysis' },
  { type: 'alert' as const, title: 'Price Drop Opportunity', message: 'Competitor lowered prices on Office Chairs', category: 'Competition' },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('retailmind_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
    }
    return [];
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem('retailmind_notifications', JSON.stringify(updated));
      return updated;
    });

    // Show toast for real-time feedback
    const toastFn = notification.type === 'alert' ? toast.error :
                    notification.type === 'warning' ? toast.warning :
                    notification.type === 'success' ? toast.success : toast.info;
    
    toastFn(notification.title, { description: notification.message });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('retailmind_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('retailmind_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('retailmind_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('retailmind_notifications');
  }, []);

  // Notifications are now triggered by real events (data from backend, user actions, etc.)
  // No more simulated notifications - the addNotification function is available
  // for components to call when real events occur

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
