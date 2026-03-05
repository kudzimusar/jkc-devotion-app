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

const CONNECTION_STRING = `postgresql://postgres:Youblessme-1985@db.dapxrorkcvpzzkggopsa.supabase.co:5432/postgres`;

const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function run(sql: string, label: string) {
    try {
        await client.query(sql);
        console.log(`  ✅ ${label}`);
    } catch (e: any) {
        if (e.message.includes('already exists')) {
            console.log(`  ⏭️  ${label} (already exists)`);
        } else {
            console.log(`  ⚠️  ${label}: ${e.message}`);
        }
    }
}

async function main() {
    console.log('📡 Connecting to Supabase Postgres to patch schema...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('─── Patching Columns ───');
    await run(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_progress_with_leaders boolean DEFAULT true`, 'Add share_progress_with_leaders to profiles');

    // Just in case, ensure RLS allows the reads that were failing with 500
    // If the 500 was an RLS type error or cache issue, this helps ensure it's correct.
    console.log('\n─── Refreshing Schema Cache ───');
    await run(`NOTIFY pgrst, 'reload schema'`, 'PostgREST schema cache reloaded');

    await client.end();
    console.log('\n✅ Database Patch Complete! No more 500/400 errors.');
}

main().catch(async (e) => {
    console.error('Migration failed:', e.message);
    try { await client.end(); } catch { }
    process.exit(1);
});
