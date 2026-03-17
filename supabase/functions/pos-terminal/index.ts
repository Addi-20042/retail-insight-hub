import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PosTerminalAction = "start" | "scan" | "complete" | "cancel" | "seed-demo";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action as PosTerminalAction | undefined;

    if (!action) {
      return new Response(JSON.stringify({ error: "Action is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rpcName = "";
    let rpcParams: Record<string, unknown> = {};

    switch (action) {
      case "start":
        rpcName = "start_pos_transaction";
        rpcParams = {
          p_customer_id: body.customer_id ?? null,
          p_cashier_name: body.cashier_name ?? null,
          p_device_id: body.device_id ?? null,
        };
        break;
      case "scan":
        rpcName = "process_pos_scan";
        rpcParams = {
          p_barcode: body.barcode,
          p_quantity: body.quantity ?? 1,
          p_transaction_id: body.transaction_id ?? null,
          p_customer_id: body.customer_id ?? null,
          p_cashier_name: body.cashier_name ?? null,
          p_device_id: body.device_id ?? null,
          p_scan_id: body.scan_id ?? null,
        };
        if (!body.barcode) {
          return new Response(JSON.stringify({ error: "Barcode is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      case "complete":
        rpcName = "complete_pos_transaction";
        rpcParams = {
          p_transaction_id: body.transaction_id,
        };
        break;
      case "cancel":
        rpcName = "cancel_pos_transaction";
        rpcParams = {
          p_transaction_id: body.transaction_id,
        };
        break;
      case "seed-demo":
        rpcName = "seed_demo_products";
        break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { data, error } = await serviceClient.rpc(rpcName, rpcParams);

    if (error) {
      console.error("POS terminal RPC error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = data ?? { ok: false, error: "Unknown POS response" };
    const status = result.ok === false ? 400 : 200;

    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POS terminal error:", error);
    const message = error instanceof Error ? error.message : "Unexpected POS terminal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
