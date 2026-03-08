import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
const env: any = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const client = new Client({
    connectionString: env.SUPABASE_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();
    const res1 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'member_milestones'");
    console.log("Member Milestones Columns:", res1.rows.map(r => r.column_name));

    const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ministry_members'");
    console.log("Ministry Members Columns:", res2.rows.map(r => r.column_name));

    await client.end();
}

main().catch(console.error);
