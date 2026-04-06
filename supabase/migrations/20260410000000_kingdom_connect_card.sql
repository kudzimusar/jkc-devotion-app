-- Phase 0: Kingdom Connect Card Infrastructure

-- 1. Create volunteer_applications table
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.public_inquiries(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ministry_interests TEXT[] DEFAULT '{}',
    experience_summary TEXT,
    availability TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Global Connection Metrics View (Corrected: No country column)
CREATE OR REPLACE VIEW public.vw_global_connection_metrics AS
SELECT 
    o.id as org_id,
    o.name as organization_name,
    COUNT(pi.id) as total_inquiries,
    COUNT(pi.id) FILTER (WHERE pi.status = 'new') as pending_followups,
    COUNT(DISTINCT pi.email) as unique_prospects,
    MAX(pi.created_at) as last_activity_at
FROM 
    public.organizations o
LEFT JOIN 
    public.public_inquiries pi ON o.id = pi.org_id
GROUP BY 
    o.id, o.name;

-- Enable RLS for volunteer_applications
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (since it's a connect card)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'volunteer_applications' 
        AND policyname = 'Public can submit volunteer applications'
    ) THEN
        CREATE POLICY "Public can submit volunteer applications" 
        ON public.volunteer_applications FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'volunteer_applications' 
        AND policyname = 'Admins can view volunteer applications'
    ) THEN
        CREATE POLICY "Admins can view volunteer applications" 
        ON public.volunteer_applications FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = auth.uid() 
                AND ur.org_id = volunteer_applications.org_id 
                AND ur.role_name IN ('admin', 'super_admin', 'pastor')
            )
        );
    END IF;
END $$;
