
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
    const { data, error } = await supabase
        .from('church_registry')
        .select('country');
    
    if (error) {
        console.error(error);
        return;
    }

    const counts: Record<string, number> = {};
    data.forEach(c => {
        counts[c.country] = (counts[c.country] || 0) + 1;
    });

    console.log("Registry Status by Country:");
    Object.entries(counts)
        .sort((a,b) => b[1] - a[1])
        .forEach(([country, count]) => {
            console.log(`${country}: ${count}`);
        });
    
    const { count } = await supabase.from('church_registry').select('*', { count: 'exact', head: true });
    console.log(`\nTotal Global Registry: ${count} churches`);
}

main().catch(console.error);
