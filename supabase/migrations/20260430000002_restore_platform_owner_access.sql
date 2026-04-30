-- ==============================================================================
-- Migration: 20260430000002_restore_platform_owner_access.sql
-- Restores super_admin access for the platform owner (kudzimusar@gmail.com).
-- Ensures both org_members (for v_user_auth_contexts) and admin_roles
-- (for super-admin dashboard RLS) are seeded correctly.
-- ==============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id  UUID := 'fa547adf-f820-412f-9458-d6bade11517d'; -- JKC / platform org
BEGIN
  -- Resolve the auth user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'kudzimusar@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'User kudzimusar@gmail.com not found in auth.users — skipping seed.';
    RETURN;
  END IF;

  -- Ensure super_admin row in org_members (feeds v_user_auth_contexts corporate branch)
  INSERT INTO public.org_members (user_id, org_id, role, stage)
  VALUES (v_user_id, v_org_id, 'super_admin', 'leader')
  ON CONFLICT (user_id, org_id) DO UPDATE
    SET role = 'super_admin',
        stage = 'leader';

  -- Ensure super_admin row in admin_roles (feeds RLS on admin_* tables)
  INSERT INTO public.admin_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Platform owner access restored for user %', v_user_id;
END;
$$;
