-- ============================================================
-- COCE FOUNDATION MIGRATION
-- Church OS Comms Engine — Phase 0 Data Layer
-- Migration: 20260406000000_coce_foundation.sql
-- 
-- Creates:
--   1. member_communication_profiles
--   2. communication_campaigns
--   3. communication_deliveries
--
-- Rules:
--   - Every table scoped by org_id (RLS enforced)
--   - No hardcoded org_id literals (resolved at runtime)
--   - Bilingual EN/JA first-class on campaigns
--   - children_safety campaign type bypasses opt-out
--   - communication_deliveries.events JSONB is blockchain-ready
-- ============================================================

BEGIN;

-- ============================================================
-- 1. MEMBER COMMUNICATION PROFILES
-- Source of truth for how/when to contact each member.
-- Populated via: self-onboarding screen, LINE webhook, CSV import.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_communication_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Contact channels
  email                    TEXT,
  phone_e164               TEXT,        -- E.164 format e.g. +81901234567
  line_user_id             TEXT,        -- Captured via LINE webhook
  whatsapp_number          TEXT,

  -- Language & channel preference
  preferred_language       TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ja')),
  preferred_channel        TEXT NOT NULL DEFAULT 'email'
                           CHECK (preferred_channel IN ('email', 'line', 'sms', 'whatsapp', 'in_app')),

  -- Member journey stage — gates preference centre options
  -- visitors only get: event_alerts + welcome_sequence
  -- members get: full preference centre
  member_status            TEXT NOT NULL DEFAULT 'visitor'
                           CHECK (member_status IN ('visitor', 'guest', 'member', 'partner', 'leader')),

  -- Per-topic, per-channel opt-ins
  -- children_safety is not present here — it ALWAYS sends, bypasses opt-out
  notification_preferences JSONB NOT NULL DEFAULT '{
    "weekly_digest":       {"email": true,  "line": true,  "sms": false, "whatsapp": false},
    "event_alerts":        {"email": true,  "line": true,  "sms": true,  "whatsapp": false},
    "devotion_reminders":  {"email": false, "line": true,  "sms": false, "whatsapp": false},
    "ministry_updates":    {"email": true,  "line": false, "sms": false, "whatsapp": false},
    "emergency":           {"email": true,  "line": true,  "sms": true,  "whatsapp": true},
    "giving_campaigns":    {"email": true,  "line": false, "sms": false, "whatsapp": false},
    "sermon_followups":    {"email": true,  "line": true,  "sms": false, "whatsapp": false},
    "welcome_sequence":    {"email": true,  "line": true,  "sms": false, "whatsapp": false}
  }'::jsonb,

  -- Engagement signals (maintained by coce-delivery-webhook)
  engagement_score         INTEGER NOT NULL DEFAULT 50 CHECK (engagement_score BETWEEN 0 AND 100),
  last_message_sent_at     TIMESTAMPTZ,
  last_opened_at           TIMESTAMPTZ,

  -- LINE account linkage verification
  line_verified            BOOLEAN NOT NULL DEFAULT FALSE,
  line_verify_code         TEXT,        -- One-time code for LINE ↔ member linkage
  line_verify_expires_at   TIMESTAMPTZ,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, member_id)
);

-- Index for LINE user ID lookups (webhook handler needs this fast)
CREATE INDEX IF NOT EXISTS idx_mcp_line_user_id
  ON public.member_communication_profiles(line_user_id)
  WHERE line_user_id IS NOT NULL;

-- Index for engagement score queries (AI segmentation)
CREATE INDEX IF NOT EXISTS idx_mcp_engagement_score
  ON public.member_communication_profiles(org_id, engagement_score);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_mcp_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mcp_updated_at ON public.member_communication_profiles;
CREATE TRIGGER trg_mcp_updated_at
  BEFORE UPDATE ON public.member_communication_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_mcp_updated_at();

-- RLS
ALTER TABLE public.member_communication_profiles ENABLE ROW LEVEL SECURITY;

