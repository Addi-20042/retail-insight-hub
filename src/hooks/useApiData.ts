import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ForecastResponse, SegmentationResponse, BasketResponse, AlertsResponse } from '@/lib/api/types';

// Query Keys
export const queryKeys = {
  health: ['health'],
  forecast: (days: number) => ['forecast', days],
  segments: ['segments'],
  basket: ['basket'],
  basketSearch: (product: string) => ['basket', 'search', product],
  alerts: ['alerts'],
};

// ─── Offline Cache Layer ───
const CACHE_KEY = 'retailmind_sales_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const cacheData = (data: any[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* localStorage full, ignore */ }
};

const getCachedData = (): any[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL * 6) return null; // 1hr stale max
    return data;
  } catch { return null; }
};

// ─── Helper: fetch all sales data with offline fallback ───
const fetchSalesData = async () => {
  try {
    const allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('sales_data')
        .select('date, product, quantity, revenue, customer_id, transaction_id, category')
        .order('date', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    cacheData(allData);
    return allData;
  } catch (err) {
    // Offline fallback
    const cached = getCachedData();
    if (cached && cached.length > 0) {
      console.warn('Using cached data (offline mode)');
      return cached;
    }
    throw err;
  }
};

// ─── CLIENT-SIDE: Forecast (Moving Average + Trend with Seasonality) ───
const computeForecast = (salesData: any[], days: number): ForecastResponse => {
  const dailyMap = new Map<string, number>();
  for (const row of salesData) {
    dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + Number(row.revenue));
  }

  const sorted = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length < 2) {
    return { data: [], total_predicted: 0, avg_daily: 0, trend: 'upward' };
  }

  const n = sorted.length;
  const ys = sorted.map(([, v]) => v);

  // Linear trend
  const xs = sorted.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Day-of-week seasonality factors
  const dowTotals = new Array(7).fill(0);
  const dowCounts = new Array(7).fill(0);
  sorted.forEach(([dateStr, rev]) => {
    const dow = new Date(dateStr).getDay();
    dowTotals[dow] += rev;
    dowCounts[dow]++;
  });
  const overallAvg = sumY / n;
  const dowFactors = dowTotals.map((total, i) =>
    dowCounts[i] > 0 ? total / dowCounts[i] / overallAvg : 1
  );

  // Residual std dev
  const residuals = ys.map((y, i) => {
    const dow = new Date(sorted[i][0]).getDay();
    return y - (slope * xs[i] + intercept) * dowFactors[dow];
  });
  const stdDev = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / n);

  // Weighted moving average for recent trend (last 7 days)
  const recentWindow = Math.min(7, n);
  const recentAvg = ys.slice(-recentWindow).reduce((a, b) => a + b, 0) / recentWindow;
  const trendAvg = slope * (n - 1) + intercept;
  const blendWeight = 0.4; // 40% recent MA, 60% trend

  const today = new Date();
  const forecast: ForecastResponse['data'] = [];
  let total = 0;

  for (let i = 1; i <= days; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const x = n + i - 1;
    const dow = futureDate.getDay();
    const trendVal = slope * x + intercept;
    const blended = trendVal * (1 - blendWeight) + recentAvg * blendWeight;
    const predicted = Math.max(0, blended * dowFactors[dow]);
    const lower = Math.max(0, predicted - 1.96 * stdDev * 0.5);
    const upper = predicted + 1.96 * stdDev * 0.5;
    total += predicted;
    forecast.push({
      date: futureDate.toISOString().split('T')[0],
      predicted: Math.round(predicted * 100) / 100,
      lower: Math.round(lower * 100) / 100,
      upper: Math.round(upper * 100) / 100,
    });
  }

  return {
    data: forecast,
    total_predicted: Math.round(total),
    avg_daily: Math.round(total / days),
    trend: slope >= 0 ? 'upward' : 'downward',
  };
};

