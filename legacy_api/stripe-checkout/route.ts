import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orgId, priceId } = body;

        if (!orgId || !priceId) {
            return NextResponse.json({ error: 'orgId and priceId are required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: org, error } = await supabase
            .from('organizations')
            .select('id, stripe_customer_id, domain')
            .eq('id', orgId)
            .single();

        if (error || !org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        let customerId = org.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                metadata: { org_id: org.id },
            });
            customerId = customer.id;
            await supabase
                .from('organizations')
                .update({ stripe_customer_id: customerId })
                .eq('id', org.id);
        }

        if (process.env.USE_MOCK_STRIPE === 'true') {
            return NextResponse.json({ url: `${req.headers.get('origin')}/mock-checkout?orgId=${org.id}&customerId=${customerId}&priceId=${priceId}` });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.get('origin')}/admin?success=true`,
            cancel_url: `${req.headers.get('origin')}/admin?canceled=true`,
            subscription_data: {
                metadata: {
                    org_id: org.id,
                },
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