-- Admins/pastors/owners can read all profiles in their org
DROP POLICY IF EXISTS "mcp_admin_read" ON public.member_communication_profiles;
CREATE POLICY "mcp_admin_read" ON public.member_communication_profiles
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'pastor', 'shepherd', 'ministry_lead', 'ministry_leader')
    )
  );

-- Members can read and update only their own profile
DROP POLICY IF EXISTS "mcp_member_self_read" ON public.member_communication_profiles;
CREATE POLICY "mcp_member_self_read" ON public.member_communication_profiles
  FOR SELECT USING (
    member_id = auth.uid()
  );

DROP POLICY IF EXISTS "mcp_member_self_update" ON public.member_communication_profiles;
CREATE POLICY "mcp_member_self_update" ON public.member_communication_profiles
  FOR UPDATE USING (
    member_id = auth.uid()
  );


-- ============================================================
-- 2. COMMUNICATION CAMPAIGNS
-- Every send — manual or automated — is a campaign row.
-- Drafted by AI (coce-compose) or manually by admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.communication_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Identity
  title             TEXT NOT NULL,
  campaign_type     TEXT NOT NULL CHECK (campaign_type IN (
    'newsletter',         -- Weekly digest
    'event',              -- Event announcement
    'sermon_followup',    -- Post-sermon message
    'ministry_update',    -- Ministry-specific
    'emergency',          -- Urgent org-wide alert
    'devotion_reminder',  -- Devotion/SOAP nudge
    'giving',             -- Stewardship campaign
    'welcome_sequence',   -- New member onboarding
    'children_safety',    -- BYPASSES opt-out — parents/guardians only
    're_engagement'       -- Inactive member outreach
  )),

  -- Bilingual content (first-class, not a translation layer)
  subject_en        TEXT,
  subject_ja        TEXT,
  body_en           TEXT,
  body_ja           TEXT,

  -- AI drafting metadata
  ai_drafted        BOOLEAN NOT NULL DEFAULT FALSE,
  ai_prompt_used    TEXT,              -- What the admin described
  ai_model_used     TEXT DEFAULT 'gemini-2.5-flash',
  ai_context_used   JSONB,            -- Snapshot of church_health data used for drafting

  -- Audience targeting
  audience_scope    TEXT NOT NULL CHECK (audience_scope IN (
    'org_wide',           -- Entire church
    'ministry',           -- Specific ministry
    'small_group',        -- Cell/fellowship circle
    'role',               -- By role: members, visitors, leaders
    'segment',            -- By engagement level
    'individual'          -- Single member
  )),
  audience_filter   JSONB,

  -- Channel selection
  channels          TEXT[] NOT NULL DEFAULT ARRAY['email'],

  -- Lifecycle status
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'scheduled',
    'sending',
    'sent',
    'failed',
    'cancelled'
  )),
  scheduled_at      TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,

  -- Automation trigger context
  trigger_type      TEXT CHECK (trigger_type IN (
    'manual',
    'member_joined',
    'event_registered',
    'missed_attendance',
    'streak_milestone',
    'pipeline_dropoff',   
    'weekly_cron',        
    'ai_sweep'            
  )),
  trigger_ref_id    UUID,   -- e.g. event_id, member_id, etc.

  -- Delivery stats (denormalised for fast dashboard reads)
  total_recipients  INTEGER NOT NULL DEFAULT 0,
  total_sent        INTEGER NOT NULL DEFAULT 0,
  total_delivered   INTEGER NOT NULL DEFAULT 0,
  total_opened      INTEGER NOT NULL DEFAULT 0,
  total_clicked     INTEGER NOT NULL DEFAULT 0,
  total_failed      INTEGER NOT NULL DEFAULT 0,

  created_by        UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cc_org_status
  ON public.communication_campaigns(org_id, status);

CREATE INDEX IF NOT EXISTS idx_cc_scheduled
  ON public.communication_campaigns(scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_cc_trigger_type
  ON public.communication_campaigns(org_id, trigger_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_cc_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cc_updated_at ON public.communication_campaigns;
CREATE TRIGGER trg_cc_updated_at
  BEFORE UPDATE ON public.communication_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_cc_updated_at();

-- RLS
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cc_admin_all" ON public.communication_campaigns;
CREATE POLICY "cc_admin_all" ON public.communication_campaigns
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'pastor', 'shepherd', 'ministry_lead', 'ministry_leader')
    )
  );