// ─── CLIENT-SIDE: Segmentation (Quartile-based) ───
const SEGMENT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
const SEGMENT_NAMES = ["High Value", "Regular", "Occasional", "Low Activity"];
const SEGMENT_DESCRIPTIONS = [
  "Top performers with high revenue and frequency",
  "Consistent moderate activity",
  "Infrequent but notable purchases",
  "Minimal engagement, potential for growth",
];

const computeSegmentation = (salesData: any[]): SegmentationResponse => {
  if (!salesData.length) {
    return { segments: [], products: [], total_customers: 0, total_revenue: 0 };
  }

  const productMap = new Map<string, { quantity: number; revenue: number; transactions: Set<string> }>();
  const customerSet = new Set<string>();
  let totalRevenue = 0;

  for (const row of salesData) {
    const key = row.product;
    if (!productMap.has(key)) productMap.set(key, { quantity: 0, revenue: 0, transactions: new Set() });
    const p = productMap.get(key)!;
    p.quantity += row.quantity;
    p.revenue += Number(row.revenue);
    if (row.transaction_id) p.transactions.add(row.transaction_id);
    if (row.customer_id) customerSet.add(row.customer_id);
    totalRevenue += Number(row.revenue);
  }

  const products = Array.from(productMap.entries())
    .map(([product, data]) => ({
      product,
      quantity: data.quantity,
      revenue: Math.round(data.revenue * 100) / 100,
      transactionCount: data.transactions.size || 1,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const revenues = products.map(p => p.revenue).sort((a, b) => b - a);
  const q1 = revenues[Math.floor(revenues.length * 0.25)] || 0;
  const q2 = revenues[Math.floor(revenues.length * 0.5)] || 0;
  const q3 = revenues[Math.floor(revenues.length * 0.75)] || 0;

  const assignSegment = (revenue: number): number => {
    if (revenue >= q1) return 0;
    if (revenue >= q2) return 1;
    if (revenue >= q3) return 2;
    return 3;
  };

  const segmentCounts = [0, 0, 0, 0];
  const segmentRevenue = [0, 0, 0, 0];

  const productsWithSegment = products.map(p => {
    const seg = assignSegment(p.revenue);
    segmentCounts[seg]++;
    segmentRevenue[seg] += p.revenue;
    return { ...p, segment: seg };
  });

  const segments = SEGMENT_NAMES.map((name, i) => ({
    id: i,
    name,
    count: segmentCounts[i],
    avgSpend: segmentCounts[i] > 0 ? Math.round(segmentRevenue[i] / segmentCounts[i]) : 0,
    totalRevenue: Math.round(segmentRevenue[i]),
    description: SEGMENT_DESCRIPTIONS[i],
    color: SEGMENT_COLORS[i],
  }));

  return {
    segments,
    products: productsWithSegment.slice(0, 50),
    total_customers: customerSet.size || products.length,
    total_revenue: Math.round(totalRevenue),
  };
};

// ─── CLIENT-SIDE: Market Basket Analysis (Apriori-like) ───
const computeBasket = (salesData: any[], searchProduct?: string): BasketResponse => {
  if (!salesData.length) return { rules: [], avg_confidence: 0, avg_lift: 0 };

  const txnMap = new Map<string, Set<string>>();
  for (const row of salesData) {
    const key = row.transaction_id || `${row.customer_id || 'unknown'}_${row.date}`;
    if (!txnMap.has(key)) txnMap.set(key, new Set());
    txnMap.get(key)!.add(row.product);
  }

  let baskets = Array.from(txnMap.values()).filter(s => s.size > 1);

  if (baskets.length < 5) {
    const custMap = new Map<string, Set<string>>();
    for (const row of salesData) {
      if (!row.customer_id) continue;
      if (!custMap.has(row.customer_id)) custMap.set(row.customer_id, new Set());
      custMap.get(row.customer_id)!.add(row.product);
    }
    baskets = Array.from(custMap.values()).filter(s => s.size > 1);
  }

  if (baskets.length === 0) return { rules: [], avg_confidence: 0, avg_lift: 0 };

  const totalBaskets = baskets.length;
  const productSupport = new Map<string, number>();
  const pairCount = new Map<string, number>();

  for (const basket of baskets) {
    const items = Array.from(basket);
    for (const item of items) {
      productSupport.set(item, (productSupport.get(item) || 0) + 1);
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const key = [items[i], items[j]].sort().join('|||');
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  }

  const rules: BasketResponse['rules'] = [];
  for (const [pair, count] of pairCount.entries()) {
    const [a, b] = pair.split('|||');
    const supportA = productSupport.get(a)! / totalBaskets;
    const supportB = productSupport.get(b)! / totalBaskets;
    const supportAB = count / totalBaskets;

    if (supportAB < 0.01) continue;

    const confAB = supportAB / supportA;
    const liftAB = confAB / supportB;
    if (confAB >= 0.05) {
      rules.push({ productA: a, productB: b, support: Math.round(supportAB * 1000) / 1000, confidence: Math.round(confAB * 1000) / 1000, lift: Math.round(liftAB * 100) / 100 });
    }

    const confBA = supportAB / supportB;
    const liftBA = confBA / supportA;
    if (confBA >= 0.05) {
      rules.push({ productA: b, productB: a, support: Math.round(supportAB * 1000) / 1000, confidence: Math.round(confBA * 1000) / 1000, lift: Math.round(liftBA * 100) / 100 });
    }
  }

  let filtered = rules;
  if (searchProduct) {
    const sp = searchProduct.toLowerCase();
    filtered = rules.filter(r => r.productA.toLowerCase().includes(sp) || r.productB.toLowerCase().includes(sp));
  }

  filtered.sort((a, b) => b.lift - a.lift);
  const top = filtered.slice(0, 50);

  const avgConf = top.length > 0 ? top.reduce((s, r) => s + r.confidence, 0) / top.length : 0;
  const avgLift = top.length > 0 ? top.reduce((s, r) => s + r.lift, 0) / top.length : 0;

  return {
    rules: top,
    avg_confidence: Math.round(avgConf * 100) / 100,
    avg_lift: Math.round(avgLift * 100) / 100,
  };
};

// ─── CLIENT-SIDE: Alerts (Anomaly Detection + Trends) ───
const computeAlerts = (salesData: any[]): AlertsResponse => {
  if (!salesData.length) return { alerts: [], high_count: 0, medium_count: 0, low_count: 0 };

  const dailyMap = new Map<string, number>();
  for (const row of salesData) {
    dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + Number(row.revenue));
  }
  const sorted = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const revenues = sorted.map(([, v]) => v);

  const alerts: AlertsResponse['alerts'] = [];
  let alertId = 1;

  if (revenues.length >= 7) {
    const recent = revenues.slice(-30);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, v) => a + (v - mean) ** 2, 0) / recent.length);

    if (std > 0) {
      const last7 = sorted.slice(-7);
      for (const [date, rev] of last7) {
        const z = (rev - mean) / std;
        if (z > 2) {
          alerts.push({ id: alertId++, type: 'spike', title: 'Revenue Spike Detected', message: `Revenue of ₹${Math.round(rev).toLocaleString()} on ${date} is ${Math.abs(z).toFixed(1)} std deviations above average`, timestamp: date, category: 'anomaly', severity: z > 3 ? 'high' : 'medium' });
        } else if (z < -2) {
          alerts.push({ id: alertId++, type: 'drop', title: 'Revenue Drop Detected', message: `Revenue of ₹${Math.round(rev).toLocaleString()} on ${date} is ${Math.abs(z).toFixed(1)} std deviations below average`, timestamp: date, category: 'anomaly', severity: z < -3 ? 'high' : 'medium' });
        }
      }
    }
  }

  if (revenues.length >= 14) {
    const last7Avg = revenues.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const prev7Avg = revenues.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    if (prev7Avg > 0) {
      const change = ((last7Avg - prev7Avg) / prev7Avg) * 100;
      if (Math.abs(change) > 20) {
        alerts.push({
          id: alertId++,
          type: change > 0 ? 'spike' : 'drop',
          title: `Sales ${change > 0 ? 'Upward' : 'Downward'} Trend`,
          message: `Weekly average changed by ${change > 0 ? '+' : ''}${change.toFixed(1)}% compared to previous week`,
          timestamp: sorted[sorted.length - 1][0],
          category: 'trend',
          severity: Math.abs(change) > 50 ? 'high' : 'medium',
        });
      }
    }
  }

  const productRevMap = new Map<string, number>();
  for (const row of salesData) {
    productRevMap.set(row.product, (productRevMap.get(row.product) || 0) + Number(row.revenue));
  }
  const topProduct = Array.from(productRevMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topProduct) {
    alerts.push({ id: alertId++, type: 'pattern', title: 'Top Performing Product', message: `${topProduct[0]} leads with ₹${Math.round(topProduct[1]).toLocaleString()} total revenue`, timestamp: new Date().toISOString().split('T')[0], category: 'insight', severity: 'low' });
  }

  const productQtyMap = new Map<string, number>();
  for (const row of salesData) {
    productQtyMap.set(row.product, (productQtyMap.get(row.product) || 0) + row.quantity);
  }
  const lowProducts = Array.from(productQtyMap.entries()).filter(([, q]) => q <= 5);
  if (lowProducts.length > 0) {
    alerts.push({ id: alertId++, type: 'warning', title: 'Low Sales Products', message: `${lowProducts.length} product(s) have sold 5 or fewer units: ${lowProducts.slice(0, 3).map(([p]) => p).join(', ')}${lowProducts.length > 3 ? '...' : ''}`, timestamp: new Date().toISOString().split('T')[0], category: 'inventory', severity: 'medium' });
  }

  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    alerts,
    high_count: alerts.filter(a => a.severity === 'high').length,
    medium_count: alerts.filter(a => a.severity === 'medium').length,
    low_count: alerts.filter(a => a.severity === 'low').length,
  };
};

