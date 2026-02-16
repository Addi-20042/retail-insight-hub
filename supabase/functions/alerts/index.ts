import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch sales data
    const { data: salesData, error: dbError } = await supabase
      .from("sales_data")
      .select("date, product, quantity, revenue, category")
      .order("date", { ascending: true });

    if (dbError) throw dbError;

    if (!salesData || salesData.length === 0) {
      return new Response(JSON.stringify({
        alerts: [], high_count: 0, medium_count: 0, low_count: 0
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const alerts: Array<{
      id: number; type: string; title: string; message: string;
      timestamp: string; category: string; severity: string;
    }> = [];
    let alertId = 1;

    // 1. Aggregate daily revenue
    const dailyMap = new Map<string, number>();
    for (const row of salesData) {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + Number(row.revenue));
    }
    const dailyData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // 2. Anomaly detection using z-scores
    if (dailyData.length >= 7) {
      const revenues = dailyData.map(d => d.revenue);
      const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      const std = Math.sqrt(revenues.reduce((s, v) => s + (v - mean) ** 2, 0) / revenues.length);

      if (std > 0) {
        // Check last 14 days for anomalies
        const recentDays = dailyData.slice(-14);
        for (const day of recentDays) {
          const zScore = (day.revenue - mean) / std;
          if (Math.abs(zScore) > 2) {
            const isSpike = zScore > 0;
            alerts.push({
              id: alertId++,
              type: isSpike ? "spike" : "drop",
              title: isSpike ? "Demand Spike Detected" : "Sales Drop Detected",
              message: `Revenue on ${day.date} was $${day.revenue.toLocaleString()} (${isSpike ? "+" : ""}${((day.revenue - mean) / mean * 100).toFixed(1)}% vs average $${mean.toFixed(0)})`,
              timestamp: day.date,
              category: "Anomaly Detection",
              severity: Math.abs(zScore) > 3 ? "high" : "medium",
            });
          }
        }
      }

      // 3. Trend alerts (compare last 7 days vs previous 7 days)
      if (dailyData.length >= 14) {
        const recent7 = dailyData.slice(-7).reduce((s, d) => s + d.revenue, 0) / 7;
        const prev7 = dailyData.slice(-14, -7).reduce((s, d) => s + d.revenue, 0) / 7;
        const changePct = prev7 > 0 ? ((recent7 - prev7) / prev7) * 100 : 0;

        if (Math.abs(changePct) > 15) {
          alerts.push({
            id: alertId++,
            type: changePct > 0 ? "spike" : "drop",
            title: changePct > 0 ? "Positive Sales Trend" : "Declining Sales Trend",
            message: `Average daily sales ${changePct > 0 ? "increased" : "decreased"} by ${Math.abs(changePct).toFixed(1)}% compared to the previous week`,
            timestamp: new Date().toISOString().split("T")[0],
            category: "Trend Analysis",
            severity: Math.abs(changePct) > 30 ? "high" : "medium",
          });
        }
      }
    }

    // 4. Product-level patterns
    const productRevenue = new Map<string, number>();
    const productQuantity = new Map<string, number>();
    for (const row of salesData) {
      productRevenue.set(row.product, (productRevenue.get(row.product) || 0) + Number(row.revenue));
      productQuantity.set(row.product, (productQuantity.get(row.product) || 0) + row.quantity);
    }

    // Top selling product alert
    const topProduct = Array.from(productRevenue.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topProduct) {
      alerts.push({
        id: alertId++,
        type: "pattern",
        title: "Top Selling Product",
        message: `"${topProduct[0]}" leads with $${topProduct[1].toLocaleString()} in revenue`,
        timestamp: new Date().toISOString().split("T")[0],
        category: "Product Insights",
        severity: "low",
      });
    }

    // Low quantity warning
    const lowQtyProducts = Array.from(productQuantity.entries())
      .filter(([_, qty]) => qty <= 5)
      .sort((a, b) => a[1] - b[1]);
    if (lowQtyProducts.length > 0) {
      alerts.push({
        id: alertId++,
        type: "warning",
        title: "Low Volume Products",
        message: `${lowQtyProducts.length} product(s) have very low sales volume (≤5 units): ${lowQtyProducts.slice(0, 3).map(([p]) => p).join(", ")}`,
        timestamp: new Date().toISOString().split("T")[0],
        category: "Inventory",
        severity: "low",
      });
    }

    // Sort by severity
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

    const high_count = alerts.filter(a => a.severity === "high").length;
    const medium_count = alerts.filter(a => a.severity === "medium").length;
    const low_count = alerts.filter(a => a.severity === "low").length;

    return new Response(JSON.stringify({
      alerts, high_count, medium_count, low_count
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Alerts error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
