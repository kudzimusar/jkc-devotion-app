-- Church OS: P1 Intelligence Views Migration
-- Focus: Spiritual Climate, Pastoral Load, and Financial Momentum.

-- 1. View: Spiritual Climate Forecast
-- Synthesis of congregational sentiment trends from journal entries.
CREATE OR REPLACE VIEW public.vw_spiritual_climate_forecast AS
WITH recent_sentiments AS (
    SELECT 
        p.org_id,
        se.sentiment,
        COUNT(*) as sentiment_count
    FROM public.soap_entries se
    JOIN public.profiles p ON se.user_id = p.id
    WHERE se.created_at > now() - interval '14 days'
    GROUP BY p.org_id, se.sentiment
),
sentiment_summary AS (
    SELECT 
        org_id,
        jsonb_object_agg(COALESCE(sentiment, 'neutral'), sentiment_count) as sentiment_distribution,
        SUM(sentiment_count) as total_entries
    FROM recent_sentiments
    GROUP BY org_id
)
SELECT 
    org_id,
    sentiment_distribution,
    total_entries,
    (SELECT COUNT(*) FROM public.soap_entries se2 
     JOIN public.profiles p2 ON se2.user_id = p2.id 
     WHERE p2.org_id = sentiment_summary.org_id 
       AND se2.created_at > now() - interval '7 days'
       AND (se2.sentiment ILIKE '%anxiety%' OR se2.sentiment ILIKE '%despair%' OR se2.sentiment ILIKE '%broken%')) as critical_sentiment_count
FROM sentiment_summary;

-- 2. View: Pastoral Care Load
-- Measures the shepherding burden and identifies potential bottlenecks/burnout.
CREATE OR REPLACE VIEW public.vw_pastoral_care_load AS
SELECT 
    p.org_id,
    COUNT(pn.id) as total_active_cases,
    COUNT(pn.id) FILTER (WHERE pn.category = 'crisis') as crisis_cases,
    COUNT(pn.id) FILTER (WHERE pn.follow_up_date < now() AND pn.is_resolved = false) as overdue_follow_ups,
    (SELECT COUNT(*) FROM public.prayer_requests pr WHERE pr.org_id = p.org_id AND pr.urgency = 'crisis' AND pr.status = 'active') as active_crisis_prayers
FROM public.profiles p
JOIN public.pastoral_notes pn ON p.id = pn.member_user_id
WHERE pn.is_resolved = false
GROUP BY p.org_id;

-- 3. View: Giving Health Index (Consistency vs. Amount)
-- Tracks member giving loyalty trends for retention forecasting.
CREATE OR REPLACE VIEW public.vw_giving_health_index AS
WITH member_giving AS (
    SELECT 
        p.org_id,
        p.id as user_id,
        COUNT(fr.id) FILTER (WHERE fr.given_date > CURRENT_DATE - INTERVAL '30 days') as giving_count_30d,
        COUNT(fr.id) FILTER (WHERE fr.given_date <= CURRENT_DATE - INTERVAL '30 days' AND fr.given_date > CURRENT_DATE - INTERVAL '60 days') as giving_count_prev_30d
    FROM public.profiles p
    LEFT JOIN public.financial_records fr ON p.id = fr.user_id
    GROUP BY p.org_id, p.id
)
SELECT 
    org_id,
    COUNT(user_id) FILTER (WHERE giving_count_30d > 0) as active_givers,
    COUNT(user_id) FILTER (WHERE giving_count_30d = 0 AND giving_count_prev_30d > 0) as lapsed_givers_30d,
    COUNT(user_id) FILTER (WHERE giving_count_30d > 0 AND giving_count_prev_30d = 0) as new_givers_30d
FROM member_giving
GROUP BY org_id;

-- 4. View: Financial Momentum Forecast
-- Monthly-level aggregation for budget planning.
CREATE OR REPLACE VIEW public.vw_financial_momentum_trend AS
SELECT 
    p.org_id,
    DATE_TRUNC('month', fr.given_date)::date as month_start,
    SUM(fr.amount) as total_amount,
    COUNT(DISTINCT fr.user_id) as donor_count,
    AVG(fr.amount) as average_gift
FROM public.financial_records fr
JOIN public.profiles p ON fr.user_id = p.id
GROUP BY p.org_id, month_start;

-- Grant permissions for analytical access
GRANT SELECT ON public.vw_spiritual_climate_forecast TO authenticated;
GRANT SELECT ON public.vw_pastoral_care_load TO authenticated;
GRANT SELECT ON public.vw_giving_health_index TO authenticated;
GRANT SELECT ON public.vw_financial_momentum_trend TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
