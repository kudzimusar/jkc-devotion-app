import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
});

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();
    const sql = `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.profiles (id, name, email, membership_status)
          VALUES (
            new.id, 
            new.raw_user_meta_data->>'full_name', 
            new.email,
            COALESCE(new.raw_user_meta_data->>'membership_status', 'visitor')
          );
          
          INSERT INTO public.user_progress (user_id)
          VALUES (new.id);
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    await client.query(sql);
    console.log("Trigger function updated successfully.");
    await client.end();
}

main().catch(console.error);
