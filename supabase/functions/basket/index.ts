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

    const url = new URL(req.url);
    const searchProduct = url.searchParams.get("product") || "";

    // Fetch sales data with transaction IDs
    const { data: salesData, error: dbError } = await supabase
      .from("sales_data")
      .select("product, transaction_id, customer_id");

    if (dbError) throw dbError;

    if (!salesData || salesData.length === 0) {
      return new Response(JSON.stringify({
        rules: [], avg_confidence: 0, avg_lift: 0
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Group by transaction (use transaction_id or customer_id+date combo)
    const transactions = new Map<string, Set<string>>();
    for (const row of salesData) {
      const txKey = row.transaction_id || row.customer_id || "single";
      if (!transactions.has(txKey)) {
        transactions.set(txKey, new Set());
      }
      transactions.get(txKey)!.add(row.product);
    }

    // Only consider transactions with 2+ products
    const multiProductTx = Array.from(transactions.values()).filter(s => s.size >= 2);
    const nTx = multiProductTx.length;

    if (nTx < 2) {
      return new Response(JSON.stringify({
        rules: [], avg_confidence: 0, avg_lift: 0,
        message: "Need transactions with multiple products for basket analysis. Include transaction_id in your data."
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Count individual product support
    const productSupport = new Map<string, number>();
    for (const tx of multiProductTx) {
      for (const product of tx) {
        productSupport.set(product, (productSupport.get(product) || 0) + 1);
      }
    }

    // Get top products (by frequency)
    const topProducts = Array.from(productSupport.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([p]) => p);

    // Count pairwise co-occurrences
    const pairCounts = new Map<string, number>();
    for (const tx of multiProductTx) {
      const items = Array.from(tx).filter(p => topProducts.includes(p));
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const key = [items[i], items[j]].sort().join("|||");
          pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
        }
      }
    }

    // Generate rules
    const rules: Array<{
      productA: string; productB: string;
      support: number; confidence: number; lift: number;
    }> = [];

    for (const [key, count] of pairCounts.entries()) {
      const [a, b] = key.split("|||");
      const support = count / nTx;
      if (support < 0.01) continue; // min support

      const supportA = (productSupport.get(a) || 0) / nTx;
      const supportB = (productSupport.get(b) || 0) / nTx;

      const confidenceAB = supportA > 0 ? support / supportA : 0;
      const confidenceBA = supportB > 0 ? support / supportB : 0;
      const lift = (supportA > 0 && supportB > 0) ? support / (supportA * supportB) : 0;

      if (confidenceAB >= 0.1) {
        rules.push({
          productA: a, productB: b,
          support: Math.round(support * 10000) / 10000,
          confidence: Math.round(confidenceAB * 10000) / 10000,
          lift: Math.round(lift * 10000) / 10000,
        });
      }
      if (confidenceBA >= 0.1) {
        rules.push({
          productA: b, productB: a,
          support: Math.round(support * 10000) / 10000,
          confidence: Math.round(confidenceBA * 10000) / 10000,
          lift: Math.round(lift * 10000) / 10000,
        });
      }
    }

    // Sort by lift
    rules.sort((a, b) => b.lift - a.lift);

    // Filter by search if provided
    let filteredRules = rules;
    if (searchProduct) {
      const search = searchProduct.toLowerCase();
      filteredRules = rules.filter(r =>
        r.productA.toLowerCase().includes(search) ||
        r.productB.toLowerCase().includes(search)
      );
    }

    const topRules = filteredRules.slice(0, 50);
    const avgConfidence = topRules.length > 0
      ? topRules.reduce((s, r) => s + r.confidence, 0) / topRules.length : 0;
    const avgLift = topRules.length > 0
      ? topRules.reduce((s, r) => s + r.lift, 0) / topRules.length : 0;

    return new Response(JSON.stringify({
      rules: topRules,
      avg_confidence: Math.round(avgConfidence * 10000) / 10000,
      avg_lift: Math.round(avgLift * 100) / 100,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Basket analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
