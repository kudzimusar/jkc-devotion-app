import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Log all webhook events
    await supabaseAdmin.from("payment_webhook_events").insert({
      gateway: "stripe",
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      processed: false,
    });

    // Handle giving payments
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      if (metadata.type === "giving") {
        const amount = (session.amount_total ?? 0) / 100;

        const { error } = await supabaseAdmin.from("financial_records").insert({
          org_id: metadata.org_id || null,
          user_id: metadata.user_id || null,
          amount: amount,
          currency: (session.currency ?? "jpy").toUpperCase(),
          record_type: metadata.fund_designation || "tithe",
          fund_designation: metadata.fund_designation || "tithe",
          payment_gateway: "stripe",
          payment_status: "completed",
          transaction_id: session.payment_intent as string,
          given_by_name: metadata.given_by_name || null,
          given_by_email: metadata.given_by_email || session.customer_email || null,
          given_date: new Date().toISOString().split("T")[0],
          is_anonymous: metadata.is_anonymous === "true",
          is_recurring: metadata.is_recurring === "true",
          notes: metadata.notes || "",
          ministry_id: metadata.ministry_id || null,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Failed to insert financial record:", error);
        } else {
          // Mark webhook as processed
          await supabaseAdmin
            .from("payment_webhook_events")
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq("event_type", event.type)
            .eq("processed", false);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
