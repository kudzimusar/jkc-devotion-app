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
    await client.connect();
    // Use the actual file path that worked before
    const migrationFile = resolve(__dirname, '../supabase/migrations/20260309000003_schema_alignment.sql');
    const sql = readFileSync(migrationFile, 'utf8');
    await client.query(sql);
    console.log('✅ Schema alignment applied.');
    await client.end();
}

main().catch(async (e: any) => {
    console.error(e);
    try { await client.end() } catch (e: any) { }
});
