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

    console.log("Checking user: kudzimusar@gmail.com");

    const profileRes = await client.query("SELECT * FROM profiles WHERE email = 'kudzimusar@gmail.com'");
    if (profileRes.rows.length === 0) {
        console.log("No profile found for kudzimusar@gmail.com");
    } else {
        const profile = profileRes.rows[0];
        console.log("Profile:", profile);

        const orgMembersRes = await client.query("SELECT * FROM org_members WHERE user_id = $1", [profile.id]);
        console.log("Org Members entries:", orgMembersRes.rows);

        const memberRolesRes = await client.query("SELECT * FROM member_roles WHERE user_id = $1", [profile.id]);
        console.log("Member Roles entries:", memberRolesRes.rows);
    }

    await client.end();
}

main().catch(console.error);
