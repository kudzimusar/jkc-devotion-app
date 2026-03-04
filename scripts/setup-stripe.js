const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

async function setup() {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret || stripeSecret === 'sk_test_placeholder') {
        console.error('Please set STRIPE_SECRET_KEY in your environment before running this script.');
        process.exit(1);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-02-24.acacia' });

    try {
        console.log('Creating Stripe Products and Prices...');

        // Lite Product
        const liteProduct = await stripe.products.create({ name: 'Lite Tier (1k API calls/day)' });
        const litePrice = await stripe.prices.create({
            product: liteProduct.id,
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' },
        });
        console.log('Created Lite:', liteProduct.id, litePrice.id);

        // Pro Product
        const proProduct = await stripe.products.create({ name: 'Pro Tier (10k API calls/day)' });
        const proPrice = await stripe.prices.create({
            product: proProduct.id,
            unit_amount: 7900,
            currency: 'usd',
            recurring: { interval: 'month' },
        });
        console.log('Created Pro:', proProduct.id, proPrice.id);

        // Enterprise Product
        const entProduct = await stripe.products.create({ name: 'Enterprise Tier (Unlimited)' });
        // Enterprise usually has custom pricing, but we create a 0 or nominal amount, or contact us.
        // For this, we'll just not create a standard price or make it a high configurable amount.
        const entPrice = await stripe.prices.create({
            product: entProduct.id,
            unit_amount: 99900,
            currency: 'usd',
            recurring: { interval: 'month' },
        });
        console.log('Created Enterprise:', entProduct.id, entPrice.id);

        // Write to .env.local
        const envPath = path.join(__dirname, '..', '.env.local');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

        const newVars = `\nNEXT_PUBLIC_STRIPE_PRICE_LITE=${litePrice.id}\nNEXT_PUBLIC_STRIPE_PRICE_PRO=${proPrice.id}\nNEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=${entPrice.id}\n`;
        fs.writeFileSync(envPath, envContent + newVars);

        console.log('Successfully written Stripe IDs to .env.local!');
    } catch (error) {
        console.error('Error setting up Stripe:', error.message);
    }
}

setup();
