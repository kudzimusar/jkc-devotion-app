import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    try {
        const { orgId, customerId, priceId } = await req.json();

        if (!orgId || !customerId || !priceId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_123';

        // Create a mock stripe event payload
        const payload = {
            id: `evt_mock_${Date.now()}`,
            object: 'event',
            api_version: '2025-02-24.acacia',
            created: Math.floor(Date.now() / 1000),
            type: 'customer.subscription.created',
            data: {
                object: {
                    id: `sub_mock_${Date.now()}`,
                    object: 'subscription',
                    customer: customerId,
                    items: {
                        object: 'list',
                        data: [
                            {
                                object: 'subscription_item',
                                price: {
                                    id: priceId,
                                }
                            }
                        ]
                    }
                }
            }
        };

        const payloadString = JSON.stringify(payload, null, 2);
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { apiVersion: '2025-02-24.acacia' as any });

        // Generate valid Stripe signature using our secret
        const signature = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret: webhookSecret,
        });

        // Fire it at our own webhook route
        const selfUrl = new URL(req.url).origin;
        const res = await fetch(`${selfUrl}/api/webhooks/stripe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': signature,
            },
            body: payloadString,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Webhook simulation failed: ${err}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Mock Checkout Simulation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
