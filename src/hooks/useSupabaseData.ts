import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

// ─── Has Data (lightweight check) ───

export const useHasSalesData = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['has_sales_data', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('sales_data').select('id').limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });
};

// ─── Sales Data Hooks (paginated to avoid 1000-row limit) ───

export const useSalesData = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales_data', user?.id],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('sales_data')
          .select('*')
          .order('date', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
    enabled: !!user,
  });
};


export const useSalesStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales_stats', user?.id],
    queryFn: async () => {
      // Select only needed columns for stats computation
      const allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('sales_data')
          .select('date, product, quantity, revenue, category')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      const rows = allRows;
      
      const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
      const totalProducts = rows.reduce((s, r) => s + r.quantity, 0);
      const uniqueCustomers = new Set(rows.map(r => r.product)).size;
      const dates = rows.map(r => r.date).sort();
      
      // Monthly revenue for area chart
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
          date: new Date(month + '-01').toLocaleString('en-IN', { month: 'short' }),
          revenue: Math.round(data.revenue),
        }));

      // Daily revenue for sparklines & heatmap
      const dailyMap = new Map<string, number>();
      rows.forEach(r => {
        dailyMap.set(r.date, (dailyMap.get(r.date) || 0) + Number(r.revenue));
      });
      const dailyRevenue = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));

      // Daily quantity for sparkline
      const dailyQtyMap = new Map<string, number>();
      rows.forEach(r => {
        dailyQtyMap.set(r.date, (dailyQtyMap.get(r.date) || 0) + r.quantity);
      });
      const dailyQuantity = Array.from(dailyQtyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, qty]) => ({ date, value: qty }));

      // Category breakdown for treemap
      const categoryMap = new Map<string, { revenue: number; quantity: number }>();
      rows.forEach(r => {
        const cat = r.category || 'Uncategorized';
        const existing = categoryMap.get(cat) || { revenue: 0, quantity: 0 };
        existing.revenue += Number(r.revenue);
        existing.quantity += r.quantity;
        categoryMap.set(cat, existing);
      });
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, revenue: Math.round(data.revenue), quantity: data.quantity }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        totalRevenue,
        totalProducts,
        uniqueProducts: uniqueCustomers,
        totalRows: rows.length,
        revenueData,
        dailyRevenue,
        dailyQuantity,
        categoryBreakdown,
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
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
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

      const totalRows = lines.length - 1;
      const { data: upload, error: uploadErr } = await supabase
        .from('upload_history')
        .insert({ user_id: user.id, filename: file.name, rows_count: totalRows, status: 'processing' })
        .select()
        .single();
      if (uploadErr) throw uploadErr;

      // Process and insert in chunks for memory efficiency with large files
      const chunkSize = 1000;
      let processedRows = 0;

      for (let start = 1; start < lines.length; start += chunkSize) {
        const chunk = lines.slice(start, start + chunkSize);
        const rows = [];
        for (const line of chunk) {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 4 || !cols[dateIdx]) continue;

          // Validate date format
          const dateVal = cols[dateIdx];
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) continue;

          const qty = parseInt(cols[quantityIdx]);
          const rev = parseFloat(cols[revenueIdx]);
          if (isNaN(qty) || isNaN(rev)) continue;

          const product = cols[productIdx]?.substring(0, 200);
          if (!product) continue;

          // Auto-generate transaction_id if missing: group by customer_id + date
          const rawCustomerId = customerIdx !== -1 ? (cols[customerIdx]?.substring(0, 100) || null) : null;
          const rawTransactionId = transactionIdx !== -1 ? (cols[transactionIdx]?.substring(0, 100) || null) : null;
          const autoTransactionId = rawTransactionId || (rawCustomerId ? `${rawCustomerId}_${dateVal}` : `auto_${dateVal}_${start + chunk.indexOf(line)}`);

          rows.push({
            user_id: user.id,
            date: dateVal,
            product,
            quantity: qty,
            revenue: rev,
            category: categoryIdx !== -1 ? (cols[categoryIdx]?.substring(0, 100) || null) : null,
            customer_id: rawCustomerId,
            transaction_id: autoTransactionId,
          });
        }
        if (rows.length > 0) {
          const { error } = await supabase.from('sales_data').insert(rows);
          if (error) throw error;
          processedRows += rows.length;
        }
      }

      await supabase
        .from('upload_history')
        .update({ status: 'success', rows_count: processedRows })
        .eq('id', upload.id);

      await supabase.from('activity_log').insert({
        user_id: user.id,
        type: 'upload',
        message: `Uploaded ${file.name} (${processedRows.toLocaleString()} rows)`,
      });

      return { rows_processed: processedRows, filename: file.name };
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
    mutationFn: async (entry: { date: string; product: string; quantity: number; revenue: number; category?: string; transaction_id?: string; customer_id?: string }) => {
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

// POS Products

export const useProducts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Tables<'products'>[];
    },
    enabled: !!user,
  });
};

// Active POS Transaction

export const useActivePosTransaction = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pos', 'transaction', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Tables<'pos_transactions'> | null;
    },
    enabled: !!user,
  });
};

export const usePosTransactionItems = (transactionId?: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pos', 'items', transactionId ?? 'none', user?.id],
    queryFn: async () => {
      if (!transactionId) return [] as Tables<'pos_transaction_items'>[];
      const { data, error } = await supabase
        .from('pos_transaction_items')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('scanned_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Tables<'pos_transaction_items'>[];
    },
    enabled: !!user,
  });
};
