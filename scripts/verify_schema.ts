import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
try {
    const envFile = readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1]] = match[2];
    });
} catch (e: any) { /* already in env */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

// Execute SQL via rpc or direct fetch to management API
async function executeSql(sql: string): Promise<void> {
    // Use the pg endpoint through REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_raw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ sql })
    });

    if (!response.ok) {
        // Try alternative approach - split statements
        throw new Error(`SQL execution failed: ${response.statusText} - ${await response.text()}`);
    }
}

async function verifySchema() {
    console.log('\n📊 Verifying schema...');
    const tables = [
        'organizations', 'api_keys', 'devotions', 'profiles', 'households',
        'org_members', 'member_stats', 'soap_entries', 'prayer_requests',
        'attendance_records', 'ministry_members', 'pastoral_notes',
        'fellowship_groups', 'fellowship_group_members', 'evangelism_pipeline',
        'financial_records', 'events', 'ai_insights'
    ];

    const results: Record<string, { exists: boolean; count: number }> = {};

    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        results[table] = {
            exists: !error || error.code !== 'PGRST204',
            count: count || 0
        };

        if (error && error.code !== 'PGRST116') {
            console.log(`  ⚠️  ${table}: ${error.message}`);
        } else {
            console.log(`  ✅ ${table}: ${count || 0} rows`);
        }
    }

    return results;
}

async function migrateDevo() {
    console.log('\n📖 Migrating devotions...');
    const devotions = JSON.parse(readFileSync(resolve(__dirname, '../src/data/devotions.json'), 'utf8'));

    const rows = devotions.map((d: any) => ({
        date: d.date,
        week: d.week,
        theme: d.theme,
        title: d.title,
        scripture: d.scripture,
        declaration: d.declaration,
        week_theme: d.week_theme
    }));

    const { error } = await supabase.from('devotions').upsert(rows, { onConflict: 'date' });
    if (error) {
        console.log(`  ⚠️  Devotions upsert: ${error.message}`);
    } else {
        console.log(`  ✅ ${rows.length} devotions migrated`);
    }
}

async function main() {
    console.log('🚀 Church OS — Database Verification & Migration');
    console.log('='.repeat(55));
    console.log(`📡 Project: ${supabaseUrl}`);

    // Verify schema
    const results = await verifySchema();

    // Migrate devotions
    await migrateDevo();

    // Summary
    const existing = Object.values(results).filter(r => r.exists).length;
    const missing = Object.values(results).filter(r => !r.exists).length;

    console.log('\n' + '='.repeat(55));
    console.log(`✅ Tables confirmed: ${existing}`);
    if (missing > 0) {
        console.log(`⚠️  Missing tables: ${missing} — please run church_os_migration.sql in Supabase SQL Editor`);
        console.log(`   SQL file: /tmp/church_os_migration.sql`);
    }
    console.log('='.repeat(55));
}

main().catch(console.error);
