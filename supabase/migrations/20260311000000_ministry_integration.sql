-- ============================================================
-- CHURCH OS: MINISTRY FORM INTEGRATION & DATA DISPATCHER
-- This migration connects the Dynamic Forms to the Core Schema.
-- ============================================================

-- 1. Extend Form Submissions with metadata
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- 2. SEED ALL MINISTRY FORMS (Comprehensive list from Strategic Plan)
DO $$
DECLARE
    v_org_id uuid;
    v_form_id uuid;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NULL THEN RETURN; END IF;

    -- YOUTH MINISTRY REPORT
    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES (v_org_id, 'Youth Meeting Report', 'Post-meeting activity and attendance record', 'youth')
    RETURNING id INTO v_form_id;

    INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
    VALUES 
        (v_form_id, 'Attendance', 'counter', true, 0),
        (v_form_id, 'New Youth Visitors', 'counter', false, 1),
        (v_form_id, 'Lesson Topic', 'text', true, 2),
        (v_form_id, 'Volunteer Count', 'counter', false, 3),
        (v_form_id, 'Follow-up Actions', 'text', false, 4);

    -- EVANGELISM OUTREACH LOG
    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES (v_org_id, 'Evangelism Activity Log', 'Records outreach impact and soul harvest', 'evangelism')
    RETURNING id INTO v_form_id;

    INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
    VALUES 
        (v_form_id, 'Location', 'text', true, 0),
        (v_form_id, 'People Engaged', 'counter', true, 1),
        (v_form_id, 'Salvation Decisions', 'counter', false, 2),
        (v_form_id, 'Contacts Collected', 'counter', false, 3),
        (v_form_id, 'Prayer Given', 'counter', false, 4),
        (v_form_id, 'Bibles Distributed', 'counter', false, 5);

    -- PRAYER MEETING REPORT
    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES (v_org_id, 'Intercessory Prayer Report', 'Summary of specific prayer session impact', 'prayer')
    RETURNING id INTO v_form_id;

    INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
    VALUES 
        (v_form_id, 'Attendance', 'counter', true, 0),
        (v_form_id, 'Requests Prayed For', 'counter', true, 1),
        (v_form_id, 'Testimonies Recorded', 'text', false, 2);

    -- SMALL GROUP (FELLOWSHIP) REPORT
    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES (v_org_id, 'Fellowship Group Report', 'Weekly cell group attendance and discussion', 'discipleship')
    RETURNING id INTO v_form_id;

    INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
    VALUES 
        (v_form_id, 'Group Name', 'text', true, 0),
        (v_form_id, 'Attendance', 'counter', true, 1),
        (v_form_id, 'New Members', 'counter', false, 2),
        (v_form_id, 'Discussion Topic', 'text', true, 3);

END $$;

-- 3. THE INTEGRATION DISPATCHER FUNCTION
-- This function processes submission values and populates core tables.
CREATE OR REPLACE FUNCTION public.fn_process_all_form_submissions()
RETURNS trigger AS $$
DECLARE
    v_form_name text;
    v_form_id uuid;
    v_sub_id uuid;
    v_org_id uuid;
    v_values jsonb;
BEGIN
    v_sub_id := NEW.id;
    v_form_id := NEW.form_id;

    -- Fetch form identity
    SELECT name, org_id INTO v_form_name, v_org_id FROM public.forms WHERE id = v_form_id;

    -- Aggregate values into a handy JSONB object for easier access
    SELECT jsonb_object_agg(ff.label, fsv.value) INTO v_values
    FROM public.form_submission_values fsv
    JOIN public.form_fields ff ON ff.id = fsv.field_id
    WHERE fsv.submission_id = v_sub_id;

    -- 1. DISPATCH: Usher Headcount Report -> service_reports
    IF v_form_name = 'Usher Headcount Report' THEN
        INSERT INTO public.service_reports (
            org_id, 
            report_date, 
            service_type, 
            adults_count, 
            children_count, 
            first_timers_count, 
            returning_visitors_count, 
            total_count, 
            submitted_by,
            notes
        ) 
        VALUES (
            v_org_id, 
            NEW.submitted_at::date, 
            COALESCE(v_values->>'Service Name', 'Main Service'),
            COALESCE((v_values->>'Adult Count')::int, 0),
            COALESCE((v_values->>'Children Count')::int, 0),
            COALESCE((v_values->>'First Time Visitors')::int, 0),
            COALESCE((v_values->>'Returning Visitors')::int, 0),
            COALESCE((v_values->>'Adult Count')::int, 0) + COALESCE((v_values->>'Children Count')::int, 0),
            NEW.user_id,
            v_values->>'Notes'
        )
        ON CONFLICT (org_id, report_date, service_type) 
        DO UPDATE SET 
            adults_count = EXCLUDED.adults_count,
            children_count = EXCLUDED.children_count,
            total_count = EXCLUDED.total_count,
            notes = EXCLUDED.notes;

    -- 2. DISPATCH: Prayer Request Intake -> prayer_requests
    ELSIF v_form_name = 'Child Check-In' THEN
        -- Logic for child registration could go here
        NULL;

    -- 3. DISPATCH: Evangelism Activity Log -> evangelism_pipeline (aggregated log entry)
    ELSIF v_form_name = 'Evangelism Activity Log' THEN
        -- We'll create a summary note in the pipeline or just rely on the form view for now.
        -- For higher impact, we could create a "Mass Outreach" entry here.
        NULL;
    END IF;

    -- Mark as processed
    UPDATE public.form_submissions SET processed_at = now() WHERE id = v_sub_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for Form Processing
