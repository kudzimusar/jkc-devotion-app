-- Member Profile Enhancement (Digital Connection Card)

-- 1. Identity Expansion
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wedding_anniversary DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS physical_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_communication TEXT DEFAULT 'in-app'; -- 'email', 'phone', 'in-app'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

-- 2. Household / Family Management
CREATE TABLE IF NOT EXISTS family_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    family_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES family_units(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_type TEXT, -- 'Head', 'Spouse', 'Child', 'Dependent'
    UNIQUE(family_id, profile_id)
);

-- 3. Attendance & Participation
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_date DATE DEFAULT CURRENT_DATE,
    event_type TEXT NOT NULL, -- 'Sunday Service', 'Small Group', 'Prayer Meeting'
    attendance_status TEXT DEFAULT 'Present', -- 'Present', 'Online', 'Excused'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Spiritual Milestones
CREATE TABLE IF NOT EXISTS spiritual_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- 'Faith Decision', 'Baptism', 'Leadership Promotion'
    milestone_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ministry Assignments (Volunteer Roles)
CREATE TABLE IF NOT EXISTS ministry_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ministry_name TEXT NOT NULL, -- 'Worship Team', 'Hospitality', 'Media'
    role_status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'On Leave'
    started_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Stewardship / Giving History
CREATE TABLE IF NOT EXISTS giving_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'JPY',
    fund_type TEXT DEFAULT 'Tithe', -- 'Tithe', 'Offering', 'Building Fund'
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pastoral Follow-up (Private Notes)
CREATE TABLE IF NOT EXISTS pastoral_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shepherd_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS on all new tables
ALTER TABLE family_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastoral_notes ENABLE ROW LEVEL SECURITY;

-- 9. RLS POLICIES

-- Members can see their own data
CREATE POLICY "Users can view own family" ON family_members FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own attendance" ON attendance_logs FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own milestones" ON spiritual_milestones FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own ministry" ON ministry_roles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own giving" ON giving_history FOR SELECT USING (auth.uid() = profile_id);

-- Shepherds can see everything except some giving privacy if needed
-- For now, allow shepherds full oversight as requested
CREATE POLICY "Shepherds can oversee family" ON family_members FOR ALL USING (EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner')));
CREATE POLICY "Shepherds can oversee attendance" ON attendance_logs FOR ALL USING (EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner')));
CREATE POLICY "Shepherds can oversee milestones" ON spiritual_milestones FOR ALL USING (EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner')));
CREATE POLICY "Shepherds can oversee ministry" ON ministry_roles FOR ALL USING (EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner')));
CREATE POLICY "Shepherds can oversee giving" ON giving_history FOR ALL USING (EXISTS (SELECT 1 FROM org_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

-- PASTORAL NOTES: EXTREMELY STRICT RLS
-- Member CANNOT see their own pastoral notes
CREATE POLICY "Only Shepherds can see pastoral notes" ON pastoral_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('shepherd', 'admin', 'owner')
        )
    );
