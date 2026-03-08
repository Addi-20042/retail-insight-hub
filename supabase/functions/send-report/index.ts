import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_REPORT_TYPES = ["sales_forecast", "customer_segments", "basket_analysis", "smart_alerts"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const { reportType, recipients, reportName } = body;

    // Validate reportType
    if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
      return new Response(JSON.stringify({ error: `Invalid report type. Must be one of: ${VALID_REPORT_TYPES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || recipients.length > 10) {
      return new Response(JSON.stringify({ error: "Provide 1-10 email recipients" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const sanitizedRecipients = recipients
      .map((r: unknown) => typeof r === "string" ? r.trim().substring(0, 255) : "")
      .filter((r: string) => EMAIL_REGEX.test(r));

    if (sanitizedRecipients.length === 0) {
      return new Response(JSON.stringify({ error: "No valid email addresses provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const sanitizedName = typeof reportName === "string" ? reportName.trim().substring(0, 200) : "";

    // Fetch summary data
    const { data: salesData } = await supabase
      .from("sales_data")
      .select("date, product, quantity, revenue, category")
      .order("date", { ascending: false })
      .limit(500);

    const rows = salesData || [];
    const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
    const totalQuantity = rows.reduce((s, r) => s + r.quantity, 0);
    const uniqueProducts = new Set(rows.map(r => r.product)).size;
    const dates = rows.map(r => r.date).sort();
    const dateRange = dates.length > 0 ? `${dates[0]} to ${dates[dates.length - 1]}` : "No data";

    const reportTitle = sanitizedName || `RetailMind ${reportType} Report`;
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 32px; }
      .header h1 { margin: 0; font-size: 24px; }
      .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
      .content { padding: 32px; }
      .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
      .stat-card { background: #f1f5f9; border-radius: 8px; padding: 16px; }
      .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      .stat-card .value { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 4px; }
      .footer { padding: 24px 32px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px; }
      .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 ${reportTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
          <h2 style="margin-top:0">Summary Overview</h2>
          <p style="color:#64748b">Data range: ${dateRange}</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="label">Total Revenue</div>
              <div class="value">₹${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="label">Units Sold</div>
              <div class="value">${totalQuantity.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="label">Unique Products</div>
              <div class="value">${uniqueProducts}</div>
            </div>
            <div class="stat-card">
              <div class="label">Records</div>
              <div class="value">${rows.length}</div>
            </div>
          </div>

          ${reportType === 'sales_forecast' ? `
            <div class="divider"></div>
            <h3>📈 Forecast Insights</h3>
            <p>Based on ${rows.length} historical data points, the model predicts ${totalRevenue > 0 ? 'continued' : 'no'} sales activity. Visit RetailMind for detailed forecasts.</p>
          ` : ''}

          ${reportType === 'customer_segments' ? `
            <div class="divider"></div>
            <h3>👥 Segmentation Highlights</h3>
            <p>${uniqueProducts} products have been analyzed and segmented into performance tiers. Visit RetailMind for interactive segment views.</p>
          ` : ''}

          ${reportType === 'basket_analysis' ? `
            <div class="divider"></div>
            <h3>🛒 Basket Analysis</h3>
            <p>Product association rules have been generated from your transaction data. Visit RetailMind to explore cross-sell opportunities.</p>
          ` : ''}

          ${reportType === 'smart_alerts' ? `
            <div class="divider"></div>
            <h3>🔔 Smart Alerts</h3>
            <p>The anomaly detection engine has analyzed your latest data. Visit RetailMind for detailed alert information.</p>
          ` : ''}
        </div>
        <div class="footer">
          <p>This is an automated report from RetailMind Analytics</p>
          <p>© ${new Date().getFullYear()} RetailMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RetailMind <onboarding@resend.dev>",
        to: sanitizedRecipients,
        subject: `${reportTitle} - ${new Date().toLocaleDateString()}`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend error:", errorData);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const emailResult = await emailResponse.json();

    await supabase
      .from("scheduled_reports")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("report_type", reportType);

    return new Response(JSON.stringify({
      success: true,
      message: `Report sent to ${sanitizedRecipients.length} recipient(s)`,
      emailId: emailResult.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Send report error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
