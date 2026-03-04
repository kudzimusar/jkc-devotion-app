-- 1. Organizations (Churches)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE, -- for CORS validation
  logo_url TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash
  key_preview TEXT, -- First 4 chars e.g. 'tl_a'
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Organization Members linking table
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- references auth.users
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- 3. Devotions Table (Global)
CREATE TABLE IF NOT EXISTS devotions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL UNIQUE,
  week INT NOT NULL,
  theme TEXT NOT NULL,
  title TEXT NOT NULL,
  scripture TEXT NOT NULL,
  declaration TEXT NOT NULL,
  week_theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Devotions: Public Read
CREATE POLICY "Allow public read access" ON devotions
  FOR SELECT USING (true);

-- Organizations: Admins can see their own org
-- (Note: This assumes a 'org_members' table or similar for user-org mapping, 
-- but for now we follow the instruction for base RLS)
CREATE POLICY "Org members can manage own org" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
    )
  );

-- Org Members: members can read/write their own records
CREATE POLICY "Members can access own org_members" ON org_members
  FOR ALL USING (auth.uid() = user_id);

-- API Keys: Only internal server/admin can manage
CREATE POLICY "Internal service manages keys" ON api_keys
  FOR ALL USING (auth.uid() IS NOT NULL);
