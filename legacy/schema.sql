-- Devotions static content table
CREATE TABLE IF NOT EXISTS devotions (
  id BIGINT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  week_number INT NOT NULL,
  week_theme TEXT NOT NULL,
  title TEXT NOT NULL,
  scripture TEXT NOT NULL,
  declaration TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  preferred_translation TEXT DEFAULT 'NIV',
  notification_time TIME DEFAULT '09:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress/completion tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  devotion_id BIGINT REFERENCES devotions NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  interactive_declaration_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, devotion_id)
);

-- User per-devotion notes/reflections
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  devotion_id BIGINT REFERENCES devotions NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, devotion_id)
);

-- Fellowship groups
CREATE TABLE IF NOT EXISTS fellowship_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fellowship group members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES fellowship_groups NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Real-time group messages
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES fellowship_groups NOT NULL,
  sender_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES --

-- Devotions are public for read
ALTER TABLE devotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devotions are publicly readable" ON devotions FOR SELECT USING (true);

-- Profiles are readable by self and group members
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- User progress is private
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON user_progress USING (auth.uid() = user_id);

-- Notes are private by default
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON notes USING (auth.uid() = user_id);

-- Fellowship groups are readable by members
ALTER TABLE fellowship_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read group" ON fellowship_groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = fellowship_groups.id AND group_members.user_id = auth.uid())
);

-- Group members can read each other
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read each other" ON group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members AS gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);

-- Group messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read/write messages" ON group_messages USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_messages.group_id AND group_members.user_id = auth.uid())
);
