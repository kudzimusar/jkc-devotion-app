-- Shepherd Dashboard Updates

-- 1. Enhance Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_progress_with_leaders BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'EN';

-- 2. Role Constraints for Org Members
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_members_role_check') THEN
        ALTER TABLE org_members ADD CONSTRAINT org_members_role_check 
        CHECK (role IN ('member', 'ministry_lead', 'shepherd', 'admin', 'owner'));
    END IF;
END $$;

-- 3. Prayer Requests Table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,
  status TEXT DEFAULT 'Received', -- 'Received', 'Assigned', 'Answered'
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT prayer_requests_status_check CHECK (status IN ('Received', 'Assigned', 'Answered'))
);

-- 4. User Progress Table (Granular tracking)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  devotion_id BIGINT REFERENCES devotions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'read', -- 'read', 'journaled'
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, devotion_id)
);

-- 5. Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Members can manage their own prayer requests
CREATE POLICY "Users can manage own prayer requests" ON prayer_requests
  FOR ALL USING (auth.uid() = user_id);

-- Shepherds and Admins can see all prayer requests in their org
CREATE POLICY "Shepherds can see org prayer requests" ON prayer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = prayer_requests.org_id 
      AND org_members.user_id = auth.uid() 
      AND org_members.role IN ('shepherd', 'admin', 'owner')
    )
  );

-- Members can manage their own progress
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Leads/Shepherds can see progress if member has opted in
CREATE POLICY "Leaders can see opted-in progress" ON user_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      JOIN profiles ON profiles.id = user_progress.user_id
      WHERE org_members.org_id = user_progress.org_id 
      AND org_members.user_id = auth.uid() 
      AND org_members.role IN ('ministry_lead', 'shepherd', 'admin', 'owner')
      AND profiles.share_progress_with_leaders = TRUE
    )
  );

-- Shepherds can see anonymized stats (handled via views or direct query with RLS)
-- This RLS policy allows selecting but we should ensure the UI anonymizes it if needed.
-- Actually for "Spiritual Health" metrics, we usually want aggregates.

-- 7. Add columns for tracking shares/bookmarks in devotions or separate table
CREATE TABLE IF NOT EXISTS devotion_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  devotion_id BIGINT REFERENCES devotions(id) ON DELETE CASCADE,
  interaction_type TEXT, -- 'bookmark', 'share', 'reflection'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE devotion_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interactions" ON devotion_interactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Leaders can see interaction stats" ON devotion_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.user_id = auth.uid() 
      AND org_members.role IN ('shepherd', 'admin', 'owner')
    )
  );
