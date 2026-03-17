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
    const searchProduct = url.searchParams.get("product") || "";

    const { data: salesData, error: dbError } = await supabase
      .from("sales_data")
      .select("product, transaction_id, customer_id, date");

    if (dbError) throw dbError;

    if (!salesData || salesData.length === 0) {
      return new Response(
        JSON.stringify({
          rules: [],
          avg_confidence: 0,
          avg_lift: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactions = new Map<string, Set<string>>();
    for (const row of salesData) {
      const txKey =
        row.transaction_id || (row.customer_id && row.date ? `${row.customer_id}_${row.date}` : null);

      if (!txKey) continue;

      if (!transactions.has(txKey)) {
        transactions.set(txKey, new Set());
      }
      transactions.get(txKey)!.add(row.product);
    }

    const multiProductTx = Array.from(transactions.values()).filter((tx) => tx.size >= 2);
    if (multiProductTx.length >= 1) {
      return generateRules(multiProductTx, searchProduct, corsHeaders);
    }

    const customerBaskets = new Map<string, Set<string>>();
    for (const row of salesData) {
      const key = row.customer_id || row.transaction_id;
      if (!key) continue;
      if (!customerBaskets.has(key)) {
        customerBaskets.set(key, new Set());
      }
      customerBaskets.get(key)!.add(row.product);
    }

    const multiCustomerBaskets = Array.from(customerBaskets.values()).filter((basket) => basket.size >= 2);
    if (multiCustomerBaskets.length >= 1) {
      return generateRules(multiCustomerBaskets, searchProduct, corsHeaders);
    }

    return new Response(
      JSON.stringify({
        rules: [],
        avg_confidence: 0,
        avg_lift: 0,
        message: "Scan multiple products into the same POS transaction or upload grouped transaction data to generate basket analysis.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Basket analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateRules(
  baskets: Set<string>[],
  searchProduct: string,
  headers: Record<string, string>,
): Response {
  const transactionCount = baskets.length;

  const productSupport = new Map<string, number>();
  for (const basket of baskets) {
    for (const product of basket) {
      productSupport.set(product, (productSupport.get(product) || 0) + 1);
    }
  }

  const topProducts = Array.from(productSupport.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([product]) => product);

  const pairCounts = new Map<string, number>();
  for (const basket of baskets) {
    const items = Array.from(basket).filter((product) => topProducts.includes(product));
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const key = [items[i], items[j]].sort().join("|||");
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  const rules: Array<{
    productA: string;
    productB: string;
    support: number;
    confidence: number;
    lift: number;
  }> = [];

  for (const [key, count] of pairCounts.entries()) {
    const [a, b] = key.split("|||");
    const support = count / transactionCount;

    const supportA = (productSupport.get(a) || 0) / transactionCount;
    const supportB = (productSupport.get(b) || 0) / transactionCount;

    const confidenceAB = supportA > 0 ? support / supportA : 0;
    const confidenceBA = supportB > 0 ? support / supportB : 0;
    const lift = supportA > 0 && supportB > 0 ? support / (supportA * supportB) : 0;

    if (confidenceAB >= 0.05) {
      rules.push({
        productA: a,
        productB: b,
        support: Math.round(support * 10000) / 10000,
        confidence: Math.round(confidenceAB * 10000) / 10000,
        lift: Math.round(lift * 10000) / 10000,
      });
    }

    if (confidenceBA >= 0.05) {
      rules.push({
        productA: b,
        productB: a,
        support: Math.round(support * 10000) / 10000,
        confidence: Math.round(confidenceBA * 10000) / 10000,
        lift: Math.round(lift * 10000) / 10000,
      });
    }
  }

  rules.sort((a, b) => b.lift - a.lift);

  let filteredRules = rules;
  if (searchProduct) {
    const search = searchProduct.toLowerCase();
    filteredRules = rules.filter(
      (rule) => rule.productA.toLowerCase().includes(search) || rule.productB.toLowerCase().includes(search)
    );
  }

  const topRules = filteredRules.slice(0, 50);
  const avgConfidence =
    topRules.length > 0 ? topRules.reduce((sum, rule) => sum + rule.confidence, 0) / topRules.length : 0;
  const avgLift = topRules.length > 0 ? topRules.reduce((sum, rule) => sum + rule.lift, 0) / topRules.length : 0;

  return new Response(
    JSON.stringify({
      rules: topRules,
      avg_confidence: Math.round(avgConfidence * 10000) / 10000,
      avg_lift: Math.round(avgLift * 100) / 100,
    }),
    { headers: { ...headers, "Content-Type": "application/json" } }
  );
}
