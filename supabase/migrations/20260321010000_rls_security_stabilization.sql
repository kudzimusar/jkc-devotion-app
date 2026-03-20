-- Mission Control Stabilization: Fix RLS Recursion and Permissions
-- Migration: 20260321010000_rls_security_stabilization.sql

-- 1. Create/Update core RLS functions as SECURITY DEFINER to avoid recursion loops
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('shepherd', 'admin', 'owner', 'super_admin', 'pastor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Stabilize org_members RLS Policies (Crucial for Admin Dashboard)
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all memberships" ON public.org_members;
DROP POLICY IF EXISTS "Admins view org members" ON public.org_members;
DROP POLICY IF EXISTS "Users view own membership" ON public.org_members;
DROP POLICY IF EXISTS "Staff read all memberships" ON public.org_members;

-- Users can always see their own record
CREATE POLICY "Users view own membership" ON public.org_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can see all members in their org
CREATE POLICY "Admins view org members" ON public.org_members
FOR SELECT TO authenticated
USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd', 'pastor'))
);

-- Owners/Admins can update memberships in their org
CREATE POLICY "Admins manage org members" ON public.org_members
FOR ALL TO authenticated
USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
)
WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- 3. Fix membership_requests RLS
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view org requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Users manage own requests" ON public.membership_requests;

CREATE POLICY "Users manage own requests" ON public.membership_requests
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins manage org requests" ON public.membership_requests
FOR ALL TO authenticated
USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd', 'pastor'))
);

-- 4. Fix profiles RLS for Admin Update
DROP POLICY IF EXISTS "Admins update profiles in org" ON public.profiles;
CREATE POLICY "Admins update profiles in org" ON public.profiles
FOR UPDATE TO authenticated
USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd', 'pastor'))
)
WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd', 'pastor'))
);

-- 5. Final check on member_milestones
DROP POLICY IF EXISTS "Admins view org milestones" ON public.member_milestones;
CREATE POLICY "Admins view org milestones" ON public.member_milestones
FOR ALL TO authenticated
USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd', 'pastor'))
);
