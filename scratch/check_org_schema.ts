
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function checkSchema() {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Error fetching organizations:", error);
    } else {
        console.log("Organization columns:", Object.keys(data[0] || {}));
        console.log("Sample data:", data[0]);
    }
}

checkSchema();
