import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashApiKey(apiKey: string): Promise<string> {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function setup() {
    console.log("Setting up test data...");

    // Create an organization
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name: "Test Church",
            domain: "test-church.com"
        })
        .select()
        .single();

    if (orgError) {
        console.error("Error creating org:", orgError);
        return;
    }

    // Generate a random key
    const rawKey = 'test_key_' + Math.random().toString(36).substring(2, 15);
    const keyHash = await hashApiKey(rawKey);

    const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .insert({
            org_id: orgData.id,
            key_hash: keyHash,
            key_preview: rawKey.substring(0, 4),
            is_active: true
        })
        .select()
        .single();

    if (keyError) {
        console.error("Error creating key:", keyError);
        return;
    }

    console.log("\n=================================");
    console.log("Test Setup Complete!");
    console.log(`Generated Raw API Key: ${rawKey}`);
    console.log(`Generated Key Hash (SHA-256): ${keyHash}`);
    console.log(`Organization Domain: test-church.com`);
    console.log("=================================\n");
    console.log("You can now test this with local Next.js server running (npm run dev)");
    console.log("\n1. Successful Request:");
    console.log(`curl -i -H "x-api-key: ${rawKey}" -H "Origin: https://test-church.com" http://localhost:3000/api/v1/devotion/today`);

    console.log("\n2. Failed Request (Wrong Domain):");
    console.log(`curl -i -H "x-api-key: ${rawKey}" -H "Origin: https://hackersite.com" http://localhost:3000/api/v1/devotion/today`);

    console.log("\n3. Failed Request (Invalid Key):");
    console.log(`curl -i -H "x-api-key: wrong_key_here" -H "Origin: https://test-church.com" http://localhost:3000/api/v1/devotion/today`);
}

setup();
