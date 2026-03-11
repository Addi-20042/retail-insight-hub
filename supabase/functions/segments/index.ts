import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEGMENT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
const SEGMENT_NAMES = ["High Value", "Regular", "Occasional", "Low Activity"];
const SEGMENT_DESCRIPTIONS = [
  "Top performers with high revenue and frequency",
  "Consistent moderate activity",
  "Infrequent but notable purchases",
  "Minimal engagement, potential for growth"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch only needed columns — limit 2000 rows for performance
    const { data: salesData, error: dbError } = await supabase
      .from("sales_data")
      .select("product, quantity, revenue, customer_id, transaction_id")
      .limit(2000);

    if (dbError) throw dbError;

    if (!salesData || salesData.length === 0) {
      return new Response(JSON.stringify({
        segments: [], products: [], total_customers: 0, total_revenue: 0
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Aggregate by product
    const productMap = new Map<string, { quantity: number; revenue: number; transactions: Set<string> }>();
    const customerSet = new Set<string>();
    let totalRevenue = 0;

    for (const row of salesData) {
      const key = row.product;
      if (!productMap.has(key)) {
        productMap.set(key, { quantity: 0, revenue: 0, transactions: new Set() });
      }
      const p = productMap.get(key)!;
      p.quantity += row.quantity;
      p.revenue += Number(row.revenue);
      if (row.transaction_id) p.transactions.add(row.transaction_id);
      if (row.customer_id) customerSet.add(row.customer_id);
      totalRevenue += Number(row.revenue);
    }

    // Convert to array and sort by revenue
    const products = Array.from(productMap.entries()).map(([product, data]) => ({
      product,
      quantity: data.quantity,
      revenue: Math.round(data.revenue * 100) / 100,
      transactionCount: data.transactions.size || 1,
    })).sort((a, b) => b.revenue - a.revenue);

    // K-Means-like segmentation using quartiles on revenue
    const revenues = products.map(p => p.revenue).sort((a, b) => b - a);
    const q1 = revenues[Math.floor(revenues.length * 0.25)] || 0;
    const q2 = revenues[Math.floor(revenues.length * 0.5)] || 0;
    const q3 = revenues[Math.floor(revenues.length * 0.75)] || 0;

    const assignSegment = (revenue: number): number => {
      if (revenue >= q1) return 0; // High Value
      if (revenue >= q2) return 1; // Regular
      if (revenue >= q3) return 2; // Occasional
      return 3; // Low Activity
    };

    const segmentCounts = [0, 0, 0, 0];
    const segmentRevenue = [0, 0, 0, 0];
    const segmentSpend: number[][] = [[], [], [], []];

    const productsWithSegment = products.map(p => {
      const seg = assignSegment(p.revenue);
      segmentCounts[seg]++;
      segmentRevenue[seg] += p.revenue;
      segmentSpend[seg].push(p.revenue);
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

    return new Response(JSON.stringify({
      segments,
      products: productsWithSegment.slice(0, 50), // Top 50
      total_customers: customerSet.size || products.length,
      total_revenue: Math.round(totalRevenue),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Segmentation error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
