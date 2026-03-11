import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Subscribes to real-time INSERT events on sales_data.
 * Shows a toast notification and invalidates relevant queries.
 */
export function useRealtimeSales() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const record = payload.new as {
            product?: string;
            quantity?: number;
            revenue?: number;
          };

          toast.success('New Sale Recorded!', {
            description: `${record.product || 'Item'} — ${record.quantity || 1} unit(s), ₹${Number(record.revenue || 0).toLocaleString()}`,
          });

          // Invalidate all analytics queries so dashboards refresh
          queryClient.invalidateQueries({ queryKey: ['sales-data'] });
          queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
          queryClient.invalidateQueries({ queryKey: ['forecast'] });
          queryClient.invalidateQueries({ queryKey: ['segmentation'] });
          queryClient.invalidateQueries({ queryKey: ['basket'] });
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          queryClient.invalidateQueries({ queryKey: ['has-sales-data'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
