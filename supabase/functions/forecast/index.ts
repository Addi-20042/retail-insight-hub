import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const url = new URL(req.url);
    const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "7"), 1), 30);

    // Fetch ALL sales data aggregated by date
    const { data: salesData, error: dbError } = await supabase
      .from("sales_data")
      .select("date, revenue")
      .order("date", { ascending: true });

    if (dbError) throw dbError;

    if (!salesData || salesData.length < 3) {
      return new Response(JSON.stringify({
        data: [], total_predicted: 0, avg_daily: 0, trend: "upward",
        error: "Insufficient data for forecasting. Upload more sales records."
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Aggregate daily revenue
    const dailyMap = new Map<string, number>();
    for (const row of salesData) {
      const existing = dailyMap.get(row.date) || 0;
      dailyMap.set(row.date, existing + Number(row.revenue));
    }

    const dailyData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    if (dailyData.length < 3) {
      return new Response(JSON.stringify({
        data: [], total_predicted: 0, avg_daily: 0, trend: "upward",
        error: "Need at least 3 days of data for forecasting."
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Linear regression on day index vs revenue
    const n = dailyData.length;
    const xs = dailyData.map((_, i) => i);
    const ys = dailyData.map(d => d.revenue);

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (xs[i] - meanX) * (ys[i] - meanY);
      denominator += (xs[i] - meanX) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Standard deviation of residuals for confidence interval
    const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
    const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / Math.max(n - 2, 1));

    // Generate forecast starting from TODAY, not from last data date
    const today = new Date();
    const forecasts = [];

    for (let i = 0; i < days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i + 1);
      const x = n + i;
      const predicted = Math.max(0, slope * x + intercept);
      // Wider confidence interval further out
      const margin = stdDev * (1.5 + i * 0.1);

      forecasts.push({
        date: futureDate.toISOString().split("T")[0],
        predicted: Math.round(predicted * 100) / 100,
        lower: Math.round(Math.max(0, predicted - margin) * 100) / 100,
        upper: Math.round((predicted + margin) * 100) / 100,
      });
    }

    const totalPredicted = Math.round(forecasts.reduce((s, f) => s + f.predicted, 0) * 100) / 100;
    const avgDaily = Math.round((totalPredicted / days) * 100) / 100;
    const trend = slope >= 0 ? "upward" : "downward";

    // Include recent historical data for chart context
    const recentDays = Math.min(14, dailyData.length);
    const historical = dailyData.slice(-recentDays).map(d => ({
      date: d.date,
      actual: Math.round(d.revenue * 100) / 100,
    }));

    return new Response(JSON.stringify({
      data: forecasts,
      historical,
      total_predicted: totalPredicted,
      avg_daily: avgDaily,
      trend,
      data_points: n,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Forecast error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
