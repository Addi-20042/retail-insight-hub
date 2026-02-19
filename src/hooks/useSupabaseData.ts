import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Sales Data Hooks ───

export const useSalesData = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales_data', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useSalesStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales_stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_data')
        .select('date, product, quantity, revenue, category');
      if (error) throw error;
      const rows = data || [];
      
      const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
      const totalProducts = rows.reduce((s, r) => s + r.quantity, 0);
      const uniqueCustomers = new Set(rows.map(r => r.product)).size;
      const dates = rows.map(r => r.date).sort();
      
      const monthlyMap = new Map<string, { revenue: number }>();
      rows.forEach(r => {
        const month = r.date.substring(0, 7);
        const existing = monthlyMap.get(month) || { revenue: 0 };
        existing.revenue += Number(r.revenue);
        monthlyMap.set(month, existing);
      });
      
      const revenueData = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          date: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
          revenue: Math.round(data.revenue),
        }));

      return {
        totalRevenue,
        totalProducts,
        uniqueProducts: uniqueCustomers,
        totalRows: rows.length,
        revenueData,
        dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
      };
    },
    enabled: !!user,
  });
};

// ─── CSV Upload to Supabase ───

export const useUploadToSupabase = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV file is empty or has no data rows');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dateIdx = headers.indexOf('date');
      const productIdx = headers.indexOf('product');
      const quantityIdx = headers.indexOf('quantity');
      const revenueIdx = headers.indexOf('revenue');
      const categoryIdx = headers.indexOf('category');
      const customerIdx = headers.indexOf('customer_id');
      const transactionIdx = headers.indexOf('transaction_id');

      if (dateIdx === -1 || productIdx === -1 || quantityIdx === -1 || revenueIdx === -1) {
        throw new Error('CSV must have columns: date, product, quantity, revenue');
      }

      const { data: upload, error: uploadErr } = await supabase
        .from('upload_history')
        .insert({ user_id: user.id, filename: file.name, rows_count: lines.length - 1, status: 'processing' })
        .select()
        .single();
      if (uploadErr) throw uploadErr;

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 4) continue;
        rows.push({
          user_id: user.id,
          date: cols[dateIdx],
          product: cols[productIdx],
          quantity: parseInt(cols[quantityIdx]) || 0,
          revenue: parseFloat(cols[revenueIdx]) || 0,
          category: categoryIdx !== -1 ? cols[categoryIdx] || null : null,
          customer_id: customerIdx !== -1 ? cols[customerIdx] || null : null,
          transaction_id: transactionIdx !== -1 ? cols[transactionIdx] || null : null,
        });
      }

      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from('sales_data').insert(chunk);
        if (error) throw error;
      }

      await supabase
        .from('upload_history')
        .update({ status: 'success', rows_count: rows.length })
        .eq('id', upload.id);

      await supabase.from('activity_log').insert({
        user_id: user.id,
        type: 'upload',
        message: `Uploaded ${file.name} (${rows.length} rows)`,
      });

      return { rows_processed: rows.length, filename: file.name };
    },
    onSuccess: () => {
      // Invalidate all data queries including analytics edge functions
      queryClient.invalidateQueries({ queryKey: ['sales_data'] });
      queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
      queryClient.invalidateQueries({ queryKey: ['upload_history'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['basket'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// ─── Manual Entry ───

export const useAddSalesEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: { date: string; product: string; quantity: number; revenue: number; category?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('sales_data').insert({ ...entry, user_id: user.id });
      if (error) throw error;

      await supabase.from('activity_log').insert({
        user_id: user.id,
        type: 'upload',
        message: `Added manual entry: ${entry.product} (₹${entry.revenue})`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_data'] });
      queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['basket'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// ─── Upload History ───

export const useUploadHistory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['upload_history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upload_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// ─── Activity Log ───

export const useActivityLog = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activity_log', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// ─── Log Activity Helper ───

export const useLogActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ type, message }: { type: string; message: string }) => {
      if (!user) return;
      const { error } = await supabase.from('activity_log').insert({ user_id: user.id, type, message });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
    },
  });
};
