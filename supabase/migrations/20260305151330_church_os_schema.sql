-- ============================================================
-- CHURCH OS: COMPLETE DATABASE MIGRATION
-- Multi-layered Intelligence System
-- Project: jkc-devotion-app / dapxrorkcvpzzkggopsa
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ORGANIZATIONS (Multi-tenant support)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    domain text UNIQUE,
    logo_url text,
    subscription_status text DEFAULT 'trialing',
    stripe_customer_id text UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. API KEYS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    key_hash text UNIQUE NOT NULL,
    key_preview text,
    is_active boolean DEFAULT true,
    last_used_at timestamptz
);

-- ============================================================
-- 3. DEVOTIONS (Global content)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.devotions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date date UNIQUE NOT NULL,
    week int NOT NULL,
    theme text NOT NULL,
    title text NOT NULL,
    scripture text NOT NULL,
    declaration text NOT NULL,
    week_theme text NOT NULL
);

-- ============================================================
-- 4. PROFILES (Extended member data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text,
    avatar_url text,
    org_id uuid REFERENCES public.organizations(id),
    -- Identity
    gender text,
    date_of_birth date,
    marital_status text,
    wedding_anniversary date,
    phone text,
    country_of_origin text,
    preferred_language text DEFAULT 'EN',
    occupation text,
    skills_talents text[],
    education_level text,
    -- Spiritual milestones
    salvation_date date,
    baptism_status text DEFAULT 'not_baptized',
    baptism_date date,
    membership_status text DEFAULT 'visitor',
    date_joined_church date,
    -- Location
    full_address text,
    city text,
    ward text,
    postal_code text,
    gps_lat numeric,
    gps_lng numeric,
    distance_from_church_km numeric,
    preferred_fellowship_area text,
    -- Household
    household_id uuid,
    household_role text DEFAULT 'member',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. HOUSEHOLDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.households (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    head_user_id uuid REFERENCES auth.users(id),
    spouse_user_id uuid REFERENCES auth.users(id),
    name text,
    total_members int DEFAULT 1,
    has_children boolean DEFAULT false,
    attendance_rate numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. ORG MEMBERS (Role management)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    role text DEFAULT 'member', -- visitor, member, volunteer, ministry_lead, shepherd, admin, owner
    stage text DEFAULT 'visitor', -- visitor, app_user, attendee, member, volunteer, leader, department_head, pastor
    discipleship_score int DEFAULT 0,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(user_id, org_id)
);

-- ============================================================
-- 7. MEMBER STATS (Spiritual engagement tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.member_stats (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak int DEFAULT 0,
    longest_streak int DEFAULT 0,
    completed_devotions int DEFAULT 0,
    last_devotion_date date,
    avg_devotion_duration_min int,
    engagement_score int DEFAULT 0, -- 0-100: composite score
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. SOAP ENTRIES (Spiritual journal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.soap_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number int NOT NULL,
    scripture text,
    observation text,
    application text,
    prayer text,
    sentiment text, -- hope, repentance, anxiety, gratitude, confusion
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, day_number)
);

-- ============================================================
-- 9. PRAYER REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    category text NOT NULL DEFAULT 'general',
    -- Categories: health, family, marriage, financial, spiritual_warfare, career, immigration, education, emotional_distress, salvation
    urgency text DEFAULT 'normal', -- normal, urgent, crisis
    request_text text NOT NULL,
    is_anonymous boolean DEFAULT false,
    status text DEFAULT 'active', -- active, in_prayer, answered, closed
    answered_date date,
    assigned_intercessor_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 10. ATTENDANCE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL DEFAULT 'sunday_service',
    -- Types: sunday_service, midweek_service, fellowship, event, cell_group, online
    event_date date NOT NULL,
    attended boolean DEFAULT true,
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, event_type, event_date)
);

-- ============================================================
-- 11. MINISTRY MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ministry_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    ministry_name text NOT NULL,
    -- worship, choir, media, ushers, hospitality, childrens, youth,
    -- young_adults, intercessory, evangelism, discipleship, small_groups,
    -- marriage, mens, womens, counseling, protocol, missions, administration,
    -- finance, technical, translation, outreach, community_service, worship_dance
    ministry_role text DEFAULT 'member', -- member, leader, coordinator
    is_active boolean DEFAULT true,
    joined_at timestamptz DEFAULT now(),
    training_completed boolean DEFAULT false
);

