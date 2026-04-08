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

    const { cart, orgId, customerEmail, shippingDetails } = await req.json();

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
