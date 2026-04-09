import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const PAYPAL_BASE = Deno.env.get("PAYPAL_SANDBOX") === "true"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

async function getPayPalToken(clientId: string, secret: string) {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${clientId}:${secret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token as string;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, org_id } = body;

    // Get org PayPal credentials
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("paypal_client_id, paypal_secret_encrypted, giving_funds")
      .eq("id", org_id)
      .single();

    const clientId = org?.paypal_client_id
      ?? Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
    const secret = org?.paypal_secret_encrypted
      ?? Deno.env.get("PAYPAL_SECRET") ?? "";

    const token = await getPayPalToken(clientId, secret);

    // ── CREATE ORDER ──────────────────────────────────
    if (action === "create") {
      const { amount, currency, fund_designation,
              given_by_name, given_by_email,
              user_id, success_url, cancel_url } = body;

      const orderRes = await fetch(
        `${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": crypto.randomUUID(),
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: (currency ?? "JPY").toUpperCase(),
              value: String(Number(amount).toFixed(2)),
            },
            description: `Church Giving — ${fund_designation ?? "Tithe"}`,
            custom_id: JSON.stringify({
              org_id,
              user_id: user_id ?? "",
              fund_designation: fund_designation ?? "tithe",
              given_by_name: given_by_name ?? "",
              given_by_email: given_by_email ?? "",
            }),
          }],
          application_context: {
            return_url: success_url,
            cancel_url: cancel_url,
            brand_name: "Church OS Giving",
            user_action: "PAY_NOW",
          },
        }),
      });

      const order = await orderRes.json();

      // Log to webhook events
      await supabaseAdmin.from("payment_webhook_events").insert({
        gateway: "paypal",
        event_type: "order.created",
        payload: order,
        processed: false,
        org_id,
      });

      const approvalUrl = order.links?.find(
        (l: any) => l.rel === "approve"
      )?.href;

      return new Response(
        JSON.stringify({
          order_id: order.id,
          approval_url: approvalUrl
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // ── CAPTURE ORDER ─────────────────────────────────
    if (action === "capture") {
      const { order_id } = body;

      const captureRes = await fetch(
        `${PAYPAL_BASE}/v2/checkout/orders/${order_id}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const capture = await captureRes.json();

      if (capture.status === "COMPLETED") {
        const unit = capture.purchase_units?.[0];
        const payment = unit?.payments?.captures?.[0];
        const amount = Number(payment?.amount?.value ?? 0);
        const currency = payment?.amount?.currency_code ?? "JPY";

        let meta: any = {};
        try {
          meta = JSON.parse(unit?.custom_id ?? "{}");
        } catch (_) {}

        // Write confirmed payment to financial_records
        await supabaseAdmin.from("financial_records").insert({
          org_id: meta.org_id ?? org_id,
          user_id: meta.user_id || null,
          amount,
          currency,
          record_type: meta.fund_designation ?? "tithe",
          fund_designation: meta.fund_designation ?? "tithe",
          payment_gateway: "paypal",
          payment_status: "completed",
          transaction_id: payment?.id,
          paypal_order_id: order_id,
          given_by_name: meta.given_by_name || null,
          given_by_email: meta.given_by_email || null,
          given_date: new Date().toISOString().split("T")[0],
          is_anonymous: false,
          is_recurring: false,
          notes: `PayPal Order: ${order_id}`,
          created_at: new Date().toISOString(),
        });

        // Mark webhook as processed
        await supabaseAdmin.from("payment_webhook_events").insert({
          gateway: "paypal",
          event_type: "order.captured",
          payload: capture,
          processed: true,
          org_id,
          processed_at: new Date().toISOString(),
        });
      }

      return new Response(
        JSON.stringify({ status: capture.status, capture }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: corsHeaders }
    );

  } catch (err) {
    console.error("PayPal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
