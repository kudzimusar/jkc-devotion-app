-- Migration: 20260325000000_profile_role_stabilization
-- Description: Creates missing roles and user_roles tables to satisfy RLS and governance triggers.
-- Also ensures all profiles are linked to a valid organization.

BEGIN;

-- 1. Create public.roles table
CREATE TABLE IF NOT EXISTS public.roles (
    name TEXT PRIMARY KEY,
    level INT NOT NULL DEFAULT 10,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial roles
INSERT INTO public.roles (name, level, description)
VALUES 
    ('visitor', 5, 'Guest or non-member'),
    ('member', 10, 'Regular church member'),
    ('volunteer', 20, 'Ministry volunteer'),
    ('assistant', 40, 'Ministry assistant'),
    ('leader', 80, 'Ministry or fellowship leader'),
    ('staff', 85, 'Church staff member'),
    ('admin', 90, 'System administrator'),
    ('super_admin', 100, 'Global super administrator')
ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level, description = EXCLUDED.description;

-- 2. Create public.user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    granted_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

-- Enable RLS on roles (read-only for all, write for admins)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.roles;
CREATE POLICY "Roles are viewable by everyone" ON public.roles FOR SELECT USING (true);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- 3. Org Context Integrity Fix
-- Ensure every profile has an org_id (fallback to first org)
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations LIMIT 1;
    
    IF default_org_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET org_id = default_org_id 
        WHERE org_id IS NULL;
        
        RAISE NOTICE 'Aligned orphaned profiles with organization: %', default_org_id;
    END IF;
END $$;

-- 4. Finalize Identity View
-- Ensure the view is refreshed and accurate
DROP VIEW IF EXISTS public.vw_user_identity;
CREATE OR REPLACE VIEW public.vw_user_identity AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone as phone_number, -- Map to 'phone' from profiles
  p.membership_status,
  p.growth_stage,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.org_id,
  COALESCE(
    (SELECT array_agg(role_name) FROM public.user_roles WHERE user_id = p.id AND status = 'active'),
    ARRAY[]::TEXT[]
  ) as roles,
  om.discipleship_score,
  om.stage as legacy_stage,
  om.role as legacy_role,
  EXISTS (SELECT 1 FROM public.membership_requests mr WHERE mr.user_id = p.id AND mr.status = 'pending') as has_pending_request
FROM public.profiles p
LEFT JOIN public.org_members om ON p.id = om.user_id;

COMMIT;
