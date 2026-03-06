import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Get credentials from environment or fallback to project env file path (assume user runs this with env vars)
// We'll read from .env.local if available or use process.env
const loadEnv = () => {
    try {
        const envPath = path.resolve(__dirname, '../Users/shadreckmusarurwa/Project AI/jkc-devotion-app/.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1]] = match[2];
            }
        });
    } catch (e: any) {
        // Fallback for execution within project dir
        try {
            const envPath = path.resolve(process.cwd(), '.env.local');
            const envFile = fs.readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    process.env[match[1]] = match[2];
                }
            });
        } catch (e2: any) {
            console.log("Could not load .env.local automatically, assuming env vars are set.");
        }
    }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    try {
        const devotionsPath = path.resolve(process.cwd(), 'src/data/devotions.json');
        const data = fs.readFileSync(devotionsPath, 'utf-8');
        const devotions = JSON.parse(data);

        console.log(`Found ${devotions.length} devotions. Starting migration...`);

        let successCount = 0;
        let errorCount = 0;

        // Use upsert to handle updates gracefully
        const { data: resultData, error } = await supabase
            .from('devotions')
            .upsert(
                devotions.map((d: any) => ({
                    date: d.date,
                    week: d.week,
                    theme: d.theme,
                    title: d.title,
                    scripture: d.scripture,
                    declaration: d.declaration,
                    week_theme: d.week_theme
                })),
                { onConflict: 'date' }
            );

        if (error) {
            console.error("Error migrating devotions:", error);
            process.exit(1);
        }

        // Validation step
        const { count, error: countError } = await supabase
            .from('devotions')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error("Error validating migration:", countError);
        } else {
            console.log(`${count} records migrated successfully.`);
            if (count !== devotions.length) {
                console.warn(`Warning: Expected ${devotions.length} records, but found ${count}.`);
            }
        }

    } catch (error: any) {
        console.error("Migration failed:", error);
    }
}

migrate();
