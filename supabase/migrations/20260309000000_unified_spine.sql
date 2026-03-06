-- ============================================================
-- CHURCH OS: UNIFIED DATA SPINE (CONVERGENCE MIGRATION)
-- Phase 1: Creating the master architecture for deep alignment
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MASTER ACTIVITY LEDGER
CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL, 
    -- e.g., member_joined, member_baptized, attendance_checkin, prayer_request, 
    -- ministry_join, devotion_entry, giving_submitted, soap_entry
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 2. JUNIOR CHURCH & CHILDREN'S MINISTRY
CREATE TABLE IF NOT EXISTS public.children_checkins (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    child_name text NOT NULL,
    guardian_id uuid REFERENCES auth.users(id),
    room_name text, -- e.g., Toddlers, Ages 5-7, Pre-teens
    check_in_time timestamptz DEFAULT now(),
    check_out_time timestamptz,
    status text DEFAULT 'checked_in', -- checked_in, checked_out
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guardian_links (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    child_name text NOT NULL,
    relationship text DEFAULT 'Parent', -- Parent, Legal Guardian, Sibling
    child_birthdate date,
    medical_notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(guardian_id, child_name)
);

-- 3. UNIFIED MINISTRY OPERATIONAL REPORTS
CREATE TABLE IF NOT EXISTS public.ministry_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    submitted_by uuid REFERENCES auth.users(id),
    ministry_name text NOT NULL,
    report_date date DEFAULT CURRENT_DATE,
    metrics jsonb NOT NULL, 
    -- Dynamic data: { "attendance": 120, "first_timers": 5, "livestream_views": 450, "souls_won": 2 }
    summary text,
    created_at timestamptz DEFAULT now()
);

-- 4. SPIRITUAL JOURNEY MILESTONES (Formalized)
CREATE TABLE IF NOT EXISTS public.member_milestones (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    first_visit_date date,
    salvation_date date,
    foundation_class_date date,
    baptism_date date,
    membership_date date,
    leadership_training_date date,
    ordained_date date,
    custom_milestones jsonb DEFAULT '[]',
    updated_at timestamptz DEFAULT now()
);

-- 5. OUTREACH & EVANGELISM CONTACTS
CREATE TABLE IF NOT EXISTS public.outreach_contacts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    interviewer_id uuid REFERENCES auth.users(id),
    contact_name text NOT NULL,
    contact_phone text,
    location text,
    spiritual_status text, 
    follow_up_required boolean DEFAULT true,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 6. NOTIFICATIONS SYSTEM
CREATE TABLE IF NOT EXISTS public.member_notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, 
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 7. PROPHETIC INSIGHTS (Unified)
CREATE TABLE IF NOT EXISTS public.prophetic_insights (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES auth.users(id),
    category text NOT NULL, 
    insight_title text NOT NULL,
    insight_description text NOT NULL,
    probability_score int DEFAULT 50,
    risk_level text DEFAULT 'low', 
    metadata jsonb DEFAULT '{}',
    is_acknowledged boolean DEFAULT false,
    generated_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prophetic_insights ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies
DROP POLICY IF EXISTS "Admins read activity" ON public.activity_log;
CREATE POLICY "Admins read activity" ON public.activity_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
);

DROP POLICY IF EXISTS "Guardians manage links" ON public.guardian_links;
CREATE POLICY "Guardians manage links" ON public.guardian_links FOR ALL USING (guardian_id = auth.uid());

DROP POLICY IF EXISTS "Users read notifications" ON public.member_notifications;
CREATE POLICY "Users read notifications" ON public.member_notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage reports" ON public.ministry_reports;
CREATE POLICY "Admins manage reports" ON public.ministry_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner', 'ministry_lead'))
);
