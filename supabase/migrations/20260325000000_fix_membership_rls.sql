-- Migration: FIX RLS for membership_requests to allow upsert and select
BEGIN;

-- 1. Ensure users can update their own membership requests (needed for upsert)
DROP POLICY IF EXISTS "Users can update own membership requests" ON public.membership_requests;
CREATE POLICY "Users can update own membership requests" ON public.membership_requests
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Audit existing policies
DROP POLICY IF EXISTS "Users can view own membership requests" ON public.membership_requests;
CREATE POLICY "Users can view own membership requests" ON public.membership_requests
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own membership requests" ON public.membership_requests;
CREATE POLICY "Users can insert own membership requests" ON public.membership_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

COMMIT;
