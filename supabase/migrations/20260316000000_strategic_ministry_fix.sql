-- CHURCH OS: STRATEGIC MINISTRY & OPERATIONS MIGRATION
-- Consolidates Ministries, Leader Roles, and Digital Form Intelligence.

DO $$
DECLARE
    v_org_id uuid;
    v_usher_form_id uuid;
    v_kids_form_id uuid;
    v_outreach_form_id uuid;
    v_generic_form_id uuid;
BEGIN
    -- 1. Ensure Organization context exists
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name, domain) 
        VALUES ('Global Ministry Org', 'global-ministry.church') 
        RETURNING id INTO v_org_id;
        RAISE NOTICE 'Created default organization with ID: %', v_org_id;
    END IF;

    -- 2. Create Ministries Table
    CREATE TABLE IF NOT EXISTS public.ministries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text NOT NULL,
        description text,
        category text, -- 'worship', 'operations', 'pastoral', 'outreach'
        created_at timestamptz DEFAULT now(),
        UNIQUE(org_id, name),
        UNIQUE(org_id, slug)
    );

    -- 2.1 Ensure Kids Registry exists
    CREATE TABLE IF NOT EXISTS public.kids_registry (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
        child_name text NOT NULL,
        age int,
        parent_name text,
        allergies text,
        check_in_time timestamptz DEFAULT now(),
        checked_out_at timestamptz,
        supervised_by uuid,
        status text DEFAULT 'checked_in',
        created_at timestamptz DEFAULT now()
    );

    -- 3. Enhance org_members for Onboarding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'org_members' AND column_name = 'ministry_id') THEN
        ALTER TABLE public.org_members 
        ADD COLUMN ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
        ADD COLUMN invitation_status text DEFAULT 'active',
        ADD COLUMN invitation_token text UNIQUE,
        ADD COLUMN invitation_sent_at timestamptz;
    END IF;

    -- 4. Seed Initial Ministries (if not exist)
    INSERT INTO public.ministries (org_id, name, slug, category) VALUES
    (v_org_id, 'Ushering', 'ushering', 'operations'),
    (v_org_id, 'Children''s Ministry', 'children', 'operations'),
    (v_org_id, 'Evangelism', 'evangelism', 'outreach'),
    (v_org_id, 'Worship Team', 'worship', 'pastoral'),
    (v_org_id, 'Protocol', 'protocol', 'operations')
    ON CONFLICT (org_id, slug) DO NOTHING;

    -- 5. Seed Initial Forms (Aligned with Shepherd UI logic)
    -- Note: Uses 'ministry' column from master_schema_fix.sql
    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES 
    (v_org_id, 'Usher Headcount Report', 'Official attendance tracking for services', 'ushering')
    ON CONFLICT DO NOTHING RETURNING id INTO v_usher_form_id;

    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES 
    (v_org_id, 'Child Check-In', 'Digital registration for children services', 'children')
    ON CONFLICT DO NOTHING RETURNING id INTO v_kids_form_id;

    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES 
    (v_org_id, 'Evangelism Log', 'Capture outreach decisions and follow-up needs', 'evangelism')
    ON CONFLICT DO NOTHING RETURNING id INTO v_outreach_form_id;

    INSERT INTO public.forms (org_id, name, description, ministry)
    VALUES 
    (v_org_id, 'Weekly Ministry Report', 'Generic operational feedback for departmental leads', 'operations')
    ON CONFLICT DO NOTHING RETURNING id INTO v_generic_form_id;

    -- 6. Add Fields for Usher Report (Essential for Attendance Reconciliation)
    IF v_usher_form_id IS NOT NULL THEN
        INSERT INTO public.form_fields (org_id, form_id, label, field_type, is_required, sort_order)
        VALUES 
        (v_org_id, v_usher_form_id, 'Adults', 'counter', true, 1),
        (v_org_id, v_usher_form_id, 'Children', 'counter', true, 2),
        (v_org_id, v_usher_form_id, 'Total Adults', 'number', true, 3), -- Used by analytic views
        (v_org_id, v_usher_form_id, 'Number of Children', 'number', true, 4) -- Used by analytic views
        ON CONFLICT DO NOTHING;
    END IF;

    -- 7. Add Fields for Child Check-In (Essential for Kids Registry)
    IF v_kids_form_id IS NOT NULL THEN
        INSERT INTO public.form_fields (org_id, form_id, label, field_type, is_required, sort_order)
        VALUES 
        (v_org_id, v_kids_form_id, 'Child Name', 'text', true, 1),
        (v_org_id, v_kids_form_id, 'Age', 'number', true, 2),
        (v_org_id, v_kids_form_id, 'Parent/Guardian Name', 'text', true, 3),
        (v_org_id, v_kids_form_id, 'Allergies', 'text', false, 4)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

-- 8. RPC TO INVITE LEADER (Security Definer for admin bypass)
CREATE OR REPLACE FUNCTION public.invite_ministry_leader(
    p_user_id uuid,
    p_org_id uuid,
    p_ministry_id uuid,
    p_role text
) RETURNS uuid AS $$
DECLARE
    v_token uuid;
BEGIN
    v_token := gen_random_uuid();
    
    INSERT INTO public.org_members (user_id, org_id, role, ministry_id, invitation_status, invitation_token, invitation_sent_at)
    VALUES (p_user_id, p_org_id, p_role, p_ministry_id, 'pending', v_token::text, now())
    ON CONFLICT (user_id, org_id) DO UPDATE SET
        role = EXCLUDED.role,
        ministry_id = EXCLUDED.ministry_id,
        invitation_status = 'pending',
        invitation_token = v_token::text,
        invitation_sent_at = now();
        
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Updated RLS for specialized views
-- Ensure ministry leaders can see their relevant data
DROP POLICY IF EXISTS "Ministry leaders view own kids registry" ON public.kids_registry;
CREATE POLICY "Ministry leaders view own kids registry" ON public.kids_registry FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.org_members om
        JOIN public.ministries m ON om.ministry_id = m.id
        WHERE om.user_id = auth.uid() 
        AND (om.role IN ('admin', 'shepherd', 'owner', 'pastor', 'super_admin') 
             OR (om.role = 'ministry_leader' AND m.slug = 'children'))
    )
);

DROP POLICY IF EXISTS "Ministry leaders view relevant form submissions" ON public.form_submissions;
CREATE POLICY "Ministry leaders view relevant form submissions" ON public.form_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members om
        JOIN public.ministries m ON om.ministry_id = m.id
        JOIN public.forms f ON f.ministry = m.slug
        WHERE om.user_id = auth.uid() 
        AND (om.role IN ('admin', 'shepherd', 'owner', 'pastor', 'super_admin') 
             OR (om.role = 'ministry_leader' AND public.form_submissions.form_id = f.id))
    )
);

-- Ensure form fields are visible to all authenticated users for rendering
DROP POLICY IF EXISTS "Authenticated users view form fields" ON public.form_fields;
CREATE POLICY "Authenticated users view form fields" ON public.form_fields FOR SELECT USING (
    auth.role() = 'authenticated'
);

NOTIFY pgrst, 'reload schema';