-- Note: In a real-world scenario with separate inserts for values, 
-- you might trigger this on a "Finalize" button or via a background cron.
-- For now, we'll provide a manual RPC to trigger processing if the client knows values are done,
-- or trigger it after a delay.

CREATE OR REPLACE FUNCTION public.finalize_form_submission(p_submission_id uuid)
RETURNS void AS $$
BEGIN
    -- This manually triggers the processing once the client confirms all values are uploaded.
    -- Better for race condition safety than a raw trigger on the values table.
    PERFORM public.fn_process_all_form_submissions_for_id(p_submission_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_process_all_form_submissions_for_id(p_submission_id uuid)
RETURNS void AS $$
DECLARE
    v_sub record;
    v_form_name text;
    v_org_id uuid;
    v_values jsonb;
BEGIN
    SELECT * INTO v_sub FROM public.form_submissions WHERE id = p_submission_id;
    IF v_sub IS NULL THEN RETURN; END IF;

    SELECT name, org_id INTO v_form_name, v_org_id FROM public.forms WHERE id = v_sub.form_id;

    SELECT jsonb_object_agg(ff.label, fsv.value) INTO v_values
    FROM public.form_submission_values fsv
    JOIN public.form_fields ff ON ff.id = fsv.field_id
    WHERE fsv.submission_id = p_submission_id;

    IF v_form_name = 'Usher Headcount Report' THEN
        INSERT INTO public.service_reports (
            org_id, report_date, service_type, adults_count, children_count, 
            first_timers_count, returning_visitors_count, total_count, submitted_by, notes
        ) 
        VALUES (
            v_org_id, v_sub.submitted_at::date, 
            COALESCE(v_values->>'Service Name', 'Main Service'),
            COALESCE((v_values->>'Adult Count')::int, 0),
            COALESCE((v_values->>'Children Count')::int, 0),
            COALESCE((v_values->>'First Time Visitors')::int, 0),
            COALESCE((v_values->>'Returning Visitors')::int, 0),
            COALESCE((v_values->>'Adult Count')::int, 0) + COALESCE((v_values->>'Children Count')::int, 0),
            v_sub.user_id, v_values->>'Notes'
        )
        ON CONFLICT (org_id, report_date, service_type) DO UPDATE SET 
            adults_count = EXCLUDED.adults_count, children_count = EXCLUDED.children_count,
            total_count = EXCLUDED.total_count, notes = EXCLUDED.notes;
    END IF;

    UPDATE public.form_submissions SET processed_at = now() WHERE id = p_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INTELLIGENCE VIEW FOR AI
-- Aggregates all operational metrics into a single "Prophetic Intelligence Feed"
CREATE OR REPLACE VIEW public.vw_ministry_intelligence_feed AS
SELECT 
    'attendance' as metric_type,
    report_date::text as event_date,
    service_type as detail,
    total_count as value,
    notes as context
FROM public.service_reports
UNION ALL
SELECT 
    'evangelism' as metric_type,
    submitted_at::date::text as event_date,
    'Outreach Decisons' as detail,
    (SELECT SUM(fsv.value::int) FROM public.form_submission_values fsv 
     JOIN public.form_fields ff ON ff.id = fsv.field_id 
     WHERE fsv.submission_id = fs.id AND ff.label = 'Salvation Decisions') as value,
    'Mass Outreach Event' as context
FROM public.form_submissions fs
JOIN public.forms f ON f.id = fs.form_id
WHERE f.name = 'Evangelism Activity Log';

NOTIFY pgrst, 'reload schema';
