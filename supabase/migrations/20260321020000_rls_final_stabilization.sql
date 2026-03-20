-- Mission Control Stabilization: Final RLS Fix (Non-Recursive)
-- Migration: 20260321020000_rls_final_stabilization.sql

-- 1. Ensure functions are robust and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'shepherd', 'pastor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY SELECT org_id FROM public.org_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. org_members RLS (Careful! This is the most sensitive)
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own membership" ON public.org_members;
DROP POLICY IF EXISTS "Admins view org members" ON public.org_members;
DROP POLICY IF EXISTS "Admins manage org members" ON public.org_members;

-- Minimal, non-recursive policies
CREATE POLICY "Users view own membership" ON public.org_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Use the SECURITY DEFINER function to bypass recursion
CREATE POLICY "Admins view org members" ON public.org_members
FOR SELECT TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins manage org members" ON public.org_members
FOR ALL TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

-- 3. Profiles RLS
DROP POLICY IF EXISTS "Admins view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles in org" ON public.profiles;

CREATE POLICY "Admins view org profiles" ON public.profiles
FOR SELECT TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins update profiles in org" ON public.profiles
FOR UPDATE TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

-- 4. Projects/Requests RLS
DROP POLICY IF EXISTS "Admins manage org requests" ON public.membership_requests;
CREATE POLICY "Admins manage org requests" ON public.membership_requests
FOR ALL TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

-- 5. Member Milestones RLS
DROP POLICY IF EXISTS "Admins view org milestones" ON public.member_milestones;
CREATE POLICY "Admins view org milestones" ON public.member_milestones
FOR ALL TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

-- 6. Financial Records and Events (Fixes the dashboard 401s)
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view financial_records" ON public.financial_records;
CREATE POLICY "Admins view financial_records" ON public.financial_records
FOR SELECT TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view events" ON public.events;
CREATE POLICY "Admins view events" ON public.events
FOR SELECT TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

-- 7. SOAP and Stats
ALTER TABLE public.soap_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view soap_entries" ON public.soap_entries;
CREATE POLICY "Admins view soap_entries" ON public.soap_entries
FOR SELECT TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));

ALTER TABLE public.member_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view member_stats" ON public.member_stats;
CREATE POLICY "Admins view member_stats" ON public.member_stats
FOR SELECT TO authenticated
USING (check_user_is_admin() AND org_id IN (SELECT get_user_org_ids()));
