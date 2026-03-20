-- 1. Standardize Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wedding_anniversary DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS physical_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS church_background TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_communication TEXT DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS head_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- 2. Standardize Attendance
-- Ensure attendance_records has the necessary fields from attendance_logs
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'Present';
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Migrate data from attendance_logs to attendance_records
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance_logs') THEN
        INSERT INTO public.attendance_records (user_id, event_date, event_type, attended, attendance_status, created_at)
        SELECT profile_id, event_date, event_type, (attendance_status = 'Present'), attendance_status, created_at
        FROM public.attendance_logs
        ON CONFLICT (user_id, event_type, event_date) DO NOTHING;
    END IF;
END $$;

-- 3. Household Fix
-- Ensure households table is correct
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.ministry_reports ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.merchandise ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.merchandise_orders ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- 4. View Stabilization
-- Re-creating vw_growth_intelligence with robust logic
CREATE OR REPLACE VIEW public.vw_growth_intelligence AS
SELECT
  org_id,
  DATE_TRUNC('month', service_date)         AS month,
  SUM(COALESCE((data->>'salvations')::numeric, 0))           AS total_salvations,
  SUM(COALESCE((data->>'people_reached')::numeric, 0))       AS people_reached,
  SUM(COALESCE((data->>'contacts_collected')::numeric, 0))   AS contacts,
  COUNT(*)                                   AS outreach_events
FROM public.ministry_reports
WHERE report_type = 'outreach'
  AND service_date >= (CURRENT_DATE - INTERVAL '6 months')
GROUP BY org_id, DATE_TRUNC('month', service_date);

-- Member Disengagement Risk Update
CREATE OR REPLACE VIEW public.vw_member_disengagement_risk AS
SELECT 
    p.id as user_id,
    p.name,
    p.org_id,
    s.last_devotion_date,
    CURRENT_DATE - s.last_devotion_date::date as days_silent,
    CASE 
        WHEN CURRENT_DATE - s.last_devotion_date::date >= 14 THEN 90
        WHEN CURRENT_DATE - s.last_devotion_date::date >= 7 THEN 60
        ELSE 10
    END as risk_score
FROM public.profiles p
JOIN public.member_stats s ON p.id = s.user_id
WHERE s.last_devotion_date < CURRENT_DATE - INTERVAL '6 days';

-- 5. Ministry Hub Security & Accuracy
CREATE OR REPLACE VIEW public.vw_ministry_hub AS
SELECT
  m.org_id,
  m.id, m.name, m.slug, m.color, m.icon,
  p.name                                      AS leader_name,
  COUNT(DISTINCT mm.id)                       AS volunteer_count,
  ma.health_score,
  ma.avg_attendance,
  ma.total_reports,
  ma.salvations,
  (SELECT MAX(mr.service_date)
   FROM ministry_reports mr
   WHERE mr.ministry_id = m.id)               AS last_report_date,
  CASE WHEN (SELECT MAX(mr.service_date)
             FROM ministry_reports mr
             WHERE mr.ministry_id = m.id)
            < (CURRENT_DATE - INTERVAL '14 days')
    THEN TRUE ELSE FALSE
  END                                          AS reporting_overdue
FROM ministries m
LEFT JOIN profiles p         ON p.id = m.leader_id
LEFT JOIN ministry_members mm ON mm.ministry_id = m.id AND mm.is_active = TRUE
LEFT JOIN ministry_analytics ma ON ma.ministry_id = m.id
  AND ma.period_type  = 'monthly'
  AND ma.period_start = date_trunc('month', CURRENT_DATE)::DATE
