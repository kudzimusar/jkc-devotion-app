-- ============================================================
-- MASTER SECURITY MIGRATION v2: Complete org_id Isolation
-- ============================================================
-- Purpose: Add org_id to ALL user-activity tables to fix data leaks
-- Date: 2026-03-27
-- 
-- Tables covered:
-- 1. soap_entries (journals)
-- 2. pastoral_notes (private pastoral notes)
-- 3. financial_records (tithes/offerings)
-- 4. prayer_requests
-- 5. member_stats (engagement metrics)
-- 6. attendance_records
-- 7. ministry_members
-- 8. evangelism_pipeline
-- 9. system_activity_logs
-- 10. household_members (family/household data)
-- 11. member_skills (spiritual gifts/skills)
-- 12. guardian_links (family relationships)
-- ============================================================

BEGIN;

-- ============================================================
-- Helper function for safe column addition
-- ============================================================
CREATE OR REPLACE FUNCTION safe_add_org_id(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = safe_add_org_id.table_name 
        AND column_name = 'org_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN org_id UUID REFERENCES public.organizations(id)', table_name);
        RAISE NOTICE 'Added org_id to %', table_name;
    ELSE
        RAISE NOTICE 'org_id already exists in %', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE 1: soap_entries
-- ============================================================
PERFORM safe_add_org_id('soap_entries');

UPDATE public.soap_entries se
SET org_id = p.org_id
FROM public.profiles p
WHERE se.user_id = p.id
AND se.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.soap_entries WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: soap_entries has NULL org_id records. Skipping NOT NULL constraint.';
    ELSE
        ALTER TABLE public.soap_entries ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_soap_entries_org_id ON public.soap_entries(org_id);

-- Drop old policies
DROP POLICY IF EXISTS "Admins read all soap anonymized" ON public.soap_entries;
DROP POLICY IF EXISTS "Users can view own soap entries" ON public.soap_entries;

-- New policies
CREATE POLICY "soap_entries_user_own_org" ON public.soap_entries
    FOR SELECT USING (
        auth.uid() = user_id 
        AND org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "soap_entries_admin_org" ON public.soap_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid()
            AND om.org_id = soap_entries.org_id
            AND om.role IN ('shepherd', 'pastor', 'admin', 'owner')
        )
    );

-- ============================================================
-- TABLE 2: pastoral_notes
-- ============================================================
PERFORM safe_add_org_id('pastoral_notes');

UPDATE public.pastoral_notes pn
SET org_id = p.org_id
FROM public.profiles p
WHERE pn.member_id = p.id
AND pn.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.pastoral_notes WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: pastoral_notes has NULL org_id records.';
    ELSE
        ALTER TABLE public.pastoral_notes ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pastoral_notes_org_id ON public.pastoral_notes(org_id);

DROP POLICY IF EXISTS "Pastors can view notes" ON public.pastoral_notes;

CREATE POLICY "pastoral_notes_admin_org" ON public.pastoral_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid()
            AND om.org_id = pastoral_notes.org_id
            AND om.role IN ('shepherd', 'pastor', 'admin', 'owner')
        )
    );

-- ============================================================
-- TABLE 3: financial_records
-- ============================================================
PERFORM safe_add_org_id('financial_records');

UPDATE public.financial_records fr
SET org_id = p.org_id
FROM public.profiles p
WHERE fr.user_id = p.id
AND fr.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.financial_records WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: financial_records has NULL org_id records.';
    ELSE
        ALTER TABLE public.financial_records ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_records_org_id ON public.financial_records(org_id);

-- ============================================================
-- TABLE 4: prayer_requests
-- ============================================================
PERFORM safe_add_org_id('prayer_requests');

UPDATE public.prayer_requests pr
SET org_id = p.org_id
FROM public.profiles p
WHERE pr.user_id = p.id
AND pr.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.prayer_requests WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: prayer_requests has NULL org_id records.';
    ELSE
        ALTER TABLE public.prayer_requests ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prayer_requests_org_id ON public.prayer_requests(org_id);

