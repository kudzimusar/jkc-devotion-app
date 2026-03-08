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

    console.log("Fixing Foreign Keys for Members Directory detail tables...");

    const sql = `
        -- Link member_milestones to profiles
        ALTER TABLE public.member_milestones
        DROP CONSTRAINT IF EXISTS fk_member_milestones_profiles;
        
        ALTER TABLE public.member_milestones
        ADD CONSTRAINT fk_member_milestones_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;

        -- Link ministry_members to profiles
        ALTER TABLE public.ministry_members
        DROP CONSTRAINT IF EXISTS fk_ministry_members_profiles;
        
        ALTER TABLE public.ministry_members
        ADD CONSTRAINT fk_ministry_members_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
        
        -- Link member_skills to profiles if it exists and needs it
        ALTER TABLE public.member_skills
        DROP CONSTRAINT IF EXISTS fk_member_skills_profiles;
        
        ALTER TABLE public.member_skills
        ADD CONSTRAINT fk_member_skills_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    `;

    try {
        await client.query(sql);
        console.log("Foreign Keys added successfully.");
    } catch (err: any) {
        console.error("Failed to add foreign keys:", err.message);
    }

    await client.end();
}

main().catch(console.error);
