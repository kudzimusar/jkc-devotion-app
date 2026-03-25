-- Church OS: P2 Intelligence Views Migration
-- Focus: Growth ROI, Sermon Impact, and Volunteer Health.

-- 1. View: Evangelism ROI
-- Analyzes which members and sources produce the most "Conversions" (Stages: Decision, Baptism, Membership).
CREATE OR REPLACE VIEW public.vw_evangelism_roi AS
WITH referrer_stats AS (
    SELECT 
        p.org_id,
        p.id as referrer_id,
        p.name as referrer_name,
        COUNT(ep.id) as total_invited,
        COUNT(ep.id) FILTER (WHERE ep.stage IN ('decision', 'baptism', 'membership')) as conversions
    FROM public.profiles p
    LEFT JOIN public.evangelism_pipeline ep ON p.id = ep.invited_by
    GROUP BY p.org_id, p.id, p.name
)
SELECT 
    *,
    CASE 
        WHEN total_invited > 0 THEN ROUND((conversions::numeric / total_invited::numeric) * 100, 2)
        ELSE 0
    END as conversion_rate
FROM referrer_stats
WHERE total_invited > 0;

-- 2. View: Sermon Impact Analytics
-- Correlates sermon publication dates with congregational journal activity spikes.
CREATE OR REPLACE VIEW public.vw_sermon_impact_analytics AS
SELECT 
    ps.org_id,
    ps.id as sermon_id,
    ps.title,
    ps.date as sermon_date,
    COALESCE(sm.total_views, 0) as views,
    (
        SELECT COUNT(*) 
        FROM public.soap_entries se 
        JOIN public.profiles p ON se.user_id = p.id
        WHERE p.org_id = ps.org_id 
          AND se.created_at::date BETWEEN ps.date AND ps.date + interval '7 days'
    ) as journals_in_followed_week
FROM public.public_sermons ps
LEFT JOIN public.sermon_metrics sm ON ps.id = sm.sermon_id
WHERE ps.status = 'published';

-- 3. View: Volunteer Burnout Risk
-- Identifies heroes who are over-serving (3+ ministries) but starting to miss Sunday services.
CREATE OR REPLACE VIEW public.vw_volunteer_burnout_risk AS
WITH volunteer_load AS (
    SELECT 
        p.id as user_id,
        p.name,
        p.org_id,
        (SELECT COUNT(*) FROM public.ministry_members mm WHERE mm.user_id = p.id AND mm.is_active = true) as ministry_count,
        (SELECT COUNT(*) FROM public.attendance_records ar 
         WHERE ar.user_id = p.id AND ar.event_date > now() - interval '30 days') as recent_attendance
    FROM public.profiles p
)
SELECT 
    *,
    CASE
        WHEN ministry_count >= 4 AND recent_attendance < 2 THEN 'Critical Burnout'
        WHEN ministry_count >= 3 AND recent_attendance < 3 THEN 'High Risk'
        ELSE 'Healthy'
    END as burnout_status
FROM volunteer_load
WHERE ministry_count >= 3;

-- Grant permissions for analytical access
GRANT SELECT ON public.vw_evangelism_roi TO authenticated;
GRANT SELECT ON public.vw_sermon_impact_analytics TO authenticated;
GRANT SELECT ON public.vw_volunteer_burnout_risk TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