-- ============================================================
-- TABLE 5: member_stats
-- ============================================================
PERFORM safe_add_org_id('member_stats');

UPDATE public.member_stats ms
SET org_id = p.org_id
FROM public.profiles p
WHERE ms.user_id = p.id
AND ms.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.member_stats WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: member_stats has NULL org_id records.';
    ELSE
        ALTER TABLE public.member_stats ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_member_stats_org_id ON public.member_stats(org_id);

-- ============================================================
-- TABLE 6: attendance_records
-- ============================================================
PERFORM safe_add_org_id('attendance_records');

UPDATE public.attendance_records ar
SET org_id = p.org_id
FROM public.profiles p
WHERE ar.user_id = p.id
AND ar.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.attendance_records WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: attendance_records has NULL org_id records.';
    ELSE
        ALTER TABLE public.attendance_records ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_records_org_id ON public.attendance_records(org_id);

-- ============================================================
-- TABLE 7: ministry_members
-- ============================================================
PERFORM safe_add_org_id('ministry_members');

UPDATE public.ministry_members mm
SET org_id = p.org_id
FROM public.profiles p
WHERE mm.user_id = p.id
AND mm.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.ministry_members WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: ministry_members has NULL org_id records.';
    ELSE
        ALTER TABLE public.ministry_members ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ministry_members_org_id ON public.ministry_members(org_id);

-- ============================================================
-- TABLE 8: evangelism_pipeline
-- ============================================================
PERFORM safe_add_org_id('evangelism_pipeline');

UPDATE public.evangelism_pipeline ep
SET org_id = p.org_id
FROM public.profiles p
WHERE ep.assigned_to = p.id
AND ep.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.evangelism_pipeline WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: evangelism_pipeline has NULL org_id records.';
    ELSE
        ALTER TABLE public.evangelism_pipeline ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evangelism_pipeline_org_id ON public.evangelism_pipeline(org_id);

-- ============================================================
-- TABLE 9: system_activity_logs
-- ============================================================
PERFORM safe_add_org_id('system_activity_logs');

UPDATE public.system_activity_logs sal
SET org_id = p.org_id
FROM public.profiles p
WHERE sal.user_id = p.id
AND sal.org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_system_activity_logs_org_id ON public.system_activity_logs(org_id);

-- ============================================================
-- TABLE 10: household_members
-- ============================================================
PERFORM safe_add_org_id('household_members');

UPDATE public.household_members hm
SET org_id = p.org_id
FROM public.profiles p
WHERE hm.user_id = p.id
AND hm.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.household_members WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: household_members has NULL org_id records.';
    ELSE
        ALTER TABLE public.household_members ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_household_members_org_id ON public.household_members(org_id);

-- ============================================================
-- TABLE 11: member_skills
-- ============================================================
PERFORM safe_add_org_id('member_skills');

UPDATE public.member_skills ms
SET org_id = p.org_id
FROM public.profiles p
WHERE ms.user_id = p.id
AND ms.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.member_skills WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: member_skills has NULL org_id records.';
    ELSE
        ALTER TABLE public.member_skills ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_member_skills_org_id ON public.member_skills(org_id);

-- ============================================================
-- TABLE 12: guardian_links
-- ============================================================
PERFORM safe_add_org_id('guardian_links');

UPDATE public.guardian_links gl
SET org_id = p.org_id
FROM public.profiles p
WHERE gl.guardian_id = p.id
AND gl.org_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.guardian_links WHERE org_id IS NULL) THEN
        RAISE NOTICE 'WARNING: guardian_links has NULL org_id records.';
    ELSE
        ALTER TABLE public.guardian_links ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_guardian_links_org_id ON public.guardian_links(org_id);

-- ============================================================
-- Clean up helper function
-- ============================================================
DROP FUNCTION IF EXISTS safe_add_org_id(TEXT);

COMMIT;
