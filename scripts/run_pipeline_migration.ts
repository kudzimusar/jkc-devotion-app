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
    console.log('🚀 Church OS — Pipeline DB Migration');
    console.log('='.repeat(55));

    await client.connect();
    console.log('✅ Connected direct via pg!\n');

    // 1. Extend profiles
    console.log('\n─── Extending profiles table ───');
    const profileCols = [
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_type text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_in_japan int`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tithe_status boolean DEFAULT false`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_giving_method text`,
    ];
    for (const col of profileCols) {
        await run(col, col.replace('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ', '').split(' ')[0]);
    }

    // 2. member_milestones
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

    // 3. member_roles
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

    // 4. Update prayer_requests
    await run(`ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS requires_pastoral_contact boolean DEFAULT false`, 'prayer_requests: requires_pastoral_contact');

    // 5. devotion_logs
    await run(`CREATE TABLE IF NOT EXISTS public.devotion_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        date date NOT NULL,
        completion_status boolean DEFAULT true,
        streak_count int DEFAULT 0,
        devotion_time timestamptz DEFAULT now(),
        UNIQUE(user_id, date)
    )`, 'devotion_logs');

    // 6. soap_sentiment_metrics
    await run(`CREATE TABLE IF NOT EXISTS public.soap_sentiment_metrics (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        entry_id uuid REFERENCES public.soap_entries(id) ON DELETE CASCADE,
        date date NOT NULL,
        emotion_category text,
        keywords text[],
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, date)
    )`, 'soap_sentiment_metrics');

    // 7. service_attendance
    await run(`CREATE TABLE IF NOT EXISTS public.service_attendance (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        service_date date NOT NULL,
        attendance_type text NOT NULL,
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, service_date)
    )`, 'service_attendance');

    // 8. member_skills
    await run(`CREATE TABLE IF NOT EXISTS public.member_skills (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        skill_name text NOT NULL,
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, skill_name)
    )`, 'member_skills');

    // 9. households & household_members
    await run(`CREATE TABLE IF NOT EXISTS public.households (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        head_id uuid REFERENCES auth.users(id),
        household_name text,
        created_at timestamptz DEFAULT now()
    )`, 'households');

    await run(`CREATE TABLE IF NOT EXISTS public.household_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
        user_id uuid REFERENCES auth.users(id),
        full_name text,
        relationship text,
        created_at timestamptz DEFAULT now()
    )`, 'household_members');

    // 10. fellowship_groups & members
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

    // Ensure RLS enabled on new tables
    console.log('\n─── Row Level Security ───');
    const newTables = ['member_milestones', 'member_roles', 'devotion_logs', 'soap_sentiment_metrics', 'service_attendance', 'member_skills', 'households', 'household_members', 'fellowship_groups', 'fellowship_members'];
    for (const t of newTables) {
        await run(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`, `RLS: ${t}`);
    }

    console.log('\n─── RLS Policies ───');
    const adminRoles = `('shepherd', 'admin', 'owner', 'ministry_lead')`;
    const adminCheck = `EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ${adminRoles})`;

    const policies = [
        { table: 'member_milestones', adminAccess: true, userOwns: true },
        { table: 'member_roles', adminAccess: true, userOwns: true },
        { table: 'devotion_logs', adminAccess: true, userOwns: true },
        { table: 'soap_sentiment_metrics', adminAccess: true, userOwns: true },
        { table: 'service_attendance', adminAccess: true, userOwns: true },
        { table: 'member_skills', adminAccess: true, userOwns: true },
        { table: 'households', adminAccess: true, userOwns: true, userCol: 'head_id' },
        { table: 'household_members', adminAccess: true, userOwns: false }, // Managed via household ownership or specific rules
        { table: 'fellowship_groups', adminAccess: true, userOwns: false },
        { table: 'fellowship_members', adminAccess: true, userOwns: true }
    ];

    for (const p of policies) {
        if (p.userOwns) {
            const col = p.userCol || 'user_id';
            await run(`DROP POLICY IF EXISTS "Users manage own ${p.table}" ON public.${p.table}; CREATE POLICY "Users manage own ${p.table}" ON public.${p.table} FOR ALL USING (${col} = auth.uid())`, `policy: ${p.table} user_owns`);
        }
        if (p.adminAccess) {
            await run(`DROP POLICY IF EXISTS "Admins read all ${p.table}" ON public.${p.table}; CREATE POLICY "Admins read all ${p.table}" ON public.${p.table} FOR SELECT USING (${adminCheck})`, `policy: ${p.table} admin_read`);
        }
    }

    // Special case for household_members: allow management if user_id matches OR if they are the head of the associated household
    await run(`DROP POLICY IF EXISTS "Manage household members" ON public.household_members; 
               CREATE POLICY "Manage household members" ON public.household_members FOR ALL USING (
                 user_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_id AND h.head_id = auth.uid())
               )`, 'policy: household_members combined');

    // 11. Trigger for fellowship member count
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

    console.log('\n─── Reloading PostgREST schema cache ───');
    await run(`NOTIFY pgrst, 'reload schema'`, 'PostgREST schema reload');

    await client.end();
    console.log('✅ Done!');
}

main().catch(async e => {
    console.error(e);
    try { await client.end() } catch { }
});
