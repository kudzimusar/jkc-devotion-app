-- MIGRATION: 20260323103000_sermon_and_media_system_upgrade.sql
-- DESCRIPTION: Implements Phase 0 and Phase 1 of the Sermon System Upgrade.
-- Includes: org_id enforcement, media_assets, analytics upgrade, and auto-archiving.

-- 1. Fix public_sermons (CRITICAL)
ALTER TABLE public_sermons
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add lifecycle + structure fields
ALTER TABLE public_sermons
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS video_source_type TEXT DEFAULT 'youtube',
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Rename featured -> is_featured (safe handling)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='public_sermons' AND column_name='featured'
  ) THEN
    ALTER TABLE public_sermons RENAME COLUMN featured TO is_featured;
  END IF;
END $$;

-- Default values for existing data
UPDATE public_sermons SET status = 'published' WHERE status IS NULL;
UPDATE public_sermons SET video_source_type = 'youtube' WHERE video_source_type IS NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sermons_org_id ON public_sermons(org_id);
CREATE INDEX IF NOT EXISTS idx_sermons_status ON public_sermons(status);

-- 2. Create media_assets
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID REFERENCES public_sermons(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  type TEXT, -- 'full_video', 'clip', 'audio', 'transcript', 'notes'
  url TEXT,
  language TEXT,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_sermon ON media_assets(sermon_id);
CREATE INDEX IF NOT EXISTS idx_media_org ON media_assets(org_id);

-- 3. Create sermon_versions
CREATE TABLE IF NOT EXISTS sermon_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID REFERENCES public_sermons(id) ON DELETE CASCADE,
  version_number INTEGER,
  changes JSONB,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Upgrade member_analytics
ALTER TABLE member_analytics
ADD COLUMN IF NOT EXISTS org_id UUID,
ADD COLUMN IF NOT EXISTS sermon_id UUID,
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS watch_time INTEGER,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS geo_location TEXT;

CREATE INDEX IF NOT EXISTS idx_analytics_org ON member_analytics(org_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sermon ON member_analytics(sermon_id);

-- 5. Create live_streams
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  status TEXT DEFAULT 'idle', -- 'idle', 'live', 'ended'
  stream_url TEXT,
  backup_url TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_org ON live_streams(org_id);

-- 6. Enforce Multi-Tenant Safety (RLS)
ALTER TABLE public_sermons ENABLE ROW LEVEL SECURITY;

-- Note: Using a DO block to safely handle policy creation if it exists
DO $$
BEGIN
    DROP POLICY IF EXISTS "Org isolation sermons" ON public_sermons;
    CREATE POLICY "Org isolation sermons"
    ON public_sermons
    FOR ALL
    USING (org_id::text IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    ));
END $$;

-- Enable RLS for new tables
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation media_assets" ON media_assets FOR ALL USING (org_id::text IN (SELECT org_id::text FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org isolation live_streams" ON live_streams FOR ALL USING (org_id::text IN (SELECT org_id::text FROM org_members WHERE user_id = auth.uid()));


-- 7. Automation: Auto-archive when new featured is set
CREATE OR REPLACE FUNCTION auto_archive_old_featured()
RETURNS TRIGGER AS $$
BEGIN
  -- When a sermon is marked as featured, unfeature others in the same org
  UPDATE public_sermons
  SET is_featured = false, status = 'archived'
  WHERE org_id = NEW.org_id
    AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_archive ON public_sermons;
CREATE TRIGGER trigger_auto_archive
AFTER UPDATE ON public_sermons
FOR EACH ROW
WHEN (NEW.is_featured = true)
EXECUTE FUNCTION auto_archive_old_featured();
