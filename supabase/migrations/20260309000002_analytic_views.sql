-- CHURCH OS: ANALYTICAL LAYER (MISSION CONTROL VIEWS)
-- These views bridge operational data to dashboard visualizations

-- 1. ATTENDANCE RECONCILIATION VIEW
CREATE OR REPLACE VIEW public.vw_attendance_reconciliation AS
WITH physical_reports AS (
    SELECT 
        report_date,
        SUM((metrics->>'adults')::int) as adults_physical,
        SUM((metrics->>'children')::int) as kids_physical,
        SUM((metrics->>'visitors')::int) as visitors_physical,
        SUM((metrics->>'total')::int) as total_physical,
        SUM((metrics->>'first_timers')::int) as first_timers_physical
    FROM public.ministry_reports
    WHERE ministry_name IN ('Ushers', 'Protocol')
    GROUP BY report_date
),
digital_checkins AS (
    SELECT 
        service_date as report_date,
        COUNT(id) as total_digital
    FROM public.service_attendance
    GROUP BY service_date
),
kids_checkins AS (
    SELECT 
        check_in_time::date as report_date,
        COUNT(id) as kids_digital
    FROM public.children_checkins
    GROUP BY check_in_time::date
)
SELECT 
    COALESCE(p.report_date, d.report_date) as report_date,
    COALESCE(p.total_physical, 0) as total_physical,
    COALESCE(d.total_digital, 0) as total_digital,
    COALESCE(p.kids_physical, 0) as kids_physical_hunted,
    COALESCE(k.kids_digital, 0) as kids_digital_recorded,
    COALESCE(p.first_timers_physical, 0) as first_timers_count,
    COALESCE(p.total_physical, 0) - COALESCE(d.total_digital, 0) as unregistered_count
FROM physical_reports p
FULL OUTER JOIN digital_checkins d ON p.report_date = d.report_date
LEFT JOIN kids_checkins k ON COALESCE(p.report_date, d.report_date) = k.report_date;

-- 2. MINISTRY EFFICIENCY VIEW
CREATE OR REPLACE VIEW public.vw_ministry_efficiency AS
SELECT 
    ministry_name,
    COUNT(id) as registered_members,
    COUNT(id) FILTER (WHERE active_status = true) as active_members,
    COUNT(id) FILTER (WHERE is_leader = true) as leaders_count
FROM public.member_roles
GROUP BY ministry_name;

-- 3. SPIRITUAL PULSE (Aggregate Milestones)
CREATE OR REPLACE VIEW public.vw_spiritual_pulse AS
SELECT 
    COUNT(id) FILTER (WHERE salvation_date IS NOT NULL) as total_salvations,
    COUNT(id) FILTER (WHERE baptism_date IS NOT NULL) as total_baptisms,
    COUNT(id) FILTER (WHERE membership_date IS NOT NULL) as total_formal_members,
    COUNT(id) FILTER (WHERE foundation_class_date IS NOT NULL) as foundations_complete
FROM public.member_milestones;

-- 4. ACTIVITY VELOCITY (7-day Engagement)
CREATE OR REPLACE VIEW public.vw_activity_velocity AS
SELECT 
    activity_type,
    COUNT(id) as volume,
    COUNT(id) FILTER (WHERE created_at > now() - interval '7 days') as recent_volume
FROM public.activity_log
GROUP BY activity_type;

-- GRANT ACCESS
GRANT SELECT ON public.vw_attendance_reconciliation TO authenticated;
GRANT SELECT ON public.vw_ministry_efficiency TO authenticated;
GRANT SELECT ON public.vw_spiritual_pulse TO authenticated;
GRANT SELECT ON public.vw_activity_velocity TO authenticated;
