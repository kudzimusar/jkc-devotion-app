import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createOrg() {
    const { data, error } = await supabase.from('organizations').insert([{
        name: "Test Church from Automation",
        domain: "testchurch.example.com",
        stripe_customer_id: "cus_mock_456"
    }]).select('*').single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Created Org ID:", data.id);
    }
}

createOrg();
