import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "7"), 1), 30);

    const { data: salesData, error: dbError } = await supabase
      .from("sales_data")
      .select("date, revenue, created_at")
      .order("created_at", { ascending: true })
      .limit(1000);

    if (dbError) throw dbError;

    if (!salesData || salesData.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          total_predicted: 0,
          avg_daily: 0,
          trend: "upward",
          error: "Insufficient data for forecasting. Add more sales records or POS scans.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dailyMap = new Map<string, number>();
    for (const row of salesData) {
      const existing = dailyMap.get(row.date) || 0;
      dailyMap.set(row.date, existing + Number(row.revenue));
    }

    const dailyData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    const modelingData =
      dailyData.length >= 3
        ? dailyData
        : salesData.map((row) => ({
            date: row.date,
            revenue: Number(row.revenue),
          }));

    const n = modelingData.length;
    const xs = modelingData.map((_, index) => index);
    const ys = modelingData.map((point) => point.revenue);

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (xs[i] - meanX) * (ys[i] - meanY);
      denominator += (xs[i] - meanX) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    const residuals = ys.map((y, index) => y - (slope * xs[index] + intercept));
    const stdDev = Math.sqrt(
      residuals.reduce((sum, residual) => sum + residual * residual, 0) / Math.max(n - 2, 1)
    );

    const lastDate = new Date(modelingData[modelingData.length - 1].date);
    const forecasts = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      const x = n - 1 + i;
      const predicted = Math.max(0, slope * x + intercept);
      const margin = stdDev * 1.5;

      forecasts.push({
        date: futureDate.toISOString().split("T")[0],
        predicted: Math.round(predicted * 100) / 100,
        lower: Math.round(Math.max(0, predicted - margin) * 100) / 100,
        upper: Math.round((predicted + margin) * 100) / 100,
      });
    }

    const totalPredicted = Math.round(forecasts.reduce((sum, forecast) => sum + forecast.predicted, 0) * 100) / 100;
    const avgDaily = Math.round((totalPredicted / days) * 100) / 100;
    const trend = slope >= 0 ? "upward" : "downward";
    const recentDays = Math.min(14, dailyData.length);
    const historical = dailyData.slice(-recentDays).map((point) => ({
      date: point.date,
      actual: Math.round(point.revenue * 100) / 100,
    }));

    return new Response(
      JSON.stringify({
        data: forecasts,
        historical,
        total_predicted: totalPredicted,
        avg_daily: avgDaily,
        trend,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Forecast error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