-- 6. Atomic Shop Operations
CREATE OR REPLACE FUNCTION public.log_inventory_adjustment(
    p_product_id UUID,
    p_amount INTEGER,
    p_reason TEXT
) RETURNS VOID AS $$
BEGIN
    -- 1. Insert log
    INSERT INTO public.merchandise_inventory_logs (product_id, change_amount, reason)
    VALUES (p_product_id, p_amount, p_reason);

    -- 2. Update stock atomically
    UPDATE public.merchandise 
    SET stock_quantity = stock_quantity + p_amount 
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.place_merchandise_order(
    p_order_data JSONB,
    p_items JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
BEGIN
    -- 1. Insert order
    INSERT INTO public.merchandise_orders (
        org_id, user_id, status, total_amount, 
        payment_status, shipping_address, contact_email, contact_phone
    ) VALUES (
        (p_order_data->>'org_id')::UUID,
        (p_order_data->>'user_id')::UUID,
        COALESCE(p_order_data->>'status', 'pending'),
        (p_order_data->>'total_amount')::NUMERIC,
        COALESCE(p_order_data->>'payment_status', 'unpaid'),
        p_order_data->'shipping_address',
        p_order_data->>'contact_email',
        p_order_data->>'contact_phone'
    ) RETURNING id INTO v_order_id;

    -- 2. Insert items and update stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER, unit_price NUMERIC)
    LOOP
        INSERT INTO public.merchandise_order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order_id, v_item.product_id, v_item.quantity, v_item.unit_price);

        -- Deduct stock
        UPDATE public.merchandise 
        SET stock_quantity = stock_quantity - v_item.quantity 
        WHERE id = v_item.product_id;
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Multi-Tenancy Expansion
ALTER TABLE public.public_inquiries ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.fellowship_groups ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.spiritual_milestones ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.public_testimonies ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.public_sermons ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.newsletters ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.prophetic_insights ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.ai_ministry_insights ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.ai_insights ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.user_declarations ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.social_media_metrics ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.membership_requests ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.member_stats ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.pastoral_notes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.soap_entries ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.soap_sentiment_metrics ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.evangelism_pipeline ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.ministry_analytics ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.church_health_metrics ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Update strategic views for Pastor HQ
CREATE OR REPLACE VIEW public.vw_church_attendance_trends AS
SELECT 
    org_id,
    date_trunc('week', event_date) as week_start,
    COUNT(*) as total_attended,
    COUNT(*) FILTER (WHERE attended = true) as present_count
FROM public.attendance_records
GROUP BY org_id, date_trunc('week', event_date);

CREATE OR REPLACE VIEW public.vw_financial_momentum AS
SELECT 
    org_id,
    date_trunc('month', given_date) as month_start,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM public.financial_records
GROUP BY org_id, date_trunc('month', given_date);

CREATE OR REPLACE VIEW public.vw_spiritual_climate AS
SELECT 
    p.org_id,
    date_trunc('week', sm.achieved_at) as week_start,
    COUNT(*) as milestone_count,
    AVG(CASE WHEN sm.milestone_type = 'salvation' THEN 100 ELSE 50 END) as avg_engagement
FROM public.spiritual_milestones sm
JOIN public.profiles p ON p.id = sm.user_id
GROUP BY p.org_id, date_trunc('week', sm.achieved_at);

-- Update Spiritual Pulse for Multi-Tenancy
CREATE OR REPLACE VIEW public.vw_spiritual_pulse AS
SELECT 
    org_id,
    COUNT(id) FILTER (WHERE salvation_date IS NOT NULL) as total_salvations,
    COUNT(id) FILTER (WHERE baptism_date IS NOT NULL) as total_baptisms,
    COUNT(id) FILTER (WHERE membership_date IS NOT NULL) as total_formal_members,
    COUNT(id) FILTER (WHERE foundation_class_date IS NOT NULL) as foundations_complete
FROM public.member_milestones
GROUP BY org_id;

-- Equipment Monitoring View
CREATE OR REPLACE VIEW public.vw_equipment_reports AS
SELECT 
    org_id,
    id as report_id,
    ministry_name,
    (metrics->>'equipment_name') as equipment_name,
    (metrics->>'equipment_status') as equipment_status,
    (metrics->>'repair_required') as repair_required,
    report_date
FROM public.ministry_reports
WHERE metrics->>'equipment_name' IS NOT NULL;
