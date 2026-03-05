-- Mission Control Extensions
-- 1. Member Skills & Talents
CREATE TABLE IF NOT EXISTS public.member_skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_category text,
    skill_name text NOT NULL,
    skill_level text DEFAULT 'Intermediate',
    years_experience int DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

-- 2. Geographic Extensions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ward text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude numeric;

-- 3. Evangelism Tracking
CREATE TABLE IF NOT EXISTS public.evangelism_referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_member_id uuid REFERENCES auth.users(id),
    invited_member_id uuid REFERENCES auth.users(id),
    invite_method text,
    invite_date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- 4. Intelligence Pipelines
CREATE TABLE IF NOT EXISTS public.member_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type text NOT NULL,
    severity text DEFAULT 'medium',
    is_resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.church_health_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    score int NOT NULL,
    attendance_index int,
    engagement_index int,
    service_index int,
    prayer_index int,
    community_index int,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_question_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic text NOT NULL,
    frequency int DEFAULT 1,
    trend text DEFAULT 'stable',
    week date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- 5. RLS & Permissions
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evangelism_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_question_topics ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    adminRoles text[] := ARRAY['super_admin', 'owner', 'shepherd', 'admin', 'ministry_lead'];
    adminCheck text := 'EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role = ANY(ARRAY[''super_admin'', ''owner'', ''shepherd'', ''admin'', ''ministry_lead'']))';
BEGIN
    -- member_skills
    DROP POLICY IF EXISTS "Users own skills" ON public.member_skills;
    CREATE POLICY "Users own skills" ON public.member_skills FOR ALL USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Admins read skills" ON public.member_skills;
    EXECUTE 'CREATE POLICY "Admins read skills" ON public.member_skills FOR SELECT USING (' || adminCheck || ')';

    -- member_alerts
    DROP POLICY IF EXISTS "Admins manage alerts" ON public.member_alerts;
    EXECUTE 'CREATE POLICY "Admins manage alerts" ON public.member_alerts FOR ALL USING (' || adminCheck || ')';
    
    DROP POLICY IF EXISTS "Users see own alerts" ON public.member_alerts;
    CREATE POLICY "Users see own alerts" ON public.member_alerts FOR SELECT USING (member_id = auth.uid());

    -- church_health_metrics
    DROP POLICY IF EXISTS "Admins manage health" ON public.church_health_metrics;
    EXECUTE 'CREATE POLICY "Admins manage health" ON public.church_health_metrics FOR ALL USING (' || adminCheck || ')';

    -- ai_question_topics
    DROP POLICY IF EXISTS "Admins manage topics" ON public.ai_question_topics;
    EXECUTE 'CREATE POLICY "Admins manage topics" ON public.ai_question_topics FOR ALL USING (' || adminCheck || ')';
END $$;

NOTIFY pgrst, 'reload schema';
