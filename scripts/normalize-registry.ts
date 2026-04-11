
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
    // Normalize United States to USA
    const { error: err1 } = await supabase
        .from('church_registry')
        .update({ country: 'USA' })
        .eq('country', 'United States');
    
    if (err1) console.error(err1);
    else console.log("Normalized 'United States' to 'USA'");

    // Normalize South Africa naming if inconsistencies exist
    // (None seen yet, but good to be careful)
    
    console.log("Cleanup complete.");
}

main().catch(console.error);
