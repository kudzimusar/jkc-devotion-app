-- ==============================================================================
-- Migration: 20260421000001_refined_auth_contexts.sql
-- Description: Refines v_user_auth_contexts to include specific ministry silos
--              and enables seamless downward access for admins.
-- ==============================================================================

-- Drop existing view to recreate it
DROP VIEW IF EXISTS public.v_user_auth_contexts;

CREATE OR REPLACE VIEW public.v_user_auth_contexts AS
-- 1. Super Admin (Corporate)
SELECT 
    user_id as identity_id,
    'corporate'::TEXT as auth_domain,
    'console'::TEXT as auth_surface,
    role::TEXT as role,
    org_id
FROM public.org_members
WHERE role IN ('super_admin', 'super-admin')

UNION ALL

-- 2. Pastor'S HQ (Tenant Owner/Pastor)
SELECT 
    user_id as identity_id,
    'tenant'::TEXT as auth_domain,
    'pastor-hq'::TEXT as auth_surface,
    role::TEXT as role,
    org_id
FROM public.org_members
WHERE role IN ('owner', 'pastor', 'super_admin', 'super-admin')

UNION ALL

-- 3. Mission Control (Shepherds/Admins)
SELECT 
    user_id as identity_id,
    'tenant'::TEXT as auth_domain,
    'mission-control'::TEXT as auth_surface,
    role::TEXT as role,
    org_id
FROM public.org_members
WHERE role IN ('admin', 'shepherd', 'owner', 'pastor', 'super_admin', 'super-admin')

UNION ALL

-- 4. Kingdom Class (Specialized Silo)
-- This remains as is for now as it's a first-class citizen
SELECT 
    om.user_id as identity_id,
    'tenant'::TEXT as auth_domain,
    'kingdom-class'::TEXT as auth_surface,
    om.role::TEXT as role,
    om.org_id
FROM public.org_members om
WHERE (om.role IN ('owner', 'pastor', 'super_admin', 'super-admin'))
   OR (EXISTS (SELECT 1 FROM ministries m WHERE m.leader_id = om.user_id AND m.slug = 'language-school'))

UNION ALL

-- 5. Specific Ministry Silos (Dynamically Resolved)
-- This allows the context selector to show "Ushering Ministry", "Youth Ministry", etc.
SELECT 
    mm.user_id as identity_id,
    'tenant'::TEXT as auth_domain,
    'ministry'::TEXT as auth_surface,
    (mm.ministry_role || ':' || m.slug)::TEXT as role,
    mm.org_id
FROM public.ministry_members mm
JOIN public.ministries m ON mm.ministry_id = m.id
WHERE mm.is_active = true 
  AND mm.ministry_role = 'ministry_lead'

UNION ALL

-- 6. Member Profile
SELECT 
    user_id as identity_id,
    'member'::TEXT as auth_domain,
    'profile'::TEXT as auth_surface,
    'member'::TEXT as role,
    org_id
FROM public.org_members
WHERE role = 'member'

UNION ALL

-- 7. Onboarding
SELECT 
    identity_id,
    'onboarding'::TEXT as auth_domain,
    'onboarding'::TEXT as auth_surface,
    status::TEXT as role,
    NULL::uuid as org_id
FROM public.onboarding_sessions;