-- ============================================================
-- 12. PASTORAL NOTES (Confidential)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pastoral_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    author_user_id uuid REFERENCES auth.users(id),
    category text DEFAULT 'general', -- counseling, crisis, follow_up, visitation, general
    note text NOT NULL,
    assigned_leader_id uuid REFERENCES auth.users(id),
    last_contact_date date,
    follow_up_date date,
    is_resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 13. FELLOWSHIP GROUPS (Cell system)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fellowship_groups (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    leader_id uuid REFERENCES auth.users(id),
    location text,
    meeting_frequency text DEFAULT 'weekly',
    member_count int DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fellowship_group_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id uuid REFERENCES public.fellowship_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- ============================================================
-- 14. EVANGELISM PIPELINE (Soul tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evangelism_pipeline (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_name text NOT NULL,
    invited_by uuid REFERENCES auth.users(id),
    stage text DEFAULT 'invited_visitor',
    -- invited_visitor, first_service, second_service, salvation_decision, baptism, membership
    stage_date date,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 15. FINANCIAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    record_type text NOT NULL DEFAULT 'offering',
    -- tithe, offering, pledge, missions, event_donation
    amount numeric NOT NULL,
    currency text DEFAULT 'JPY',
    given_date date NOT NULL,
    notes text,
    is_anonymous boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 16. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
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
);

-- ============================================================
-- 17. AI INSIGHTS LOG (Audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type text NOT NULL, -- daily, weekly, monthly
    title text NOT NULL,
    description text NOT NULL,
    suggested_action text,
    priority text DEFAULT 'info', -- critical, warning, info
    is_acknowledged boolean DEFAULT false,
    generated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 18. DB FUNCTIONS FOR ANALYTICS
-- ============================================================

-- Church Health Score (composite)
CREATE OR REPLACE FUNCTION public.get_church_health_score()
RETURNS json AS $$
DECLARE
    total_members int;
    active_devoters int;
    avg_streak numeric;
    total_prayers int;
    answered_prayers int;
    health_score int;
BEGIN
    SELECT COUNT(*) INTO total_members FROM public.profiles;
    SELECT COUNT(*) INTO active_devoters FROM public.member_stats
        WHERE last_devotion_date >= CURRENT_DATE - INTERVAL '7 days';
    SELECT COALESCE(AVG(current_streak), 0) INTO avg_streak FROM public.member_stats;
    SELECT COUNT(*) INTO total_prayers FROM public.prayer_requests WHERE status != 'closed';
    SELECT COUNT(*) INTO answered_prayers FROM public.prayer_requests WHERE status = 'answered';

    -- Weighted scoring
    health_score := LEAST(100, (
        (CASE WHEN total_members > 0 THEN (active_devoters::numeric / total_members) * 40 ELSE 0 END) +
        (LEAST(avg_streak, 30) / 30 * 30) +
        (CASE WHEN total_prayers > 0 THEN (answered_prayers::numeric / total_prayers) * 30 ELSE 30 END)
    )::int);

    RETURN json_build_object(
        'score', health_score,
        'total_members', total_members,
        'active_devoters', active_devoters,
        'avg_streak', ROUND(avg_streak, 1),
        'total_prayers', total_prayers,
        'answered_prayers', answered_prayers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ministry participation counts
CREATE OR REPLACE FUNCTION public.get_ministry_participation()
RETURNS TABLE(ministry_name text, member_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT mm.ministry_name, COUNT(mm.user_id)
    FROM public.ministry_members mm
    WHERE mm.is_active = true
    GROUP BY mm.ministry_name
    ORDER BY COUNT(mm.user_id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Devotion completion by day (last 31 days)
CREATE OR REPLACE FUNCTION public.get_devotion_completion_by_day()
RETURNS TABLE(completion_date date, completion_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT ms.last_devotion_date, COUNT(ms.user_id)
    FROM public.member_stats ms
    WHERE ms.last_devotion_date >= CURRENT_DATE - INTERVAL '31 days'
    GROUP BY ms.last_devotion_date
    ORDER BY ms.last_devotion_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- At-risk members (inactive 3+ days or crisis)
CREATE OR REPLACE FUNCTION public.get_at_risk_members()
RETURNS TABLE(
    user_id uuid,
    name text,
    email text,
    days_inactive int,
    current_streak int,
    risk_level text,
    crisis_prayers bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.email,
        COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) as days_inactive,
        COALESCE(ms.current_streak, 0) as current_streak,
        CASE
            WHEN COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) >= 7 THEN 'critical'
            WHEN COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) >= 3 THEN 'high'
            ELSE 'medium'
        END as risk_level,
        COUNT(pr.id) FILTER (WHERE pr.urgency = 'crisis') as crisis_prayers
    FROM public.profiles p
    LEFT JOIN public.member_stats ms ON ms.user_id = p.id
    LEFT JOIN public.prayer_requests pr ON pr.user_id = p.id AND pr.status = 'active'
    WHERE COALESCE((CURRENT_DATE - ms.last_devotion_date)::int, 999) >= 3
       OR EXISTS (
           SELECT 1 FROM public.prayer_requests pr2
           WHERE pr2.user_id = p.id AND pr2.urgency = 'crisis' AND pr2.status = 'active'
       )
    GROUP BY p.id, p.name, p.email, ms.last_devotion_date, ms.current_streak
    ORDER BY days_inactive DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Member engagement score calculation
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_user_id uuid)
RETURNS int AS $$
DECLARE
    streak_score int;
    attendance_score int;
    ministry_score int;
    giving_score int;
    community_score int;
    total_score int;
BEGIN
    -- Streak (30% weight, max 30 points: streak >= 30 = full)
    SELECT LEAST(30, COALESCE(current_streak, 0)) INTO streak_score
    FROM public.member_stats WHERE user_id = p_user_id;

    -- Attendance (25% weight: 4+ times/month = full 25)
    SELECT LEAST(25, COUNT(*) * 6) INTO attendance_score
    FROM public.attendance_records
    WHERE user_id = p_user_id
    AND event_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Ministry involvement (25%: any active ministry = 25)
    SELECT CASE WHEN COUNT(*) > 0 THEN 25 ELSE 0 END INTO ministry_score
    FROM public.ministry_members WHERE user_id = p_user_id AND is_active = true;

    -- Giving (10%)
    SELECT CASE WHEN COUNT(*) > 0 THEN 10 ELSE 0 END INTO giving_score
    FROM public.financial_records
    WHERE user_id = p_user_id
    AND given_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Community (10%: in fellowship group = 10)
    SELECT CASE WHEN COUNT(*) > 0 THEN 10 ELSE 0 END INTO community_score
    FROM public.fellowship_group_members WHERE user_id = p_user_id;

    total_score := COALESCE(streak_score, 0) + COALESCE(attendance_score, 0) +
                   COALESCE(ministry_score, 0) + COALESCE(giving_score, 0) +
                   COALESCE(community_score, 0);

    RETURN LEAST(100, total_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 19. RLS POLICIES
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soap_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fellowship_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fellowship_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evangelism_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Devotions: public read
DROP POLICY IF EXISTS "Allow public read access" ON public.devotions;
CREATE POLICY "Allow public read access" ON public.devotions FOR SELECT TO public USING (true);

-- Profiles: users read own; admins/shepherds read all
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- Member stats: own + admin read
DROP POLICY IF EXISTS "Users manage own stats" ON public.member_stats;
CREATE POLICY "Users manage own stats" ON public.member_stats FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all stats" ON public.member_stats;
CREATE POLICY "Admins read all stats" ON public.member_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- SOAP entries: private + admin read
DROP POLICY IF EXISTS "Users manage own soap" ON public.soap_entries;
CREATE POLICY "Users manage own soap" ON public.soap_entries FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all soap anonymized" ON public.soap_entries;
CREATE POLICY "Admins read all soap anonymized" ON public.soap_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
);

-- Prayer requests: own + admin
DROP POLICY IF EXISTS "Users manage own prayers" ON public.prayer_requests;
CREATE POLICY "Users manage own prayers" ON public.prayer_requests FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read prayer requests" ON public.prayer_requests;
CREATE POLICY "Admins read prayer requests" ON public.prayer_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- Attendance: own + admin
DROP POLICY IF EXISTS "Users manage own attendance" ON public.attendance_records;
CREATE POLICY "Users manage own attendance" ON public.attendance_records FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all attendance" ON public.attendance_records;
CREATE POLICY "Admins read all attendance" ON public.attendance_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- Ministry members: own + admin
DROP POLICY IF EXISTS "Users view own ministry" ON public.ministry_members;
CREATE POLICY "Users view own ministry" ON public.ministry_members FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage ministry members" ON public.ministry_members;
CREATE POLICY "Admins manage ministry members" ON public.ministry_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- Pastoral notes: admin only (confidential)
DROP POLICY IF EXISTS "Admins manage pastoral notes" ON public.pastoral_notes;
CREATE POLICY "Admins manage pastoral notes" ON public.pastoral_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
);

-- Org members: admin read/write
DROP POLICY IF EXISTS "Admins manage org members" ON public.org_members;
CREATE POLICY "Admins manage org members" ON public.org_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members om2 WHERE om2.user_id = auth.uid() AND om2.role IN ('admin', 'owner'))
    OR user_id = auth.uid()
);

-- AI Insights: admin read
DROP POLICY IF EXISTS "Admins read insights" ON public.ai_insights;
CREATE POLICY "Admins read insights" ON public.ai_insights FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- Financial: own + admin
DROP POLICY IF EXISTS "Users view own giving" ON public.financial_records;
CREATE POLICY "Users view own giving" ON public.financial_records FOR SELECT USING (user_id = auth.uid() AND is_anonymous = false);

DROP POLICY IF EXISTS "Admins view all giving" ON public.financial_records;
CREATE POLICY "Admins view all giving" ON public.financial_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Fellowship: members read their groups
DROP POLICY IF EXISTS "Members view fellowship groups" ON public.fellowship_groups;
CREATE POLICY "Members view fellowship groups" ON public.fellowship_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members view group membership" ON public.fellowship_group_members;
CREATE POLICY "Members view group membership" ON public.fellowship_group_members FOR SELECT USING (user_id = auth.uid());

-- Evangelism pipeline: admin
DROP POLICY IF EXISTS "Admins manage evangelism" ON public.evangelism_pipeline;
CREATE POLICY "Admins manage evangelism" ON public.evangelism_pipeline FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);

