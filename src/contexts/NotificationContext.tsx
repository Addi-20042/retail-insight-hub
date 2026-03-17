import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const mapNotificationType = (type: string): Notification['type'] => {
  if (type === 'success' || type === 'warning' || type === 'info') return type;
  return 'alert';
};

const mapRowToNotification = (row: {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  category: string | null;
  action_url: string | null;
}): Notification => ({
  id: row.id,
  type: mapNotificationType(row.type),
  title: row.title,
  message: row.message,
  timestamp: new Date(row.created_at),
  read: row.read,
  category: row.category ?? undefined,
  actionUrl: row.action_url ?? undefined,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load notifications', error);
      return;
    }

    setNotifications((data || []).map(mapRowToNotification));
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notification = mapRowToNotification(payload.new as never);
          setNotifications((prev) => {
            if (prev.some((item) => item.id === notification.id)) {
              return prev;
            }
            return [notification, ...prev].slice(0, 50);
          });

          const toastFn = notification.type === 'alert'
            ? toast.error
            : notification.type === 'warning'
              ? toast.warning
              : notification.type === 'success'
                ? toast.success
                : toast.info;

          toastFn(notification.title, { description: notification.message });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notification = mapRowToNotification(payload.new as never);
          setNotifications((prev) => prev.map((item) => item.id === notification.id ? notification : item));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) return;

    const { error } = await supabase.from('notifications').insert({
      user_id: user.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      category: notification.category ?? null,
      action_url: notification.actionUrl ?? null,
    });

    if (error) {
      throw error;
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      await loadNotifications();
      throw error;
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      await loadNotifications();
      throw error;
    }
  }, [loadNotifications, user]);

  const clearNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      await loadNotifications();
      throw error;
    }
  }, [loadNotifications]);

  const clearAll = useCallback(async () => {
    if (!user) return;

    setNotifications([]);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      await loadNotifications();
      throw error;
    }
  }, [loadNotifications, user]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

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
