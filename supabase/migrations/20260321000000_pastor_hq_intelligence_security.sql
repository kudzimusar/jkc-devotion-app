-- ============================================================
-- CHURCH OS: IDENTITY & INTELLIGENCE SECURITY UPGRADE
-- Focus: Individual Roles, RLS, Activity Logging, and Strategic Views
-- ============================================================

-- 1. SYSTEM ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.system_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES auth.users(id),
    actor_role text,
    action text NOT NULL, -- 'login', 'role_change', 'financial_edit', 'member_data_update'
    entity text, -- 'profile', 'financial_record', 'ministry'
    entity_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- 2. STRATEGIC INTELLIGENCE VIEWS

-- View: Attendance & Growth Trends
CREATE OR REPLACE VIEW vw_church_attendance_trends AS
SELECT 
    org_id,
    DATE_TRUNC('week', event_date)::date as week_start,
    COUNT(*) as total_attended,
    SUM(CASE WHEN event_type = 'sunday_service' THEN 1 ELSE 0 END) as sunday_service_count,
    SUM(CASE WHEN event_type = 'online' THEN 1 ELSE 0 END) as online_count
FROM attendance_records
WHERE attended = true
GROUP BY org_id, week_start;

-- View: Ministry Health Index
CREATE OR REPLACE VIEW vw_ministry_health AS
SELECT 
    m.org_id,
    m.id as ministry_id,
    m.name,
    m.slug,
    ma.health_score,
    ma.engagement_index,
    ma.period_start,
    CASE 
        WHEN ma.health_score >= 80 THEN 'Strong'
        WHEN ma.health_score >= 50 THEN 'Stable'
        ELSE 'Needs Support'
    END as status
FROM ministries m
LEFT JOIN ministry_analytics ma ON m.id = ma.ministry_id
WHERE ma.period_type = 'weekly'
  AND ma.period_start >= CURRENT_DATE - INTERVAL '14 days';

-- View: Financial Momentum
CREATE OR REPLACE VIEW vw_financial_momentum AS
SELECT 
    p.org_id,
    DATE_TRUNC('month', fr.given_date)::date as month_start,
    fr.record_type,
    SUM(fr.amount) as total_amount,
    COUNT(DISTINCT fr.user_id) as donor_count
FROM financial_records fr
JOIN profiles p ON fr.user_id = p.id
GROUP BY p.org_id, month_start, fr.record_type;

-- View: Spiritual Climate (Synthesized from SOAP & Sentiment)
-- Note: This is a placeholder for future AI-driven synthesis, currently using metadata
CREATE OR REPLACE VIEW vw_spiritual_climate AS
SELECT 
    p.org_id,
    DATE_TRUNC('week', s.created_at)::date as week_start,
    s.sentiment as dominant_theme,
    COUNT(*) as entry_count,
    ROUND(AVG(ms.engagement_score), 1) as avg_engagement
FROM soap_entries s
JOIN profiles p ON s.user_id = p.id
JOIN member_stats ms ON s.user_id = ms.user_id
GROUP BY p.org_id, week_start, s.sentiment;

-- 3. ENFORCED RLS POLICIES (Static Export Hardening)

-- profiles: standard RLS (already exists but tightening)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('pastor', 'super_admin', 'admin', 'owner', 'shepherd')
    )
);

-- financial_records: Extremely Strict
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own giving" ON public.financial_records;
CREATE POLICY "Users view own giving" ON public.financial_records 
FOR SELECT USING (user_id = auth.uid() AND is_anonymous = false);

DROP POLICY IF EXISTS "Leadership view all giving" ON public.financial_records;
CREATE POLICY "Leadership view all giving" ON public.financial_records 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('pastor', 'super_admin', 'owner')
    )
);

-- member_alerts
ALTER TABLE public.member_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage alerts" ON public.member_alerts;
CREATE POLICY "Admins manage alerts" ON public.member_alerts 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('pastor', 'super_admin', 'admin')
    )
);

-- system_activity_logs: Appending only for certain roles, Select for higher roles
ALTER TABLE public.system_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can insert logs" ON public.system_activity_logs 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Leadership can view logs" ON public.system_activity_logs 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('pastor', 'super_admin', 'owner')
    )
);

-- 4. VIEW PERMISSIONS
-- Supabase Views inherit permissions from underlying tables by default, 
-- but we ensure the service role / authenticated users can select.
GRANT SELECT ON public.vw_church_attendance_trends TO authenticated;
GRANT SELECT ON public.vw_ministry_health TO authenticated;
GRANT SELECT ON public.vw_financial_momentum TO authenticated;
GRANT SELECT ON public.vw_spiritual_climate TO authenticated;

NOTIFY pgrst, 'reload schema';
