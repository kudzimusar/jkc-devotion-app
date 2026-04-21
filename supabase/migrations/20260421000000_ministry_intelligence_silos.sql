-- ==============================================================================
-- Migration: 20260421000000_ministry_intelligence_silos.sql
-- Description: Creates the foundation for the Distributed Ministry Silos,
--              enabling forms, data pipelines, and instant feedback loops.
-- ==============================================================================

-- 1. MINISTRY ATTENDANCE (Data Engine 1)
CREATE TABLE IF NOT EXISTS public.ministry_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    total_volunteers INTEGER DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    notes TEXT,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministry_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Admins/Pastors can manage, Ministry leaders can insert/view for their ministry
CREATE POLICY "org_admin_attendance_manage" ON public.ministry_attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND org_id = ministry_attendance.org_id AND role IN ('admin', 'owner', 'shepherd', 'pastor'))
  );

CREATE POLICY "ministry_lead_attendance_insert" ON public.ministry_attendance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ministry_members WHERE user_id = auth.uid() AND ministry_id = ministry_attendance.ministry_id)
  );

CREATE POLICY "ministry_lead_attendance_select" ON public.ministry_attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ministry_members WHERE user_id = auth.uid() AND ministry_id = ministry_attendance.ministry_id)
  );


-- 2. MINISTRY EXECUTION REPORTS (Data Engine 2)
CREATE TABLE IF NOT EXISTS public.ministry_execution_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    wins TEXT,
    challenges TEXT,
    needs_attention BOOLEAN DEFAULT false,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministry_execution_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_execution_manage" ON public.ministry_execution_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND org_id = ministry_execution_reports.org_id AND role IN ('admin', 'owner', 'shepherd', 'pastor'))
  );

CREATE POLICY "ministry_lead_execution_access" ON public.ministry_execution_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ministry_members WHERE user_id = auth.uid() AND ministry_id = ministry_execution_reports.ministry_id)
  );


-- 3. MINISTRY COMMS OUTBOX (Decentralized Emailing)
CREATE TABLE IF NOT EXISTS public.ministry_comms_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_type TEXT NOT NULL DEFAULT 'all_volunteers',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministry_comms_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_comms_manage" ON public.ministry_comms_outbox
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND org_id = ministry_comms_outbox.org_id AND role IN ('admin', 'owner', 'shepherd', 'pastor'))
  );

CREATE POLICY "ministry_lead_comms_access" ON public.ministry_comms_outbox
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ministry_members WHERE user_id = auth.uid() AND ministry_id = ministry_comms_outbox.ministry_id)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ministry_attendance_org_min ON public.ministry_attendance(org_id, ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_execution_org_min ON public.ministry_execution_reports(org_id, ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_comms_org_min ON public.ministry_comms_outbox(org_id, ministry_id);