-- ============================================================
-- 3. COMMUNICATION DELIVERIES
-- One row per member per channel per campaign.
-- The receipt layer. Blockchain-ready via events JSONB.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.communication_deliveries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id          UUID NOT NULL REFERENCES public.communication_campaigns(id) ON DELETE CASCADE,
  member_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Which channel this delivery used
  channel              TEXT NOT NULL CHECK (channel IN (
    'email', 'line', 'sms', 'whatsapp', 'in_app'
  )),

  -- Delivery lifecycle
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'failed',
    'bounced',
    'unsubscribed'
  )),

  -- External provider message IDs for webhook correlation
  external_message_id  TEXT,

  -- Append-only audit trail
  events               JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Error tracking
  error_message        TEXT,
  retry_count          INTEGER NOT NULL DEFAULT 0,
  next_retry_at        TIMESTAMPTZ,

  -- Timestamps
  sent_at              TIMESTAMPTZ,
  delivered_at         TIMESTAMPTZ,
  opened_at            TIMESTAMPTZ,
  clicked_at           TIMESTAMPTZ,
  failed_at            TIMESTAMPTZ,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One delivery attempt per member per channel per campaign
  UNIQUE(campaign_id, member_id, channel)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cd_campaign
  ON public.communication_deliveries(campaign_id);

CREATE INDEX IF NOT EXISTS idx_cd_member_org
  ON public.communication_deliveries(org_id, member_id);

CREATE INDEX IF NOT EXISTS idx_cd_status
  ON public.communication_deliveries(status)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_cd_retry
  ON public.communication_deliveries(next_retry_at)
  WHERE status = 'failed' AND retry_count < 3;

CREATE INDEX IF NOT EXISTS idx_cd_external_message_id
  ON public.communication_deliveries(external_message_id)
  WHERE external_message_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_cd_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cd_updated_at ON public.communication_deliveries;
CREATE TRIGGER trg_cd_updated_at
  BEFORE UPDATE ON public.communication_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_cd_updated_at();

-- RLS
ALTER TABLE public.communication_deliveries ENABLE ROW LEVEL SECURITY;

-- Admins can read all deliveries for their org
DROP POLICY IF EXISTS "cd_admin_read" ON public.communication_deliveries;
CREATE POLICY "cd_admin_read" ON public.communication_deliveries
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'pastor', 'shepherd', 'ministry_lead', 'ministry_leader')
    )
  );

-- Members can read only their own delivery records
DROP POLICY IF EXISTS "cd_member_self_read" ON public.communication_deliveries;
CREATE POLICY "cd_member_self_read" ON public.communication_deliveries
  FOR SELECT USING (
    member_id = auth.uid()
  );


-- ============================================================
-- 4. ALSO FIX: newsletters table (missing from live DB)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      JSONB,   -- {message, impact_metrics: {salvations, growth, mission_progress}}
  author_id    UUID REFERENCES public.profiles(id),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletters_admin_all" ON public.newsletters;
CREATE POLICY "newsletters_admin_all" ON public.newsletters
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'pastor', 'shepherd')
    )
  );

-- ============================================================
-- 5. ALSO FIX: member_feed_items
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_feed_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feed_type    TEXT NOT NULL DEFAULT 'church_announcement',
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  cta_text     TEXT,
  cta_url      TEXT,
  expires_at   TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.member_feed_items ENABLE ROW LEVEL SECURITY;

-- Admins post to feed
DROP POLICY IF EXISTS "mfi_admin_all" ON public.member_feed_items;
CREATE POLICY "mfi_admin_all" ON public.member_feed_items
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'pastor', 'shepherd', 'ministry_lead', 'ministry_leader')
    )
  );

-- Members read their org's feed
DROP POLICY IF EXISTS "mfi_member_read" ON public.member_feed_items;
CREATE POLICY "mfi_member_read" ON public.member_feed_items
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

COMMIT;
