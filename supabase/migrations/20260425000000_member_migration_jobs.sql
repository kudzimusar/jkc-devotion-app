-- Migration: member_migration_jobs
-- Purpose: Tracks AI-powered bulk member import jobs from any file format.
--          Supports direct import and pending-approval modes.
--          Enables full rollback within 24 hours of import.

CREATE TABLE IF NOT EXISTS public.migration_jobs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- file metadata
  file_name           TEXT        NOT NULL,
  file_size           INTEGER,
  file_type           TEXT        NOT NULL, -- csv, xlsx, xls, pdf, docx, txt, image

  -- job lifecycle
  status              TEXT        NOT NULL DEFAULT 'uploading'
                        CHECK (status IN ('uploading','parsing','review','importing','complete','failed','rolled_back')),

  -- import configuration (set by admin before parsing)
  import_mode         TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (import_mode IN ('direct', 'pending')),
  default_member_type TEXT        NOT NULL DEFAULT 'member'
                        CHECK (default_member_type IN ('member','visitor','leader','staff')),
  default_ministry_id UUID        REFERENCES public.ministries(id) ON DELETE SET NULL,

  -- AI analysis output
  field_mapping       JSONB       DEFAULT '{}',  -- { "Source Column": "church_os_field" }
  ai_confidence       JSONB       DEFAULT '{}',  -- { "church_os_field": 0-100 }
  parsed_data         JSONB       DEFAULT '[]',  -- array of mapped member objects (capped at 2000)
  allocation_summary  JSONB       DEFAULT '{}',  -- { members: N, visitors: N, by_ministry: {...} }
  document_type       TEXT,                      -- general_members | visitors | department_list | mixed
  departments_found   TEXT[]      DEFAULT '{}',

  -- import results
  total_rows          INTEGER     DEFAULT 0,
  imported_rows       INTEGER     DEFAULT 0,
  skipped_rows        INTEGER     DEFAULT 0,
  duplicate_rows      INTEGER     DEFAULT 0,

  -- rollback support: stores the IDs of all inserted profiles for this job
  inserted_profile_ids UUID[]     DEFAULT '{}',
  rollback_available  BOOLEAN     DEFAULT true,

  error_log           JSONB       DEFAULT '[]',
  summary_report      JSONB       DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  rollback_deadline   TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_migration_jobs_org_id     ON public.migration_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_created_by ON public.migration_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_status     ON public.migration_jobs(status);

-- RLS
ALTER TABLE public.migration_jobs ENABLE ROW LEVEL SECURITY;

-- Admins of the org can manage their own migration jobs
CREATE POLICY "Org admins manage migration jobs"
  ON public.migration_jobs
  FOR ALL
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner', 'ministry_lead', 'shepherd')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner', 'ministry_lead', 'shepherd')
    )
  );

-- Super admin bypass
CREATE POLICY "Super admins full access to migration jobs"
  ON public.migration_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_name = 'super_admin'
        AND ur.status = 'active'
    )
  );

-- Auto-expire rollback availability after 24 hours
CREATE OR REPLACE FUNCTION public.fn_expire_migration_rollback()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.migration_jobs
  SET rollback_available = false
  WHERE status = 'complete'
    AND rollback_available = true
    AND completed_at < now() - INTERVAL '24 hours';
END;
$$;

COMMENT ON TABLE public.migration_jobs IS
  'Tracks AI-powered bulk member import jobs. Each job stores parsed data, field mapping, allocation summary, and rollback support.';

-- Rollback function: deletes profiles and org_members created by a job within 24h
CREATE OR REPLACE FUNCTION public.undo_migration_job(target_job_id UUID)
RETURNS void AS $$
DECLARE
    job_profile_ids UUID[];
    job_org_id UUID;
BEGIN
    -- Check if job exists and is within 24h window
    SELECT inserted_profile_ids, org_id INTO job_profile_ids, job_org_id
    FROM public.migration_jobs
    WHERE id = target_job_id 
      AND status = 'complete' 
      AND created_at > (now() - interval '24 hours');

    IF job_profile_ids IS NOT NULL AND array_length(job_profile_ids, 1) > 0 THEN
        -- Delete from dependent tables first
        DELETE FROM public.org_members WHERE user_id = ANY(job_profile_ids) AND org_id = job_org_id;
        DELETE FROM public.member_milestones WHERE user_id = ANY(job_profile_ids) AND org_id = job_org_id;
        DELETE FROM public.ministry_members WHERE user_id = ANY(job_profile_ids) AND org_id = job_org_id;
        
        -- Finally delete the profiles
        DELETE FROM public.profiles WHERE id = ANY(job_profile_ids) AND org_id = job_org_id;
        
        -- Update job status
        UPDATE public.migration_jobs 
        SET status = 'rolled_back', 
            rollback_available = false,
            summary_report = summary_report || jsonb_build_object('rolled_back_at', now())
        WHERE id = target_job_id;
    ELSE
        RAISE EXCEPTION 'Rollback not available for this job (either not found, not complete, or expired).';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
