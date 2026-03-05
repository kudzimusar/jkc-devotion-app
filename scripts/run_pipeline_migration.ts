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

const CONNECTION_STRING = process.env.SUPABASE_CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.error("Missing SUPABASE_CONNECTION_STRING in .env.local");
    process.exit(1);
}

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
            console.log(`  ⚠️  ${label}: ${e.message.substring(0, 120)}`);
        }
    }
}

async function main() {
    console.log('🚀 Church OS — Ultimate Data Pipeline Migration');
    console.log('='.repeat(55));

    await client.connect();
    console.log('✅ Connected direct via pg!\n');

    // 0. Base Extensions
    await run(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`, 'Extension: uuid-ossp');

    // 1. Core Profile Extensions
    console.log('\n─── Core Infrastructure ───');
    const profileCols = [
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_type text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_in_japan int`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tithe_status boolean DEFAULT false`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_giving_method text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_status text DEFAULT 'visitor'`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baptism_status text DEFAULT 'not_baptized'`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthdate date`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'EN'`,
    ];
    for (const col of profileCols) {
        await run(col, col.replace('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ', '').split(' ')[0]);
    }

    // 2. Org Members (Role Based Access)
    await run(`CREATE TABLE IF NOT EXISTS public.org_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        role text NOT NULL DEFAULT 'member',
        created_at timestamptz DEFAULT now()
    )`, 'org_members');

    // 3. SOAP Entries
    await run(`CREATE TABLE IF NOT EXISTS public.soap_entries (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        day_number int NOT NULL,
        scripture text,
        observation text,
        application text,
        prayer text,
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, day_number)
    )`, 'soap_entries');

    // 4. Member Stats
    await run(`CREATE TABLE IF NOT EXISTS public.member_stats (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        current_streak int DEFAULT 0,
        total_completed int DEFAULT 0,
        last_devotion_date date,
        updated_at timestamptz DEFAULT now()
    )`, 'member_stats');

    // 5. Ministry & Roles
    await run(`CREATE TABLE IF NOT EXISTS public.member_roles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        ministry_name text NOT NULL,
        role_title text,
        is_leader boolean DEFAULT false,
        start_date date,
        active_status boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
    )`, 'member_roles');

    // 6. Growth & Evangelism
    await run(`CREATE TABLE IF NOT EXISTS public.evangelism_pipeline (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        prospect_name text NOT NULL,
        stage text NOT NULL DEFAULT 'invited_visitor',
        contact_info text,
        assigned_to uuid REFERENCES auth.users(id),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )`, 'evangelism_pipeline');

    await run(`CREATE TABLE IF NOT EXISTS public.member_milestones (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        invited_by uuid REFERENCES auth.users(id),
        first_visit_date date,
        salvation_date date,
        baptism_date date,
        membership_date date,
        foundations_completed boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )`, 'member_milestones');

    // 7. Finance & Giving
    await run(`CREATE TABLE IF NOT EXISTS public.financial_records (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        amount decimal NOT NULL,
        record_type text NOT NULL,
        given_date date DEFAULT CURRENT_DATE,
        is_anonymous boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
    )`, 'financial_records');

    // 8. Events & Attendance
    await run(`CREATE TABLE IF NOT EXISTS public.events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        title text NOT NULL,
        description text,
        event_date timestamptz NOT NULL,
        location text,
        is_published boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
    )`, 'events');

    await run(`CREATE TABLE IF NOT EXISTS public.service_attendance (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
        service_date date NOT NULL,
        attendance_type text NOT NULL,
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, service_date)
    )`, 'service_attendance');

    // 9. Households
    await run(`CREATE TABLE IF NOT EXISTS public.households (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        head_id uuid REFERENCES auth.users(id),
        household_name text,
        created_at timestamptz DEFAULT now()
    )`, 'households');
    await run(`ALTER TABLE public.households ADD COLUMN IF NOT EXISTS head_id uuid REFERENCES auth.users(id)`, 'households: head_id');

    await run(`CREATE TABLE IF NOT EXISTS public.household_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
        user_id uuid REFERENCES auth.users(id),
        full_name text,
        relationship text,
        created_at timestamptz DEFAULT now()
    )`, 'household_members');

    // 10. Fellowship Groups
    await run(`CREATE TABLE IF NOT EXISTS public.fellowship_groups (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        location text,
        meeting_frequency text DEFAULT 'weekly',
        is_active boolean DEFAULT true,
        member_count int DEFAULT 0,
        created_at timestamptz DEFAULT now()
    )`, 'fellowship_groups');

    await run(`CREATE TABLE IF NOT EXISTS public.fellowship_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id uuid REFERENCES public.fellowship_groups(id) ON DELETE CASCADE,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        joined_at timestamptz DEFAULT now(),
        UNIQUE(group_id, user_id)
    )`, 'fellowship_members');

    // 11. AI & Analytics
    await run(`CREATE TABLE IF NOT EXISTS public.ai_insights (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        insight_type text NOT NULL,
        title text NOT NULL,
        description text,
        suggested_action text,
        priority text DEFAULT 'info',
        is_acknowledged boolean DEFAULT false,
        generated_at timestamptz DEFAULT now()
    )`, 'ai_insights');

    // 12. Row Level Security Setup
    console.log('\n─── Security & RLS ───');
    const allTables = [
        'profiles', 'org_members', 'soap_entries', 'member_stats',
        'member_roles', 'evangelism_pipeline', 'member_milestones',
        'financial_records', 'events', 'service_attendance',
        'households', 'household_members', 'fellowship_groups', 'fellowship_members',
        'ai_insights'
    ];

    for (const t of allTables) {
        await run(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`, `RLS: ${t}`);
    }

    const adminRoles = `('super_admin', 'owner', 'shepherd', 'admin', 'ministry_lead')`;
    const adminCheck = `EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ${adminRoles})`;

    const userOwned = [
        { t: 'profiles', c: 'id' },
        { t: 'soap_entries', c: 'user_id' },
        { t: 'member_stats', c: 'user_id' },
        { t: 'member_roles', c: 'user_id' },
        { t: 'member_milestones', c: 'user_id' },
        { t: 'service_attendance', c: 'user_id' },
        { t: 'fellowship_members', c: 'user_id' }
    ];
    for (const { t, c } of userOwned) {
        await run(`DROP POLICY IF EXISTS "Users own ${t}" ON public.${t}; CREATE POLICY "Users own ${t}" ON public.${t} FOR ALL USING (${c} = auth.uid())`, `Policy: ${t} (user)`);
        await run(`DROP POLICY IF EXISTS "Admins read ${t}" ON public.${t}; CREATE POLICY "Admins read ${t}" ON public.${t} FOR SELECT USING (${adminCheck})`, `Policy: ${t} (admin)`);
    }

    await run(`DROP POLICY IF EXISTS "Heads own households" ON public.households; CREATE POLICY "Heads own households" ON public.households FOR ALL USING (head_id = auth.uid())`, `Policy: households`);
    await run(`DROP POLICY IF EXISTS "Admins read households" ON public.households; CREATE POLICY "Admins read households" ON public.households FOR SELECT USING (${adminCheck})`, `Policy: households (admin)`);

    await run(`DROP POLICY IF EXISTS "Manage household members" ON public.household_members; 
               CREATE POLICY "Manage household members" ON public.household_members FOR ALL USING (
                 user_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.head_id = auth.uid())
               )`, 'Policy: household_members');

    const adminOnly = ['financial_records', 'evangelism_pipeline', 'ai_insights', 'events', 'org_members', 'fellowship_groups'];
    for (const t of adminOnly) {
        await run(`DROP POLICY IF EXISTS "Admins manage ${t}" ON public.${t}; CREATE POLICY "Admins manage ${t}" ON public.${t} FOR ALL USING (${adminCheck})`, `Policy: ${t} (admin-only)`);
    }

    await run(`DROP POLICY IF EXISTS "Users see own org role" ON public.org_members; CREATE POLICY "Users see own org role" ON public.org_members FOR SELECT USING (user_id = auth.uid())`, `Policy: org_members (user)`);

    // 13. Trigger for fellowship member count
    await run(`
        CREATE OR REPLACE FUNCTION update_fellowship_member_count() RETURNS trigger AS $$
        BEGIN
            IF (TG_OP = 'INSERT') THEN
                UPDATE public.fellowship_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
            ELSIF (TG_OP = 'DELETE') THEN
                UPDATE public.fellowship_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS tr_fellowship_member_count ON public.fellowship_members;
        CREATE TRIGGER tr_fellowship_member_count AFTER INSERT OR DELETE ON public.fellowship_members FOR EACH ROW EXECUTE FUNCTION update_fellowship_member_count();
    `, 'trigger: fellowship_member_count');

    console.log('\n─── Performance & Cache ───');
    await run(`NOTIFY pgrst, 'reload schema'`, 'PostgREST reload');

    await client.end();
    console.log('\n✅ COMPLETED: Ultimate Data Pipeline established.');
}

main().catch(async e => {
    console.error(e);
    try { await client.end() } catch { }
});
