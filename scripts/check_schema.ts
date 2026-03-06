
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const CONNECTION_STRING = env.SUPABASE_CONNECTION_STRING || `postgresql://postgres.dapxrorkcvpzzkggopsa:Youblessme-1985@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`;

console.log('Using connection string:', CONNECTION_STRING.replace(/:[^@]+@/, ':***@'));

const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();

    console.log('\n--- TABLES ---');
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    `);
    tables.rows.forEach(r => console.log(r.table_name));

    const existingTables = new Set(tables.rows.map(r => r.table_name));

    console.log('\n--- CHECKING org_id IN COMMON TABLES ---');
    const tablesToCheck = [
        'households', 'devotions', 'member_stats', 'soap_entries',
        'prayer_requests', 'attendance_records', 'ministry_members',
        'pastoral_notes', 'fellowship_groups', 'evangelism_pipeline',
        'financial_records', 'events', 'ai_insights', 'forms', 'form_submissions'
    ];

    for (const t of tablesToCheck) {
        if (!existingTables.has(t)) {
            console.log(`${t}: ❌ TABLE MISSING`);
            continue;
        }
        const check = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '${t}' AND column_name = 'org_id' AND table_schema = 'public';
        `);
        console.log(`${t}: ${check.rows.length > 0 ? '✅ org_id exists' : '❌ missing org_id'}`);
    }

    await client.end();
}

main().catch(console.error);
