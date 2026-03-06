
-- CHURCH OS: MASTER SCHEMA FIX & MULTI-TENANCY ENFORCEMENT
-- This script ensures all tables exist, have org_id, and correct RLS policies.

-- 0. Security Functions (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_staff_of_org(p_user_id uuid, p_org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = p_user_id 
    AND org_id = p_org_id
    AND role IN ('shepherd', 'admin', 'owner', 'super_admin', 'ministry_lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Ensure Attendance Table exists and matches expected name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_attendance' AND table_schema = 'public') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_records' AND table_schema = 'public') THEN
        ALTER TABLE public.service_attendance RENAME TO attendance_records;
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type text NOT NULL DEFAULT 'sunday_service',
    event_date date NOT NULL,
    attended boolean DEFAULT true,
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, event_type, event_date)
);

-- 2. Ensure Forms Engine Tables
CREATE TABLE IF NOT EXISTS public.forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    ministry text NOT NULL,
    campus_scope boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.form_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE,
    label text NOT NULL,
    field_type text NOT NULL,
    is_required boolean DEFAULT false,
    options_json jsonb,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    campus_id uuid,
    service_id uuid,
    submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_submission_values (
    submission_id uuid REFERENCES public.form_submissions(id) ON DELETE CASCADE,
    field_id uuid REFERENCES public.form_fields(id) ON DELETE CASCADE,
    value text,
    PRIMARY KEY (submission_id, field_id)
);

-- 3. Ensure Evangelism Pipeline (referenced in growth page)
CREATE TABLE IF NOT EXISTS public.evangelism_pipeline (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    prospect_name text NOT NULL,
    invited_by uuid REFERENCES auth.users(id),
    stage text DEFAULT 'invited_visitor',
    stage_date date,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 4. Add org_id to All Core Tables and Seed it
DO $$
DECLARE
    t text;
    v_org_id uuid;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    FOR t IN SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('households', 'devotions', 'member_stats', 'soap_entries', 
                               'prayer_requests', 'attendance_records', 'ministry_members', 
                               'pastoral_notes', 'fellowship_groups', 'evangelism_pipeline', 
                               'financial_records', 'events', 'ai_insights')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = t AND column_name = 'org_id' AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE', t);
            
            IF v_org_id IS NOT NULL THEN
                EXECUTE format('UPDATE public.%I SET org_id = %L WHERE org_id IS NULL', t, v_org_id);
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 5. Secure All Tables with RLS and org_id
-- We'll apply policies selectively based on table structure.

DO $$
DECLARE
    t text;
BEGIN
    -- 5A. Public Tables (Selectable by everyone, modifiable by staff)
    FOREACH t IN ARRAY ARRAY['devotions', 'events', 'forms', 'form_fields', 'fellowship_groups'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public select" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Admin manage" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public select" ON public.%I FOR SELECT USING (true)', t);
        EXECUTE format('CREATE POLICY "Admin manage" ON public.%I FOR ALL USING (check_is_staff_of_org(auth.uid(), org_id))', t);
    END LOOP;

    -- 5B. User-Specific Tables (User sees own, Staff sees org-wide)
    FOREACH t IN ARRAY ARRAY['attendance_records', 'member_stats', 'soap_entries', 'prayer_requests', 'form_submissions', 'evangelism_pipeline', 'financial_records'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "User-Staff Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "User-Staff Access" ON public.%I FOR ALL USING (
            (auth.uid() = user_id) OR check_is_staff_of_org(auth.uid(), org_id)
        )', t);
    END LOOP;

    -- 5C. Tables where User ID is different (pastoral_notes uses member_user_id)
    ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Pastoral Note Access" ON public.pastoral_notes;
    CREATE POLICY "Pastoral Note Access" ON public.pastoral_notes FOR ALL USING (
        (auth.uid() = member_user_id) OR check_is_staff_of_org(auth.uid(), org_id)
    );
END;
$$;

-- 6. Seed initial forms if organizations exist
DO $$
DECLARE
    v_org_id uuid;
    v_form_id uuid;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.forms WHERE org_id = v_org_id) THEN
        INSERT INTO public.forms (org_id, name, description, ministry)
        VALUES (v_org_id, 'Usher Headcount Report', 'Official service attendance record', 'ushering')
        RETURNING id INTO v_form_id;

        INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
        VALUES 
            (v_form_id, 'Service Name', 'text', true, 0),
            (v_form_id, 'Adult Count', 'counter', true, 1),
            (v_form_id, 'Children Count', 'counter', true, 2),
            (v_form_id, 'First Time Visitors', 'counter', false, 3),
            (v_form_id, 'Notes', 'text', false, 4);
    END IF;
END;
$$;

-- 7. Reload
NOTIFY pgrst, 'reload schema';
