import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const body = await req.json();

    // Giving flow
    if (body.type === 'giving') {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: body.currency || 'jpy',
            product_data: {
              name: body.fund_name || 'Church Giving',
              description: 'Thank you for your generous gift'
            },
            unit_amount: Math.round(body.amount * 100)
          },
          quantity: 1
        }],
        metadata: {
          org_id: body.org_id || '',
          user_id: body.user_id || '',
          fund_designation: body.fund_designation || 'tithe',
          given_by_name: body.given_by_name || '',
          given_by_email: body.given_by_email || '',
          is_anonymous: body.is_anonymous ? 'true' : 'false',
          is_recurring: 'false',
          notes: body.notes || '',
          ministry_id: body.ministry_id || '',
          type: 'giving'
        },
        customer_email: body.customer_email,
        success_url: body.success_url || `${body.org_domain}/give?success=true`,
        cancel_url: body.cancel_url || `${body.org_domain}/give`,
      });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ChurchGPT SaaS subscription flow
    if (body.type === 'churchgpt_subscription') {
      const { plan_name, org_id: subOrgId, user_email, return_url } = body;
      if (!plan_name || !subOrgId) throw new Error("plan_name and org_id are required");

      const priceMap: Record<string, string> = {
        lite:       body.stripe_price_id_lite       ?? Deno.env.get("STRIPE_PRICE_LITE")       ?? "",
        pro:        body.stripe_price_id_pro        ?? Deno.env.get("STRIPE_PRICE_PRO")        ?? "",
        enterprise: body.stripe_price_id_enterprise ?? Deno.env.get("STRIPE_PRICE_ENTERPRISE") ?? "",
      };

      const stripePriceId = priceMap[plan_name];
      if (!stripePriceId) throw new Error(`No Stripe price ID configured for plan: ${plan_name}`);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user_email ?? undefined,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `https://ai.churchos-ai.website/churchgpt/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://ai.churchos-ai.website/churchgpt/upgrade/`,
        subscription_data: {
          metadata: {
            org_id:    subOrgId,
            plan_name: plan_name,
          },
          trial_period_days: plan_name === 'lite' ? 14 : 0,
        },
        metadata: {
          org_id:    subOrgId,
          plan_name: plan_name,
          platform:  "church_os",
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // existing cart logic continues below...
    const { cart, orgId, customerEmail, shippingDetails } = body;

    if (!cart || cart.length === 0) throw new Error("Cart is empty");

    const origin = req.headers.get("origin") || "https://jkc.church";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: cart.map((item: any) => ({
        price_data: {
          currency: "jpy",
          product_data: {
            name: item.name,
            ...(item.images?.[0] ? { images: [item.images[0]] } : {}),
          },
          unit_amount: Math.round(item.price),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      shipping_address_collection: { allowed_countries: ["JP", "US", "GB", "AU"] },
      success_url: `${origin}/merchandise/orders?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/merchandise/checkout`,
      metadata: {
        org_id: orgId || "",
        customer_name: shippingDetails
          ? `${shippingDetails.firstName} ${shippingDetails.lastName}`
          : "",
        address: shippingDetails?.address || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
