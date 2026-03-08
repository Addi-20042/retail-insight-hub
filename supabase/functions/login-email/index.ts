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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current profile to check login count
    const { data: profile } = await supabase
      .from("profiles")
      .select("login_count, display_name")
      .eq("user_id", user.id)
      .single();

    const currentCount = profile?.login_count ?? 0;
    const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
    const isFirstLogin = currentCount === 0;

    // Update login count and last_login_at
    await supabase
      .from("profiles")
      .update({
        login_count: currentCount + 1,
        last_login_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Build email
    const subject = isFirstLogin
      ? "🎉 Welcome to RetailMind!"
      : `👋 Welcome back to RetailMind, ${displayName}!`;

    const htmlContent = isFirstLogin
      ? `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 40px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 12px 0 0; opacity: 0.85; font-size: 16px; }
        .content { padding: 32px; }
        .feature { display: flex; align-items: flex-start; gap: 12px; margin: 16px 0; }
        .feature-icon { font-size: 24px; flex-shrink: 0; }
        .feature-text h3 { margin: 0; font-size: 16px; color: #0f172a; }
        .feature-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
        .cta { display: inline-block; background: #0f172a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
        .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to RetailMind!</h1>
            <p>Hi ${displayName}, we're thrilled to have you on board.</p>
          </div>
          <div class="content">
            <h2 style="margin-top:0; color:#0f172a;">Here's what you can do:</h2>
            
            <div class="feature">
              <span class="feature-icon">📊</span>
              <div class="feature-text">
                <h3>Sales Forecasting</h3>
                <p>Predict future sales trends with AI-powered analytics.</p>
              </div>
            </div>
            
            <div class="feature">
              <span class="feature-icon">👥</span>
              <div class="feature-text">
                <h3>Customer Segmentation</h3>
                <p>Discover customer groups and tailor your strategy.</p>
              </div>
            </div>
            
            <div class="feature">
              <span class="feature-icon">🛒</span>
              <div class="feature-text">
                <h3>Market Basket Analysis</h3>
                <p>Find product associations and cross-sell opportunities.</p>
              </div>
            </div>
            
            <div class="feature">
              <span class="feature-icon">🔔</span>
              <div class="feature-text">
                <h3>Smart Alerts</h3>
                <p>Get notified about anomalies and important changes.</p>
              </div>
            </div>

            <p style="color:#64748b; margin-top:24px;">Start by uploading your sales data to unlock powerful insights.</p>
            <a href="${req.headers.get("origin") || "https://retailmind.app"}/dashboard/upload" class="cta">Upload Your Data →</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RetailMind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>`
      : `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
        .content { padding: 32px; text-align: center; }
        .cta { display: inline-block; background: #0f172a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
        .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 Welcome back, ${displayName}!</h1>
            <p>Great to see you again on RetailMind.</p>
          </div>
          <div class="content">
            <p style="color:#334155; font-size:16px; margin-top:0;">Your dashboard is ready with the latest insights. Jump right back in to see what's new.</p>
            <a href="${req.headers.get("origin") || "https://retailmind.app"}/dashboard" class="cta">Go to Dashboard →</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RetailMind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>`;

    // Send via Brevo
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "RetailMind", email: "noreply@retailmind.app" },
        to: [{ email: user.email, name: displayName }],
        subject,
        htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Brevo error:", errorData);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const emailResult = await emailResponse.json();

    return new Response(JSON.stringify({
      success: true,
      type: isFirstLogin ? "welcome" : "welcome_back",
      messageId: emailResult.messageId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Login email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