// ═══════════════════════════════════════════════
// HOOKS — All run client-side with offline fallback
// ═══════════════════════════════════════════════

export const useForecast = (days: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.forecast(days),
    queryFn: async () => {
      const data = await fetchSalesData();
      return computeForecast(data, days);
    },
    staleTime: 60000,
    enabled: !!user,
    retry: 1,
  });
};

export const useSegmentation = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.segments,
    queryFn: async () => {
      const data = await fetchSalesData();
      return computeSegmentation(data);
    },
    staleTime: 300000,
    enabled: !!user,
    retry: 1,
  });
};

export const useBasketRules = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.basket,
    queryFn: async () => {
      const data = await fetchSalesData();
      return computeBasket(data);
    },
    staleTime: 300000,
    enabled: !!user,
    retry: 1,
  });
};

export const useBasketSearch = (product: string, enabled: boolean = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.basketSearch(product),
    queryFn: async () => {
      const data = await fetchSalesData();
      return computeBasket(data, product);
    },
    enabled: enabled && !!user && !!product,
    staleTime: 60000,
    retry: 1,
  });
};

export const useAlerts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: async () => {
      const data = await fetchSalesData();
      return computeAlerts(data);
    },
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: !!user,
    retry: 1,
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => {
      try {
        const { error } = await supabase.from('sales_data').select('id').limit(1);
        return { status: error ? 'error' as const : 'ok' as const, database: !error, models_loaded: true, version: '2.0.0' };
      } catch {
        return { status: 'error' as const, database: false, models_loaded: false, version: 'unknown' };
      }
    },
    staleTime: 30000,
    retry: false,
  });
};

export const useSendReport = () => {
  return useMutation({
    mutationFn: async ({ reportType, recipients, reportName }: { reportType: string; recipients: string[]; reportName: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ reportType, recipients, reportName }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || 'Failed to send report');
      }
      return response.json();
    },
  });
};

export const useFileUpload = () => {
  const queryClient = useQueryClient();
  return {
    invalidateAnalytics: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.segments });
      queryClient.invalidateQueries({ queryKey: queryKeys.basket });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  };
};
