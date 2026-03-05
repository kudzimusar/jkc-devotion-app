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
        } else if (e.message.includes('already a column')) {
            console.log(`  ⏭️  ${label} (column already exists)`);
        } else {
            console.log(`  ⚠️  ${label}: ${e.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Church OS — Mission Control Extensions Migration');
    console.log('='.repeat(55));

    await client.connect();
    console.log('✅ Connected direct via pg!\n');

    // 1. Member Skills & Talents
    console.log('\n─── Phase 1: Member Skills ───');
    await run(`CREATE TABLE IF NOT EXISTS public.member_skills (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        skill_category text,
        skill_name text NOT NULL,
        skill_level text DEFAULT 'Intermediate',
        years_experience int DEFAULT 1,
        created_at timestamptz DEFAULT now()
    )`, 'member_skills');

    // 2. Geographic Extensions
    console.log('\n─── Phase 2: Geographic Intelligence ───');
    const geoCols = [
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ward text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude numeric`,
        `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude numeric`
    ];
    for (const col of geoCols) {
        await run(col, col.split('IF NOT EXISTS ')[1].split(' ')[0]);
    }

    // 3. Evangelism Tracking
    console.log('\n─── Phase 3: Evangelism Referral Tracking ───');
    await run(`CREATE TABLE IF NOT EXISTS public.evangelism_referrals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        inviter_member_id uuid REFERENCES auth.users(id),
        invited_member_id uuid REFERENCES auth.users(id),
        invite_method text,
        invite_date date DEFAULT CURRENT_DATE,
        created_at timestamptz DEFAULT now()
    )`, 'evangelism_referrals');

    // 4. Intelligence Pipelines
    console.log('\n─── Phase 4: Intelligence Data Points ───');
    await run(`CREATE TABLE IF NOT EXISTS public.member_alerts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        alert_type text NOT NULL,
        severity text DEFAULT 'medium',
        is_resolved boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
    )`, 'member_alerts');

    await run(`CREATE TABLE IF NOT EXISTS public.church_health_metrics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        score int NOT NULL,
        attendance_index int,
        engagement_index int,
        service_index int,
        prayer_index int,
        community_index int,
        created_at timestamptz DEFAULT now()
    )`, 'church_health_metrics');

    await run(`CREATE TABLE IF NOT EXISTS public.ai_question_topics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        topic text NOT NULL,
        frequency int DEFAULT 1,
        trend text DEFAULT 'stable',
        week date DEFAULT CURRENT_DATE,
        created_at timestamptz DEFAULT now()
    )`, 'ai_question_topics');

    // 5. RLS & Permissions
    console.log('\n─── Security & Permissions ───');
    const newTables = ['member_skills', 'evangelism_referrals', 'member_alerts', 'church_health_metrics', 'ai_question_topics'];
    for (const t of newTables) {
        await run(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`, `RLS: ${t}`);
    }

    const adminRoles = `('super_admin', 'owner', 'shepherd', 'admin', 'ministry_lead')`;
    const adminCheck = `EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ${adminRoles})`;

    await run(`DROP POLICY IF EXISTS "Users own skills" ON public.member_skills; CREATE POLICY "Users own skills" ON public.member_skills FOR ALL USING (user_id = auth.uid())`, 'Policy: member_skills (user)');
    await run(`DROP POLICY IF EXISTS "Admins read skills" ON public.member_skills; CREATE POLICY "Admins read skills" ON public.member_skills FOR SELECT USING (${adminCheck})`, 'Policy: member_skills (admin)');

    await run(`DROP POLICY IF EXISTS "Admins manage alerts" ON public.member_alerts; CREATE POLICY "Admins manage alerts" ON public.member_alerts FOR ALL USING (${adminCheck})`, 'Policy: member_alerts (admin)');
    await run(`DROP POLICY IF EXISTS "Users see own alerts" ON public.member_alerts; CREATE POLICY "Users see own alerts" ON public.member_alerts FOR SELECT USING (member_id = auth.uid())`, 'Policy: member_alerts (user)');

    await run(`DROP POLICY IF EXISTS "Admins manage health" ON public.church_health_metrics; CREATE POLICY "Admins manage health" ON public.church_health_metrics FOR ALL USING (${adminCheck})`, 'Policy: church_health_metrics');
    await run(`DROP POLICY IF EXISTS "Admins manage topics" ON public.ai_question_topics; CREATE POLICY "Admins manage topics" ON public.ai_question_topics FOR ALL USING (${adminCheck})`, 'Policy: ai_question_topics');

    await run(`NOTIFY pgrst, 'reload schema'`, 'PostgREST reload');

    await client.end();
    console.log('\n✅ Mission Control Extensions completed.');
}

main().catch(async e => {
    console.error(e);
    try { await client.end() } catch { }
});
