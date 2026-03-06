-- CLEANUP AND REPAIR RLS ON ORG_MEMBERS
-- This migration removes all existing policies on org_members and replaces them with 
-- non-recursive ones using security definer functions.

-- 1. Ensure security functions exist (already created but good to have here)
CREATE OR REPLACE FUNCTION public.check_is_staff(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = p_user_id 
    AND role IN ('shepherd', 'admin', 'owner', 'super_admin', 'ministry_lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = p_user_id 
    AND role IN ('admin', 'owner', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DROP ALL EXISTING POLICIES on org_members to avoid conflicts
DROP POLICY IF EXISTS "Admins manage org members" ON public.org_members;
DROP POLICY IF EXISTS "Admins manage org_members" ON public.org_members;
DROP POLICY IF EXISTS "Users see own org role" ON public.org_members;
DROP POLICY IF EXISTS "Users_read_self" ON public.org_members;
DROP POLICY IF EXISTS "allow_staff_select" ON public.org_members;
DROP POLICY IF EXISTS "allow_admin_all" ON public.org_members;

-- 3. APPLY CLEAN POLICIES
-- Policy: Enable users to read their own membership
CREATE POLICY "Users read own membership" ON public.org_members
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Enable staff to see all memberships (crucial for dashboard)
CREATE POLICY "Staff read all memberships" ON public.org_members
FOR SELECT USING (check_is_staff(auth.uid()));

-- Policy: Enable admins to manage all memberships
CREATE POLICY "Admins manage all memberships" ON public.org_members
FOR ALL USING (check_is_admin(auth.uid()));

-- 4. Reload PostgREST to ensure changes take effect immediately
NOTIFY pgrst, 'reload schema';
