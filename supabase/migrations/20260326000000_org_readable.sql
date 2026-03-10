-- Migration: Ensure organizations table is readable by everyone
BEGIN;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations
FOR SELECT USING (true);

COMMIT;
