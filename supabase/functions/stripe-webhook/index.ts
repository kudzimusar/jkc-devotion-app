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

      // SaaS platform subscription confirmed
      if (metadata.platform === "church_os") {
        const subscription = await stripe.subscriptions
          .retrieve(session.subscription as string);
        const { data: plan } = await supabaseAdmin
          .from("company_plans")
          .select("id, price_monthly")
          .eq("name", metadata.plan_name)
          .single();

        await supabaseAdmin
          .from("organization_subscriptions")
          .upsert({
            org_id: metadata.org_id,
            plan_id: plan?.id,
            status: subscription.status,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            billing_interval: metadata.billing_interval ?? "month",
            amount: plan?.price_monthly ?? 0,
            currency: "USD",
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          }, { onConflict: "org_id" });

        await supabaseAdmin
          .from("organizations")
          .update({ subscription_status: "active" })
          .eq("id", metadata.org_id);
      }
    }

    // Handle recurring payment success
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const subscription = invoice.subscription;

      if (
        invoice.billing_reason === "subscription_cycle" ||
        invoice.billing_reason === "subscription_create"
      ) {
        const { data: pledge } = await supabaseAdmin
          .from("recurring_pledges")
          .select("*")
          .eq("stripe_subscription_id", subscription)
          .maybeSingle();

        if (pledge) {
          await supabaseAdmin.from("financial_records").insert({
            org_id: pledge.org_id,
            user_id: pledge.user_id || null,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            record_type: pledge.fund_designation,
            fund_designation: pledge.fund_designation,
            payment_gateway: "stripe",
            payment_status: "completed",
            transaction_id: invoice.payment_intent,
            stripe_payment_intent_id: invoice.payment_intent,
            given_by_name: pledge.given_by_name,
            given_by_email: pledge.given_by_email,
            given_date: new Date().toISOString().split("T")[0],
            is_recurring: true,
            recurring_interval: pledge.interval,
            notes: `Recurring ${pledge.interval}ly giving`,
            created_at: new Date().toISOString(),
          });

          const sub = await stripe.subscriptions.retrieve(subscription);
          await supabaseAdmin
            .from("recurring_pledges")
            .update({
              next_billing_date: new Date(
                sub.current_period_end * 1000
              ).toISOString().split("T")[0],
            })
            .eq("stripe_subscription_id", subscription);
        }
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      await supabaseAdmin
        .from("recurring_pledges")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
    }

    // Handle SaaS subscription upgrades/downgrades
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as any;
      if (sub.metadata?.platform === "church_os") {
        await supabaseAdmin
          .from("organization_subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(
              sub.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
      }
    }

    // ── ChurchGPT billing events ─────────────────────────────────────────────
    const churchGPTEventMap: Record<string, string> = {
      "customer.subscription.created":         "subscription.created",
      "customer.subscription.updated":         "subscription.updated",
      "customer.subscription.deleted":         "subscription.cancelled",
      "invoice.payment_succeeded":             "payment.succeeded",
      "invoice.payment_failed":                "payment.failed",
      "customer.subscription.trial_will_end":  "trial.ending",
    };

    const churchOSEventType = churchGPTEventMap[event.type];
    if (churchOSEventType) {
      const obj = event.data.object as any;
      const orgId = obj.metadata?.org_id ?? obj.subscription_details?.metadata?.org_id ?? null;
      const planName = obj.metadata?.plan_name ?? null;

      if (orgId) {
        const amount = (obj.amount_paid ?? obj.plan?.amount ?? 0) / 100;
        const periodEnd = obj.current_period_end
          ? new Date(obj.current_period_end * 1000).toISOString()
          : null;

        const { error: billingError } = await supabaseAdmin.rpc("apply_subscription_event", {
          p_stripe_event_id:        event.id,
          p_event_type:             churchOSEventType,
          p_org_id:                 orgId,
          p_plan_name:              planName,
          p_amount_usd:             amount,
          p_stripe_customer_id:     obj.customer ?? null,
          p_stripe_subscription_id: obj.id ?? obj.subscription ?? null,
          p_stripe_price_id:        obj.plan?.id ?? null,
          p_period_end:             periodEnd,
          p_metadata:               JSON.stringify(obj),
        });

        if (billingError) {
          console.error("apply_subscription_event error:", billingError);
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
