-- CHURCH OS: DIGITAL MINISTRY FORMS ENGINE
-- This migration establishes the dynamic form structure for role-based operational data collection.

-- 1. Forms Definition Table
CREATE TABLE IF NOT EXISTS public.forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    ministry text NOT NULL, -- ushering, children, prayer, evangelism, etc.
    campus_scope boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 2. Form Fields Table (Dynamic Schema)
CREATE TABLE IF NOT EXISTS public.form_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE,
    label text NOT NULL,
    field_type text NOT NULL, -- text, number, counter, select, date, boolean
    is_required boolean DEFAULT false,
    options_json jsonb, -- For select/dropdown options
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. Form Submissions (Header)
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    campus_id uuid, -- Reference to organization campuses if available
    service_id uuid, -- Optional link to a specific event/service
    submitted_at timestamptz DEFAULT now()
);

-- 4. Form Submission Values (EAV Pattern)
CREATE TABLE IF NOT EXISTS public.form_submission_values (
    submission_id uuid REFERENCES public.form_submissions(id) ON DELETE CASCADE,
    field_id uuid REFERENCES public.form_fields(id) ON DELETE CASCADE,
    value text, -- Values stored as text, parsed based on field_type
    PRIMARY KEY (submission_id, field_id)
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submission_values ENABLE ROW LEVEL SECURITY;

-- Policies: Forms and Fields are readable by authenticated users (filtered in UI by role)
CREATE POLICY "Users can view active forms" ON public.forms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view form fields" ON public.form_fields
    FOR SELECT USING (true);

-- Submissions: Users can insert their own submissions, Admins can view all
CREATE POLICY "Users can submit form data" ON public.form_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.org_members
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'shepherd')
        )
    );

CREATE POLICY "Users can insert submission values" ON public.form_submission_values
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.form_submissions
            WHERE id = submission_id AND user_id = auth.uid()
        )
    );

-- SEED INITIAL FORMS
DO $$
DECLARE
    v_org_id uuid;
    v_usher_form_id uuid;
    v_kids_form_id uuid;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        -- 1. Usher Headcount Form
        INSERT INTO public.forms (org_id, name, description, ministry)
        VALUES (v_org_id, 'Usher Headcount Report', 'Official service attendance record', 'ushering')
        RETURNING id INTO v_usher_form_id;

        INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
        VALUES 
            (v_usher_form_id, 'Service Name', 'text', true, 0),
            (v_usher_form_id, 'Adult Count', 'counter', true, 1),
            (v_usher_form_id, 'Children Count', 'counter', true, 2),
            (v_usher_form_id, 'First Time Visitors', 'counter', false, 3),
            (v_usher_form_id, 'Returning Visitors', 'counter', false, 4),
            (v_usher_form_id, 'Notes', 'text', false, 5);

        -- 2. Children Ministry Registration
        INSERT INTO public.forms (org_id, name, description, ministry)
        VALUES (v_org_id, 'Child Check-In', 'Manual registration for kids department', 'children')
        RETURNING id INTO v_kids_form_id;

        INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
        VALUES 
            (v_kids_form_id, 'Child Name', 'text', true, 0),
            (v_kids_form_id, 'Age', 'number', true, 1),
            (v_kids_form_id, 'Parent/Guardian Name', 'text', true, 2),
            (v_kids_form_id, 'Allergies', 'text', false, 3);
-- 5. Attendance Reconciliation View
CREATE OR REPLACE VIEW public.vw_attendance_reconciliation AS
WITH manual_counts AS (
    SELECT 
        fs.submitted_at::date as report_date,
        fs.form_id,
        MAX(CASE WHEN ff.label = 'Adult Count' THEN fsv.value::int ELSE 0 END) as manual_adults,
        MAX(CASE WHEN ff.label = 'Children Count' THEN fsv.value::int ELSE 0 END) as manual_children,
        MAX(CASE WHEN ff.label = 'First Time Visitors' THEN fsv.value::int ELSE 0 END) as manual_visitors
    FROM public.form_submissions fs
    JOIN public.form_submission_values fsv ON fsv.submission_id = fs.id
    JOIN public.form_fields ff ON ff.id = fsv.field_id
    JOIN public.forms f ON f.id = fs.form_id
    WHERE f.name = 'Usher Headcount Report'
    GROUP BY fs.id, fs.submitted_at::date, fs.form_id
),
digital_counts AS (
    SELECT 
        event_date::date as report_date,
        COUNT(id) as digital_total
    FROM public.attendance_records
    GROUP BY event_date::date
)
SELECT 
    mc.report_date,
    (mc.manual_adults + mc.manual_children) as total_physical,
    mc.manual_adults,
    mc.manual_children,
    mc.manual_visitors,
    COALESCE(dc.digital_total, 0) as total_digital,
    ((mc.manual_adults + mc.manual_children) - COALESCE(dc.digital_total, 0)) as unregistered_count
FROM manual_counts mc
LEFT JOIN digital_counts dc ON dc.report_date = mc.report_date;

NOTIFY pgrst, 'reload schema';
