import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { orgId } = await req.json();

        if (!orgId) {
            return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: org, error } = await supabase
            .from('organizations')
            .select('stripe_customer_id')
            .eq('id', orgId)
            .single();

        if (error || !org || !org.stripe_customer_id) {
            return NextResponse.json({ error: 'Organization or Stripe Customer not found' }, { status: 404 });
        }

        if (process.env.USE_MOCK_STRIPE === 'true') {
            return NextResponse.json({ url: `${req.headers.get('origin')}/mock-portal?customerId=${org.stripe_customer_id}` });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: `${req.headers.get('origin')}/admin`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error: any) {
        console.error('Stripe Portal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
