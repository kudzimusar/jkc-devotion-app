import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(url, key);

async function main() {
    console.log("Testing joined member directory query...");
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(`
            *,
            milestones:member_milestones(*),
            ministry_members(*),
            member_skills(*),
            org_members(role, stage, discipleship_score, joined_at)
        `)
        .limit(1);

    if (error) {
        console.error("Query failed:", error.message);
    } else {
        console.log("Query success! Data:", JSON.stringify(data, null, 2));
    }
}

main().catch(console.error);
