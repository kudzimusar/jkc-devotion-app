-- FIX RLS ON PROFILES TABLE
-- Use security definer functions to prevent recursion and improve performance

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
    check_is_staff(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR ALL USING (
    check_is_admin(auth.uid())
);

-- Ensure all new tables from unified spine also use these functions
DROP POLICY IF EXISTS "Admins read all activity" ON public.activity_log;
CREATE POLICY "Admins read activity" ON public.activity_log FOR SELECT USING (check_is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins manage reports" ON public.ministry_reports;
CREATE POLICY "Admins manage reports" ON public.ministry_reports FOR ALL USING (check_is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins read milestones" ON public.member_milestones;
CREATE POLICY "Admins read milestones" ON public.member_milestones FOR SELECT USING (check_is_staff(auth.uid()));

-- Reload schema
NOTIFY pgrst, 'reload schema';
