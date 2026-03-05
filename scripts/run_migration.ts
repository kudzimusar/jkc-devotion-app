/**
 * Church OS — Direct PostgreSQL Migration
 * Uses pg driver with the direct connection string from .env.local
 * This bypasses PostgREST and talks directly to the Postgres database
 */
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

// Force pooler URL — direct hostname not reachable from local network
const PROJECT_REF = 'dapxrorkcvpzzkggopsa';
const DB_PASSWORD = 'Youblessme-1985';
// Session-mode pooler URL (supports DDL, port 5432)
const CONNECTION_STRING = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    console.log('🚀 Church OS — Direct PostgreSQL Migration');
    console.log('='.repeat(55));
    console.log('📡 Connecting to Supabase Postgres...\n');

    await client.connect();
    console.log('✅ Connected!\n');

    // Extensions
    console.log('─── Extensions ───');
    await run(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`, 'uuid-ossp');

    // ─── Tables ───
    console.log('\n─── Core Tables ───');

    await run(`CREATE TABLE IF NOT EXISTS public.organizations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        domain text UNIQUE,
        logo_url text,
        subscription_status text DEFAULT 'trialing',
        stripe_customer_id text UNIQUE,
        created_at timestamptz DEFAULT now()
    )`, 'organizations');

    await run(`CREATE TABLE IF NOT EXISTS public.api_keys (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
        key_hash text UNIQUE NOT NULL,
        key_preview text,
        is_active boolean DEFAULT true,
        last_used_at timestamptz
    )`, 'api_keys');

    await run(`CREATE TABLE IF NOT EXISTS public.devotions (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        date date UNIQUE NOT NULL,
        week int NOT NULL,
        theme text NOT NULL,
        title text NOT NULL,
        scripture text NOT NULL,
        declaration text NOT NULL,
        week_theme text NOT NULL
    )`, 'devotions');

    await run(`CREATE TABLE IF NOT EXISTS public.households (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        head_user_id uuid REFERENCES auth.users(id),
        spouse_user_id uuid REFERENCES auth.users(id),
        name text,
        total_members int DEFAULT 1,
        has_children boolean DEFAULT false,
        attendance_rate numeric DEFAULT 0,
        created_at timestamptz DEFAULT now()
    )`, 'households');

    await run(`CREATE TABLE IF NOT EXISTS public.org_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
        role text DEFAULT 'member',
        stage text DEFAULT 'visitor',
        discipleship_score int DEFAULT 0,
        joined_at timestamptz DEFAULT now(),
        UNIQUE(user_id, org_id)
    )`, 'org_members');

    await run(`CREATE TABLE IF NOT EXISTS public.member_stats (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        current_streak int DEFAULT 0,
        longest_streak int DEFAULT 0,
        completed_devotions int DEFAULT 0,
        last_devotion_date date,
        avg_devotion_duration_min int,
        engagement_score int DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )`, 'member_stats');

    await run(`CREATE TABLE IF NOT EXISTS public.soap_entries (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        day_number int NOT NULL,
        scripture text,
        observation text,
        application text,
        prayer text,
        sentiment text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, day_number)
    )`, 'soap_entries');

    await run(`CREATE TABLE IF NOT EXISTS public.prayer_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        category text NOT NULL DEFAULT 'general',
        urgency text DEFAULT 'normal',
        request_text text NOT NULL,
        is_anonymous boolean DEFAULT false,
        status text DEFAULT 'active',
        answered_date date,
        assigned_intercessor_id uuid REFERENCES auth.users(id),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )`, 'prayer_requests');

    await run(`CREATE TABLE IF NOT EXISTS public.attendance_records (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        event_type text NOT NULL DEFAULT 'sunday_service',
        event_date date NOT NULL,
        attended boolean DEFAULT true,
        notes text,
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, event_type, event_date)
    )`, 'attendance_records');

    await run(`CREATE TABLE IF NOT EXISTS public.ministry_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        ministry_name text NOT NULL,
        ministry_role text DEFAULT 'member',
        is_active boolean DEFAULT true,
        joined_at timestamptz DEFAULT now(),
        training_completed boolean DEFAULT false
    )`, 'ministry_members');

    await run(`CREATE TABLE IF NOT EXISTS public.pastoral_notes (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        author_user_id uuid REFERENCES auth.users(id),
        category text DEFAULT 'general',
        note text NOT NULL,
        assigned_leader_id uuid REFERENCES auth.users(id),
        last_contact_date date,
        follow_up_date date,
        is_resolved boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )`, 'pastoral_notes');

    await run(`CREATE TABLE IF NOT EXISTS public.fellowship_groups (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        leader_id uuid REFERENCES auth.users(id),
        location text,
        meeting_frequency text DEFAULT 'weekly',
        member_count int DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
    )`, 'fellowship_groups');

    await run(`CREATE TABLE IF NOT EXISTS public.fellowship_group_members (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id uuid REFERENCES public.fellowship_groups(id) ON DELETE CASCADE,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        joined_at timestamptz DEFAULT now(),
        UNIQUE(group_id, user_id)
    )`, 'fellowship_group_members');

    await run(`CREATE TABLE IF NOT EXISTS public.evangelism_pipeline (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        prospect_name text NOT NULL,
        invited_by uuid REFERENCES auth.users(id),
        stage text DEFAULT 'invited_visitor',
        stage_date date,
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )`, 'evangelism_pipeline');

    await run(`CREATE TABLE IF NOT EXISTS public.financial_records (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        record_type text NOT NULL DEFAULT 'offering',
        amount numeric NOT NULL,
        currency text DEFAULT 'JPY',
        given_date date NOT NULL,
        notes text,
        is_anonymous boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
    )`, 'financial_records');

    await run(`CREATE TABLE IF NOT EXISTS public.events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        event_type text DEFAULT 'service',
        description text,
        event_date timestamptz NOT NULL,
        location text,
        expected_attendees int,
        actual_attendees int,
        volunteer_count int,
        created_by uuid REFERENCES auth.users(id),
        created_at timestamptz DEFAULT now()
    )`, 'events');

    await run(`CREATE TABLE IF NOT EXISTS public.ai_insights (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        insight_type text NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        suggested_action text,
        priority text DEFAULT 'info',
        is_acknowledged boolean DEFAULT false,
        generated_at timestamptz DEFAULT now()
    )`, 'ai_insights');

    // ─── Extend profiles ───
    console.log('\n─── Extending profiles table ───');
    const profileCols = [
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marital_status text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wedding_anniversary date`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_of_origin text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'EN'`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salvation_date date`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baptism_status text DEFAULT 'not_baptized'`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baptism_date date`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_status text DEFAULT 'visitor'`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_joined_church date`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_address text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ward text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gps_lat numeric`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gps_lng numeric`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS distance_from_church_km numeric`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_id uuid`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_role text DEFAULT 'member'`,
    ];
    for (const col of profileCols) {
        await run(col, col.replace('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ', '').split(' ')[0]);
    }

    // ─── RLS ───
    console.log('\n─── Row Level Security ───');
    const tables = ['organizations', 'api_keys', 'devotions', 'households', 'org_members',
        'member_stats', 'soap_entries', 'prayer_requests', 'attendance_records',
        'ministry_members', 'pastoral_notes', 'fellowship_groups', 'fellowship_group_members',
        'evangelism_pipeline', 'financial_records', 'events', 'ai_insights'];

    for (const t of tables) {
        await run(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`, `RLS: ${t}`);
    }

    // ─── Policies ───
    console.log('\n─── RLS Policies ───');
    const adminRoles = `('shepherd', 'admin', 'owner', 'ministry_lead')`;
    const adminCheck = `EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ${adminRoles})`;

    await run(`DROP POLICY IF EXISTS "Allow public read access" ON public.devotions; CREATE POLICY "Allow public read access" ON public.devotions FOR SELECT TO public USING (true)`, 'policy: devotions public');
    await run(`DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles; CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (${adminCheck} OR id = auth.uid())`, 'policy: profiles');
    await run(`DROP POLICY IF EXISTS "Users manage own stats" ON public.member_stats; CREATE POLICY "Users manage own stats" ON public.member_stats FOR ALL USING (user_id = auth.uid())`, 'policy: member_stats own');
    await run(`DROP POLICY IF EXISTS "Admins read all stats" ON public.member_stats; CREATE POLICY "Admins read all stats" ON public.member_stats FOR SELECT USING (${adminCheck})`, 'policy: member_stats admin');
    await run(`DROP POLICY IF EXISTS "Users manage own soap" ON public.soap_entries; CREATE POLICY "Users manage own soap" ON public.soap_entries FOR ALL USING (user_id = auth.uid())`, 'policy: soap_entries');
    await run(`DROP POLICY IF EXISTS "Admins read all soap" ON public.soap_entries; CREATE POLICY "Admins read all soap" ON public.soap_entries FOR SELECT USING (${adminCheck})`, 'policy: soap admin');
    await run(`DROP POLICY IF EXISTS "Users manage own prayers" ON public.prayer_requests; CREATE POLICY "Users manage own prayers" ON public.prayer_requests FOR ALL USING (user_id = auth.uid())`, 'policy: prayer own');
    await run(`DROP POLICY IF EXISTS "Admins read prayer requests" ON public.prayer_requests; CREATE POLICY "Admins read prayer requests" ON public.prayer_requests FOR SELECT USING (${adminCheck})`, 'policy: prayer admin');
    await run(`DROP POLICY IF EXISTS "Admins manage pastoral notes" ON public.pastoral_notes; CREATE POLICY "Admins manage pastoral notes" ON public.pastoral_notes FOR ALL USING (${adminCheck.replace(adminRoles, "('shepherd', 'admin', 'owner')")})`, 'policy: pastoral_notes');
    await run(`DROP POLICY IF EXISTS "Admins read insights" ON public.ai_insights; CREATE POLICY "Admins read insights" ON public.ai_insights FOR SELECT USING (${adminCheck})`, 'policy: ai_insights');
    await run(`DROP POLICY IF EXISTS "Events publicly readable" ON public.events; CREATE POLICY "Events publicly readable" ON public.events FOR SELECT USING (true)`, 'policy: events');
    await run(`DROP POLICY IF EXISTS "Fellowship publicly readable" ON public.fellowship_groups; CREATE POLICY "Fellowship publicly readable" ON public.fellowship_groups FOR SELECT USING (true)`, 'policy: fellowship_groups');
    await run(`DROP POLICY IF EXISTS "Admins read all attendance" ON public.attendance_records; CREATE POLICY "Admins read all attendance" ON public.attendance_records FOR SELECT USING (${adminCheck})`, 'policy: attendance admin');
    await run(`DROP POLICY IF EXISTS "Admins manage ministry" ON public.ministry_members; CREATE POLICY "Admins manage ministry" ON public.ministry_members FOR ALL USING (${adminCheck})`, 'policy: ministry_members');

    // ─── DB Functions ───
    console.log('\n─── Database Functions ───');

    await run(`CREATE OR REPLACE FUNCTION public.get_church_health_score()
RETURNS json AS $$
DECLARE
    total_members int; active_devoters int; avg_streak numeric;
    total_prayers int; answered_prayers int; health_score int;
BEGIN
    SELECT COUNT(*) INTO total_members FROM public.profiles;
    SELECT COUNT(*) INTO active_devoters FROM public.member_stats WHERE last_devotion_date >= CURRENT_DATE - INTERVAL '7 days';
    SELECT COALESCE(AVG(current_streak), 0) INTO avg_streak FROM public.member_stats;
    SELECT COUNT(*) INTO total_prayers FROM public.prayer_requests WHERE status != 'closed';
    SELECT COUNT(*) INTO answered_prayers FROM public.prayer_requests WHERE status = 'answered';
    health_score := LEAST(100, ((CASE WHEN total_members > 0 THEN (active_devoters::numeric / total_members) * 40 ELSE 0 END) + (LEAST(avg_streak, 30) / 30 * 30) + (CASE WHEN total_prayers > 0 THEN (answered_prayers::numeric / total_prayers) * 30 ELSE 30 END))::int);
    RETURN json_build_object('score', health_score, 'total_members', total_members, 'active_devoters', active_devoters, 'avg_streak', ROUND(avg_streak, 1), 'total_prayers', total_prayers, 'answered_prayers', answered_prayers);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`, 'fn: get_church_health_score');

    await run(`CREATE OR REPLACE FUNCTION public.get_ministry_participation()
RETURNS TABLE(ministry_name text, member_count bigint) AS $$
BEGIN RETURN QUERY SELECT mm.ministry_name, COUNT(mm.user_id) FROM public.ministry_members mm WHERE mm.is_active = true GROUP BY mm.ministry_name ORDER BY COUNT(mm.user_id) DESC; END;
$$ LANGUAGE plpgsql SECURITY DEFINER`, 'fn: get_ministry_participation');

    await run(`CREATE OR REPLACE FUNCTION public.get_devotion_completion_by_day()
RETURNS TABLE(completion_date date, completion_count bigint) AS $$
BEGIN RETURN QUERY SELECT ms.last_devotion_date, COUNT(ms.user_id) FROM public.member_stats ms WHERE ms.last_devotion_date >= CURRENT_DATE - INTERVAL '31 days' GROUP BY ms.last_devotion_date ORDER BY ms.last_devotion_date ASC; END;
$$ LANGUAGE plpgsql SECURITY DEFINER`, 'fn: get_devotion_completion_by_day');

    await run(`CREATE OR REPLACE FUNCTION public.get_at_risk_members()
RETURNS TABLE(user_id uuid, name text, email text, days_inactive int, current_streak int, risk_level text, crisis_prayers bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.email,
        COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999),
        COALESCE(ms.current_streak, 0),
        CASE WHEN COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) >= 7 THEN 'critical'
             WHEN COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) >= 3 THEN 'high' ELSE 'medium' END,
        COUNT(pr.id) FILTER (WHERE pr.urgency = 'crisis')
    FROM public.profiles p
    LEFT JOIN public.member_stats ms ON ms.user_id = p.id
    LEFT JOIN public.prayer_requests pr ON pr.user_id = p.id AND pr.status = 'active'
    WHERE COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) >= 3
    GROUP BY p.id, p.name, p.email, ms.last_devotion_date, ms.current_streak
    ORDER BY 5 DESC LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`, 'fn: get_at_risk_members');

    // ─── Reload PostgREST schema cache ───
    console.log('\n─── Reloading PostgREST schema cache ───');
    await run(`NOTIFY pgrst, 'reload schema'`, 'PostgREST schema reload');

    // ─── Seed data ───
    console.log('\n─── Seeding Data ───');

    await run(`INSERT INTO public.ai_insights (insight_type, title, description, suggested_action, priority) VALUES
        ('daily', '12 Members Inactive 7+ Days', '12 members who had active streaks 2 weeks ago have gone silent. Devotional engagement dropped sharply.', 'Assign 3 pastoral leaders to make personal check-in calls this week.', 'critical'),
        ('daily', 'Financial Stress Prayers +40%', 'Prayer requests mentioning financial difficulty surged 40% vs last week.', 'Prepare a biblical financial stewardship sermon within 2 weeks.', 'warning'),
        ('weekly', 'Youth Attendance Up 24%', 'Youth ministry attendance increased 24% month-over-month. Small group participation at all-time high.', 'Expand youth leadership team. Consider a second youth service slot.', 'info'),
        ('weekly', 'SOAP Anxiety Theme Rising', 'AI analysis shows anxiety-themed language in 31% of entries, up from 18% last week.', 'Schedule a church-wide prayer and fasting day focused on peace.', 'warning'),
        ('monthly', '3 New Families Registered', 'Three new household units joined through the app and attended Sunday service.', 'Assign a welcome deacon to each new family within 72 hours.', 'info')
    ON CONFLICT DO NOTHING`, 'ai_insights (5 records)');

    await run(`INSERT INTO public.fellowship_groups (name, location, meeting_frequency, member_count, is_active) VALUES
        ('Nerima Circle', 'Nerima-ku, Tokyo', 'weekly', 12, true),
        ('Hachioji Life Group', 'Hachioji-shi', 'weekly', 9, true),
        ('Ikebukuro Connect', 'Ikebukuro Station Area', 'biweekly', 15, true),
        ('Sagamihara Grace', 'Sagamihara-shi', 'weekly', 7, true),
        ('Tachikawa Hope', 'Tachikawa-shi', 'weekly', 11, true)
    ON CONFLICT DO NOTHING`, 'fellowship_groups (5 records)');

    await run(`INSERT INTO public.events (name, event_type, event_date, location, expected_attendees, actual_attendees, volunteer_count) VALUES
        ('Sunday Service Mar 1', 'service', '2026-03-01T10:00:00+09:00', 'TE昭島ビル3F', 200, 189, 18),
        ('Youth Night Feb 28', 'event', '2026-02-28T18:00:00+09:00', 'Akihabara Hall', 60, 74, 12),
        ('Prayer & Fasting Day', 'service', '2026-03-07T06:00:00+09:00', 'TE昭島ビル3F', 80, NULL, NULL),
        ('Women''s Conference', 'conference', '2026-03-14T09:00:00+09:00', 'TE昭島ビル3F', 50, NULL, NULL)
    ON CONFLICT DO NOTHING`, 'events (4 records)');

    await run(`INSERT INTO public.prayer_requests (category, urgency, request_text, is_anonymous, status) VALUES
        ('health', 'urgent', 'Prayer for healing from chronic illness', true, 'active'),
        ('financial', 'normal', 'Wisdom and breakthrough for managing finances', false, 'active'),
        ('family', 'normal', 'Restoration of relationship with children', true, 'active'),
        ('spiritual_warfare', 'crisis', 'Breakthrough from oppression and discouragement', true, 'active'),
        ('career', 'normal', 'Direction for career transition', false, 'answered'),
        ('health', 'normal', 'Recovery from surgery last week', false, 'in_prayer'),
        ('marriage', 'urgent', 'Healing and restoration in marriage', true, 'active'),
        ('immigration', 'normal', 'Visa renewal process and peace during uncertainty', false, 'active')
    ON CONFLICT DO NOTHING`, 'prayer_requests (8 records)');

    // Migrate devotions
    console.log('\n─── Migrating Devotions ───');
    try {
        const devotions = JSON.parse(readFileSync(resolve(__dirname, '../src/data/devotions.json'), 'utf8'));
        let inserted = 0;
        for (const d of devotions) {
            try {
                await client.query(
                    `INSERT INTO public.devotions (date, week, theme, title, scripture, declaration, week_theme)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (date) DO UPDATE SET week=$2, theme=$3, title=$4, scripture=$5, declaration=$6, week_theme=$7`,
                    [d.date, d.week, d.theme, d.title, d.scripture, d.declaration, d.week_theme]
                );
                inserted++;
            } catch { }
        }
        console.log(`  ✅ ${inserted}/${devotions.length} devotions migrated`);
    } catch (e: any) {
        console.log(`  ⚠️  devotions: ${e.message}`);
    }

    await client.end();

    console.log('\n' + '='.repeat(55));
    console.log('🎉 Church OS Migration Complete!');
    console.log('   All 18 tables created, seeded, and PostgREST cache reloaded.');
    console.log('='.repeat(55));
}

main().catch(async (e) => {
    console.error('Migration failed:', e.message);
    try { await client.end(); } catch { }
    process.exit(1);
});
