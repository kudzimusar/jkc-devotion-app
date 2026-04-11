
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function parseCSVLine(line: string) {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

function cleanMarkdownLink(val: string | null) {
    if (!val) return val;
    const match = val.match(/\[.*?\]\((.*?)\)/);
    if (match && match[1]) {
        return match[1];
    }
    return val;
}

async function main() {
    const csvPath = path.resolve(process.cwd(), 'scripts/japan-batch-7.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found!");
        return;
    }
    
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');
    const headers = parseCSVLine(lines[0]);
    
    const data = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = parseCSVLine(line);
        const obj: any = {};
        headers.forEach((h, i) => {
            let val: any = values[i];
            if (val === 'null' || val === '' || val === undefined) val = null;
            
            if (h === 'website' || h === 'donation_url') {
                val = cleanMarkdownLink(val);
            }

            if (val === 'true') val = true;
            if (val === 'false') val = false;
            
            if (['founding_year', 'member_count', 'ministry_count'].includes(h)) {
                if (typeof val === 'string') {
                    val = val.replace(/,/g, '');
                }
                val = parseInt(val) || 0;
            }
            obj[h] = val;
        });
        return obj;
    });

    console.log(`Syncing ${data.length} churches. (Upsert enabled: No duplicates will be created)`);

    const chunkSize = 50;
    let updatedCount = 0;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('church_registry')
            .upsert(chunk, { onConflict: 'slug' });
        
        if (error) {
            console.error(`Error syncing chunk ${i / chunkSize}:`, error);
        } else {
            updatedCount += chunk.length;
            console.log(`Processed ${updatedCount}/${data.length} entries...`);
        }
    }

    const { count } = await supabase
        .from('church_registry')
        .select('*', { count: 'exact', head: true });

    console.log(`Registry sync complete.`);
    console.log(`Final Database Count: ${count}`);
}

main().catch(console.error);
