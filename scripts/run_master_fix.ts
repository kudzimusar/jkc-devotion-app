
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

const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log('🚀 Running Master Fix Migration...');
    await client.connect();

    const sql = readFileSync(resolve(__dirname, './master_fix_schema.sql'), 'utf8');

    // Split into chunks if needed, but Postgres allows multiple commands in one query
    try {
        await client.query(sql);
        console.log('✅ Migration executed successfully!');
    } catch (e: any) {
        console.error('❌ Migration failed:', e.message);
        if (e.detail) console.error('Detail:', e.detail);
        if (e.where) console.error('Where:', e.where);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
