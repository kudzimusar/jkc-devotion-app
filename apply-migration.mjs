import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

// We use pg directly for running migrations since supabase JS client doesn't run raw SQL well.
// Wait, we can use an RPC, or pg. 
import { Client } from 'pg';

async function run() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    if (!connectionString) {
        console.error("No connection string");
        return;
    }

    const client = new Client({ connectionString });
    await client.connect();

    const sql = fs.readFileSync('supabase/migrations/20260326000000_org_readable.sql', 'utf8');
    console.log("Applying migration...");
    await client.query(sql);
    console.log("Migration applied.");
    await client.end();
}

run().catch(console.error);
