-- ============================================================
-- 20260331000000_organization_intelligence_settings.sql
-- CHURCH OS: ORGANIZATION INTELLIGENCE & THEOLOGICAL DNA
-- ============================================================

-- 1. Create the Intelligence Settings table
CREATE TABLE IF NOT EXISTS public.organization_intelligence (
    org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Theological DNA
    theological_tradition text NOT NULL DEFAULT 'Non-Denominational',
    -- Options: Pentecostal, Reformed, Evangelical, Baptist, Anglican, Non-Denominational, Other
    
    ministry_emphasis text NOT NULL DEFAULT 'Discipleship-focused',
    -- Options: Evangelism-led, Discipleship-focused, Social-Justice, Scripture-intensive, Worship-led, Other
    
    worship_style text NOT NULL DEFAULT 'Blended',
    -- Options: Modern/Contemporary, Traditional/Hymnal, Blended, Spontaneous/Spirit-led, Other
    
    congregation_size text NOT NULL DEFAULT '100-500',
    -- Options: <100, 100-500, 500-2000, 2000+
    
    primary_language text NOT NULL DEFAULT 'Bilingual',
    -- Options: English, Japanese, Bilingual, Other
    
    -- AI Workflow Tracking
    ai_provisioning_status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    welcome_insight_generated boolean DEFAULT false,
    ai_provisioned_at timestamptz,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add Trigger for updated_at
CREATE OR REPLACE FUNCTION update_org_intelligence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_org_intelligence_timestamp
    BEFORE UPDATE ON public.organization_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION update_org_intelligence_timestamp();

-- 3. Enable RLS
ALTER TABLE public.organization_intelligence ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Extended to Pastors and Shepherds)
DROP POLICY IF EXISTS "Leaders can manage their org intelligence" ON public.organization_intelligence;
CREATE POLICY "Leaders can manage their org intelligence" ON public.organization_intelligence
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members
            WHERE user_id = auth.uid()
            AND org_id = organization_intelligence.org_id
            AND role IN ('admin', 'owner', 'pastor', 'shepherd', 'ministry_lead')
        )
    );

-- 5. Seed Existing Organizations (JKC & Grace Fellowship)
-- JKC Default
INSERT INTO public.organization_intelligence (org_id, theological_tradition, ministry_emphasis, worship_style, congregation_size, primary_language, ai_provisioning_status)
VALUES ('fa547adf-f820-412f-9458-d6bade11517d', 'Non-Denominational', 'Discipleship-focused', 'Blended', '100-500', 'Bilingual', 'completed')
ON CONFLICT (org_id) DO NOTHING;

-- Grace Fellowship Default
INSERT INTO public.organization_intelligence (org_id, theological_tradition, ministry_emphasis, worship_style, congregation_size, primary_language, ai_provisioning_status)
SELECT id, 'Evangelical', 'Scripture-intensive', 'Modern/Contemporary', '<100', 'English', 'completed'
FROM public.organizations
WHERE name ILIKE '%Grace Fellowship%'
ON CONFLICT (org_id) DO NOTHING;
