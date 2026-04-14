-- ==========================================
-- Church OS: Domain Context Seed Script
-- ==========================================
-- Run this in Supabase Dashboard → SQL Editor
-- AFTER creating the 4 test users manually in Authentication → Users
--
-- Test users to create first:
--   test-corporate@church.os  / TestCorp123!
--   test-tenant@church.os     / TestTenant123!
--   test-member@church.os     / TestMember123!
--   test-onboarding@church.os / TestOnboard123!
-- ==========================================

DO $$
DECLARE
  v_jkc_org_id  UUID := 'fa547adf-f820-412f-9458-d6bade11517d';
  v_test_org_id UUID := '00000000-0000-0000-0000-000000000001';
  v_corp_id     UUID;
  v_tenant_id   UUID;
  v_member_id   UUID;
  v_onboard_id  UUID;
BEGIN

  -- Resolve actual user IDs from auth.users by email
  SELECT id INTO v_corp_id    FROM auth.users WHERE email = 'test-corporate@church.os';
  SELECT id INTO v_tenant_id  FROM auth.users WHERE email = 'test-tenant@church.os';
  SELECT id INTO v_member_id  FROM auth.users WHERE email = 'test-member@church.os';
  SELECT id INTO v_onboard_id FROM auth.users WHERE email = 'test-onboarding@church.os';

  -- ── 1. Create test org for tenant user ──────────────────────────
  INSERT INTO public.organizations (id, name, domain)
  VALUES (v_test_org_id, 'Test Church', 'testchurch.local')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Sync identities (trigger should do this, but be explicit) ─
  IF v_corp_id IS NOT NULL THEN
    INSERT INTO public.identities (id, email) VALUES (v_corp_id, 'test-corporate@church.os')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.identities (id, email) VALUES (v_tenant_id, 'test-tenant@church.os')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;
  IF v_member_id IS NOT NULL THEN
    INSERT INTO public.identities (id, email) VALUES (v_member_id, 'test-member@church.os')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;
  IF v_onboard_id IS NOT NULL THEN
    INSERT INTO public.identities (id, email) VALUES (v_onboard_id, 'test-onboarding@church.os')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;

  -- ── 3. Corporate domain → admin_roles ───────────────────────────
  IF v_corp_id IS NOT NULL THEN
    INSERT INTO public.admin_roles (identity_id, role)
    VALUES (v_corp_id, 'super_admin')
    ON CONFLICT (identity_id, role) DO NOTHING;
    RAISE NOTICE 'CORPORATE seeded: %', v_corp_id;
  ELSE
    RAISE WARNING 'CORPORATE user not found. Create test-corporate@church.os in Auth first.';
  END IF;

  -- ── 4. Tenant domain → org_members ──────────────────────────────
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.org_members (user_id, org_id, role)
    VALUES (v_tenant_id, v_test_org_id, 'owner')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'owner';
    RAISE NOTICE 'TENANT seeded: %', v_tenant_id;
  ELSE
    RAISE WARNING 'TENANT user not found. Create test-tenant@church.os in Auth first.';
  END IF;

  -- ── 5. Member domain → org_members (view reads org_members for member domain) ──
  IF v_member_id IS NOT NULL THEN
    INSERT INTO public.org_members (user_id, org_id, role)
    VALUES (v_member_id, v_jkc_org_id, 'member')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'member';
    RAISE NOTICE 'MEMBER seeded: %', v_member_id;
  ELSE
    RAISE WARNING 'MEMBER user not found. Create test-member@church.os in Auth first.';
  END IF;

  -- ── 6. Onboarding domain → onboarding_sessions ──────────────────
  IF v_onboard_id IS NOT NULL THEN
    INSERT INTO public.onboarding_sessions (identity_id, email, status, current_step)
    VALUES (v_onboard_id, 'test-onboarding@church.os', 'email_verified', 'org_creation')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'ONBOARDING seeded: %', v_onboard_id;
  ELSE
    RAISE WARNING 'ONBOARDING user not found. Create test-onboarding@church.os in Auth first.';
  END IF;

END $$;

-- ── Verification ────────────────────────────────────────────────────
SELECT 'identities'        AS table_name, COUNT(*) AS rows FROM public.identities;
SELECT 'admin_roles'       AS table_name, COUNT(*) AS rows FROM public.admin_roles;
SELECT 'org_members'       AS table_name, COUNT(*) AS rows FROM public.org_members;
SELECT 'member_profiles'   AS table_name, COUNT(*) AS rows FROM public.member_profiles;
SELECT 'onboarding_sessions' AS table_name, COUNT(*) AS rows FROM public.onboarding_sessions;
