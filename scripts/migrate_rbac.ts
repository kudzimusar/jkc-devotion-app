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

    console.log("Applying RBAC Migration...");

    const sql = `
        -- 1. Create roles table
        CREATE TABLE IF NOT EXISTS public.roles (
            name text PRIMARY KEY,
            level int NOT NULL,
            description text,
            permissions jsonb DEFAULT '[]'
        );

        -- 2. Populate default roles
        INSERT INTO public.roles (name, level, description, permissions) VALUES
        ('super_admin', 100, 'System governance and full administrative access.', '["all"]'),
        ('owner', 90, 'Full organization ownership and billing control.', '["org_manage", "user_manage", "financials"]'),
        ('shepherd', 80, 'Pastoral care lead with community management access.', '["user_manage", "care_manage", "reports"]'),
        ('admin', 70, 'General administrative access for daily operations.', '["user_view", "event_manage", "reports"]'),
        ('ministry_lead', 60, 'Leader of a specific ministry or department.', '["ministry_manage", "reports"]'),
        ('ministry_leader', 60, 'Leader of a specific ministry or department.', '["ministry_manage", "reports"]'),
        ('member', 10, 'Standard church member with profile access.', '["profile_manage"]')
        ON CONFLICT (name) DO UPDATE SET 
            level = EXCLUDED.level,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions;

        -- 3. Create user_roles (multi-role linking)
        CREATE TABLE IF NOT EXISTS public.user_roles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
            role_name text REFERENCES public.roles(name),
            assigned_by uuid REFERENCES auth.users(id),
            assigned_at timestamptz DEFAULT now(),
            status text DEFAULT 'active',
            UNIQUE(user_id, org_id, role_name)
        );

        -- 4. Sync existing roles from org_members to user_roles
        INSERT INTO public.user_roles (user_id, org_id, role_name, assigned_at)
        SELECT user_id, org_id, role, joined_at FROM public.org_members
        ON CONFLICT (user_id, org_id, role_name) DO NOTHING;
        
        -- 5. Enable RLS
        ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Public roles read" ON public.roles;
        CREATE POLICY "Public roles read" ON public.roles FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
        CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
    `;

    await client.query(sql);
    console.log("RBAC Migration applied successfully.");

    await client.end();
}

main().catch(console.error);
