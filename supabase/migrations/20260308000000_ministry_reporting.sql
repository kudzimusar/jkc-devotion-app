-- ============================================================
-- CHURCH OS: MINISTRY REPORTING & MANUAL ATTENDANCE
-- ============================================================

-- 1. Service Reports Table (Manual Headcounts)
CREATE TABLE IF NOT EXISTS public.service_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    report_date date NOT NULL DEFAULT CURRENT_DATE,
    service_type text NOT NULL, -- First Service, Second Service, etc.
    
    -- Headcounts
    adults_count int DEFAULT 0,
    children_count int DEFAULT 0,
    first_timers_count int DEFAULT 0,
    returning_visitors_count int DEFAULT 0,
    total_count int DEFAULT 0,
    
    -- Metadata
    submitted_by uuid REFERENCES auth.users(id),
    notes text,
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(org_id, report_date, service_type)
);

-- 2. Enable RLS
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Admins/Shepherds/Ushers can manage reports
DROP POLICY IF EXISTS "Management and Ushers can manage reports" ON public.service_reports;
CREATE POLICY "Management and Ushers can manage reports" ON public.service_reports 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'shepherd', 'owner', 'ministry_lead')
    )
);

-- 4. Function to reconcile attendance
CREATE OR REPLACE FUNCTION public.get_attendance_reconciliation(p_date date)
RETURNS TABLE (
    service_type text,
    manual_total int,
    registered_total bigint,
    unregistered_visitors int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.service_type,
        sr.total_count as manual_total,
        COUNT(ar.id) as registered_total,
        (sr.total_count - COUNT(ar.id)::int) as unregistered_visitors
    FROM public.service_reports sr
    LEFT JOIN public.attendance_records ar ON ar.event_date = sr.report_date
    WHERE sr.report_date = p_date
    GROUP BY sr.id, sr.service_type, sr.total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
