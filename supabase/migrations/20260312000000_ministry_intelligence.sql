-- Church OS: Ministry Intelligence Layer (MIL)
-- Expanding Prophetic Intelligence to include operational performance alerts.

-- 1. View to detect Attendance Reach Gaps (Manual vs Digital)
CREATE OR REPLACE VIEW public.vw_ministry_performance_alerts AS
SELECT 
    report_date,
    total_physical,
    total_digital,
    unregistered_count,
    CASE 
        WHEN total_physical > 0 THEN (unregistered_count::numeric / total_physical) * 100
        ELSE 0
    END as gap_percentage
FROM public.vw_attendance_reconciliation
WHERE report_date >= CURRENT_DATE - INTERVAL '14 days'
  AND (unregistered_count::numeric / NULLIF(total_physical, 0)) > 0.2; -- Alert if >20% are unregistered

-- 2. View to detect Soul Harvest Momentum (Evangelism success)
CREATE OR REPLACE VIEW public.vw_evangelism_momentum AS
SELECT 
    event_date::date as report_date,
    SUM(value) as total_salvations
FROM public.vw_ministry_intelligence_feed
WHERE metric_type = 'evangelism'
  AND detail = 'Outreach Decisons'
GROUP BY event_date::date
HAVING SUM(value) > 0;

NOTIFY pgrst, 'reload schema';
