import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature || !webhookSecret) {
            return NextResponse.json(
                { error: 'Missing stripe signature or webhook secret' },
                { status: 400 }
            );
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook Error: ${err.message}`);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;
                const customerId = subscription.customer as string;
                const priceId = subscription.items?.data?.[0]?.price?.id;

                let tier = 'lite';
                if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
                    tier = 'pro';
                } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE) {
                    tier = 'enterprise';
                } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE) {
                    tier = 'lite';
                }

                await supabase
                    .from('organizations')
                    .update({ subscription_status: 'active', tier })
                    .eq('stripe_customer_id', customerId);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                const customerId = subscription.customer as string;

                const { data: org } = await supabase
                    .from('organizations')
                    .update({ subscription_status: 'canceled' })
                    .eq('stripe_customer_id', customerId)
                    .select('id')
                    .single();

                if (org) {
                    await supabase
                        .from('api_keys')
                        .update({ is_active: false })
                        .eq('org_id', org.id);
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                const customerId = invoice.customer as string;

                await supabase
                    .from('organizations')
                    .update({ subscription_status: 'past_due' })
                    .eq('stripe_customer_id', customerId);
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
