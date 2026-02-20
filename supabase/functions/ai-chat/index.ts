import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = true }: ChatRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service is not configured");
    }

    // --- Fetch user's actual sales data for context ---
    let dataContext = "";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          global: { headers: { Authorization: authHeader } },
        });

        // Verify user
        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;

        if (userId) {
          // Fetch compact summary — select only what we need
          const { data: rows } = await supabase
            .from("sales_data")
            .select("date, product, quantity, revenue, category")
            .eq("user_id", userId)
            .limit(2000);

          if (rows && rows.length > 0) {
            const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
            const totalQty = rows.reduce((s, r) => s + Number(r.quantity), 0);
            const dates = rows.map((r) => r.date).sort();
            const dateRange = `${dates[0]} to ${dates[dates.length - 1]}`;

            // Top 5 products by revenue
            const productMap = new Map<string, number>();
            rows.forEach((r) => {
              productMap.set(r.product, (productMap.get(r.product) || 0) + Number(r.revenue));
            });
            const topProducts = [...productMap.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([p, rev]) => `${p} (₹${Math.round(rev).toLocaleString("en-IN")})`)
              .join(", ");

            // Category breakdown
            const categoryMap = new Map<string, number>();
            rows.forEach((r) => {
              if (r.category) {
                categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + Number(r.revenue));
              }
            });
            const categories = [...categoryMap.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([c, rev]) => `${c}: ₹${Math.round(rev).toLocaleString("en-IN")}`)
              .join(", ");

            // Monthly trend (last 6 months)
            const monthMap = new Map<string, number>();
            rows.forEach((r) => {
              const month = r.date.substring(0, 7);
              monthMap.set(month, (monthMap.get(month) || 0) + Number(r.revenue));
            });
            const monthlyTrend = [...monthMap.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-6)
              .map(([m, rev]) => `${m}: ₹${Math.round(rev).toLocaleString("en-IN")}`)
              .join(", ");

            const avgDaily = totalRevenue / Math.max(1, new Set(rows.map((r) => r.date)).size);

            dataContext = `

USER'S ACTUAL SALES DATA (use these real numbers in your answers):
- Date Range: ${dateRange}
- Total Revenue: ₹${Math.round(totalRevenue).toLocaleString("en-IN")}
- Total Transactions: ${rows.length.toLocaleString("en-IN")}
- Total Quantity Sold: ${totalQty.toLocaleString("en-IN")}
- Average Daily Revenue: ₹${Math.round(avgDaily).toLocaleString("en-IN")}
- Top 5 Products by Revenue: ${topProducts}
- Category Breakdown: ${categories || "No categories"}
- Monthly Trend (last 6 months): ${monthlyTrend}

IMPORTANT: Answer all questions using this real data. Be specific with the actual numbers above. Do NOT say "I don't have access to your data" — you do.`;
          } else {
            dataContext = `\n\nNOTE: The user has not uploaded any sales data yet. Encourage them to upload a CSV file to get personalized insights.`;
          }
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
        // continue without data context
      }
    }

    const systemPrompt = `You are RetailMind AI, an intelligent analytics assistant for retail businesses. You help users understand their sales data and make data-driven decisions.

You specialize in:
1. **Sales Forecasting**: Explaining trends, predicting demand, inventory strategies
2. **Customer Segmentation**: Identifying customer groups and marketing opportunities  
3. **Market Basket Analysis**: Finding product associations and cross-selling opportunities
4. **Revenue Analytics**: Breakdowns by product, category, time period

Be concise, data-driven, and actionable. Use bullet points and markdown formatting for clarity. Always use ₹ (rupees) for currency.${dataContext}`;

    console.log("Processing chat with", messages.length, "messages, data context:", dataContext ? "YES" : "NO");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
