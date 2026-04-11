
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
    // Match [text](url) and return url
    const match = val.match(/\[.*?\]\((.*?)\)/);
    if (match && match[1]) {
        return match[1];
    }
    return val;
}

async function main() {
    const csvPath = path.resolve(process.cwd(), 'scripts/batch4.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');
    const headers = parseCSVLine(lines[0]);
    
    const data = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = parseCSVLine(line);
        const obj: any = {};
        headers.forEach((h, i) => {
            let val: any = values[i];
            if (val === 'null' || val === '' || val === undefined) val = null;
            
            // Clean markdown links for website and donation_url
            if (h === 'website' || h === 'donation_url') {
                val = cleanMarkdownLink(val);
            }

            if (val === 'true') val = true;
            if (val === 'false') val = false;
            
            // Numbers
            if (['founding_year', 'member_count', 'ministry_count'].includes(h)) {
                if (typeof val === 'string') {
                    // Remove commas and stuff for large numbers like "90,000"
                    val = val.replace(/,/g, '');
                }
                val = parseInt(val) || 0;
            }
            obj[h] = val;
        });
        return obj;
    });

    console.log(`Prepared ${data.length} new churches for insertion.`);

    // Chunking to avoid large request payload
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('church_registry')
            .upsert(chunk, { onConflict: 'slug' });
        
        if (error) {
            console.error(`Error inserting chunk ${i / chunkSize}:`, error);
        } else {
            console.log(`Successfully inserted chunk ${i / chunkSize + 1}`);
        }
    }

    const { count } = await supabase
        .from('church_registry')
        .select('*', { count: 'exact', head: true });

    console.log(`Seeding complete. Total churches in database: ${count}`);
}

main().catch(console.error);
