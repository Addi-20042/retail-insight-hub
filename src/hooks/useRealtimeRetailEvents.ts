import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeRetailEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceRef = useRef<number | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const scheduleRefresh = () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['sales_data'] });
        queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
        queryClient.invalidateQueries({ queryKey: ['forecast'] });
        queryClient.invalidateQueries({ queryKey: ['segments'] });
        queryClient.invalidateQueries({ queryKey: ['basket'] });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['pos', 'transaction'] });
        queryClient.invalidateQueries({ queryKey: ['pos', 'items'] });
      }, 250);
    };

    const channel = supabase
      .channel(`retail-events-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_data', filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_log', filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_transactions', filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_transaction_items', filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
};
