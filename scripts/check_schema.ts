
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
});

const PROJECT_REF = 'dapxrorkcvpzzkggopsa';
const DB_PASSWORD = 'Youblessme-1985';
const CONNECTION_STRING = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;

const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();

    console.log('--- TABLES ---');
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    `);
    tables.rows.forEach(r => console.log(r.table_name));

    console.log('\n--- COLUMNS FOR org_members ---');
    const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'org_members' AND table_schema = 'public';
    `);
    cols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    console.log('\n--- CHECKING org_id IN COMMON TABLES ---');
    const tablesToCheck = [
        'households', 'devotions', 'member_stats', 'soap_entries',
        'prayer_requests', 'attendance_records', 'ministry_members',
        'pastoral_notes', 'fellowship_groups', 'evangelism_pipeline',
        'financial_records', 'events', 'ai_insights'
    ];

    for (const t of tablesToCheck) {
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