-- Events: public read
DROP POLICY IF EXISTS "Events publicly readable" ON public.events;
CREATE POLICY "Events publicly readable" ON public.events FOR SELECT USING (true);

-- ============================================================
-- 20. SEED MOCK DATA FOR DEMO
-- ============================================================

-- Seed prayer categories distribution for demo
INSERT INTO public.ai_insights (insight_type, title, description, suggested_action, priority) VALUES
('daily', '12 Members Inactive This Week', '12 members have not engaged with their devotional reading in the past 7 days, breaking their previous streaks.', 'Schedule pastoral check-in calls for top 5 at-risk members.', 'critical'),
('daily', 'Youth Attendance Up 24%', 'Youth ministry attendance has increased 24% compared to last month, showing strong momentum.', 'Consider expanding youth leadership team and adding a second youth service.', 'info'),
('daily', 'Financial Stress Prayer Surge', 'Prayer requests related to financial stress have increased 40% this week.', 'Prepare a sermon or workshop series on biblical financial stewardship.', 'warning'),
('weekly', 'SOAP Journal Sentiment: Anxiety Rising', 'Analysis of this week''s SOAP journal entries shows anxiety-themed language increased to 31% of entries.', 'Consider a church-wide prayer and fasting day focused on peace and trust.', 'warning'),
('weekly', '3 New Families Joined', '3 new household units registered through the app this week, and all attended Sunday service.', 'Assign a welcome team deacon to each new family for follow-up within 72 hours.', 'info')
ON CONFLICT DO NOTHING;
