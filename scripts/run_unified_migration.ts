import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, writeFileSync } from 'fs';
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

const CONNECTION_STRING = process.env.SUPABASE_CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.error("Missing SUPABASE_CONNECTION_STRING in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log('🚀 Church OS — Unified Data Spine Migration');
    console.log('='.repeat(55));

    await client.connect();
    console.log('✅ Connected to Supabase!\n');

    const migrationFile = resolve(__dirname, '../supabase/migrations/20260309000000_unified_spine.sql');
    const sql = readFileSync(migrationFile, 'utf8');

    console.log('Running migration...');
    try {
        await client.query(sql);
        console.log('✅ Migration COMPLETED successfully.');
    } catch (e: any) {
        console.error('❌ Migration FAILED:');
        console.error(e.message);
    } finally {
        await client.end();
    }
}

main().catch(async (e: any) => {
    console.error(e);
    try { await client.end() } catch (e: any) { }
});
