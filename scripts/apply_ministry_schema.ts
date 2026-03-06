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

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log('🚀 Starting Strategic Ministry Migration...');
    await client.connect();

    const migrationFile = resolve(__dirname, '../supabase/migrations/20260316000000_strategic_ministry_fix.sql');
    const sql = readFileSync(migrationFile, 'utf8');

    console.log('📄 Executing SQL migration...');
    await client.query(sql);

    console.log('✅ Strategic Operational Schema Applied successfully.');
    await client.end();
}

main().catch(async (e: any) => {
    console.error('❌ Migration Failed:', e.message);
    try { await client.end() } catch (e: any) { }
    process.exit(1);
});
