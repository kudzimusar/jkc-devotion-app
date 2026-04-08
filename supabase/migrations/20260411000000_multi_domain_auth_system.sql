-- ==========================================
-- CHURCH OS: MULTI-DOMAIN AUTHENTICATION SYSTEM
-- ==========================================

BEGIN;

-- 1. CORE IDENTITY TABLE
-- This maps public access to auth.users
CREATE TABLE IF NOT EXISTS public.identities (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Optional, Supabase handles this usually but kept for schema alignment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to keep identities in sync with auth.users
CREATE OR REPLACE FUNCTION public.fn_sync_identities()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.identities (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_identities ON auth.users;
CREATE TRIGGER tr_sync_identities
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_identities();

-- 2. DOMAIN-SPECIFIC TABLES

-- 🔴 Corporate
-- Existing table admin_roles might need migration
-- The prompt specifies identity_id, so I'll rename user_id if needed or add it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_roles') THEN
        -- Check if user_id exists and identity_id doesn't
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_roles' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_roles' AND column_name = 'identity_id') THEN
            ALTER TABLE public.admin_roles RENAME COLUMN user_id TO identity_id;
        END IF;
    ELSE
        CREATE TABLE public.admin_roles (
          identity_id UUID REFERENCES public.identities(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          PRIMARY KEY (identity_id, role)
        );
    END IF;
END $$;

-- 🟠 Onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES public.identities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL, -- invited, email_verified, org_created, admin_assigned
  current_step TEXT,
  org_draft_id UUID,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🟡 Tenant (Church Ops)
-- Existing org_members
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_members') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'org_members' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'org_members' AND column_name = 'identity_id') THEN
            ALTER TABLE public.org_members RENAME COLUMN user_id TO identity_id;
        END IF;
    ELSE
        CREATE TABLE public.org_members (
          identity_id UUID REFERENCES public.identities(id) ON DELETE CASCADE,
          org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          PRIMARY KEY (identity_id, org_id)
        );
    END IF;
END $$;

-- 🟡 Ministry (Sub-layer)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ministry_members') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ministry_members' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ministry_members' AND column_name = 'identity_id') THEN
            ALTER TABLE public.ministry_members RENAME COLUMN user_id TO identity_id;
        END IF;
        -- Add org_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ministry_members' AND column_name = 'org_id') THEN
            ALTER TABLE public.ministry_members ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        END IF;
    ELSE
        CREATE TABLE public.ministry_members (
          identity_id UUID REFERENCES public.identities(id) ON DELETE CASCADE,
          org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
          ministry_role TEXT NOT NULL,
          PRIMARY KEY (identity_id, org_id, ministry_role)
        );
    END IF;
END $$;

-- 🟢 Member
CREATE TABLE IF NOT EXISTS public.member_profiles (
  identity_id UUID REFERENCES public.identities(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID DEFAULT gen_random_uuid(),
  PRIMARY KEY (identity_id, org_id)
);

-- ⚪ Public
CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT,
  conversion_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UNIFIED AUTH CONTEXT VIEW
CREATE OR REPLACE VIEW v_user_auth_contexts AS
-- Corporate
SELECT 
  i.id as identity_id,
  'corporate'::TEXT as auth_domain,
  'console'::TEXT as auth_surface,
  ar.role,
  NULL::UUID as org_id
FROM public.identities i
JOIN public.admin_roles ar ON ar.identity_id = i.id

UNION ALL

-- Tenant (Mission Control)
SELECT 
  identity_id,
  'tenant'::TEXT,
  'mission-control'::TEXT,
  role,
  org_id
FROM public.org_members

UNION ALL

-- Ministry
SELECT 
  identity_id,
  'tenant'::TEXT,
  'ministry'::TEXT,
  ministry_role,
  org_id
FROM public.ministry_members

UNION ALL

-- Member
SELECT 
  identity_id,
  'member'::TEXT,
  'profile'::TEXT,
  'member'::TEXT,
  org_id
FROM public.member_profiles

UNION ALL

-- Onboarding
SELECT 
  identity_id,
  'onboarding'::TEXT,
  'onboarding'::TEXT,
  status as role,
  NULL::UUID as org_id
FROM public.onboarding_sessions;

-- 4. AUDIT LOGGING
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES public.identities(id),
  auth_domain TEXT NOT NULL,
  auth_surface TEXT NOT NULL,
  intent TEXT,
  gateway TEXT,
  org_id UUID,
  mfa_verified BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  ip_address INET,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log auth events
CREATE OR REPLACE FUNCTION public.fn_log_auth_event(
    p_identity_id UUID,
    p_auth_domain TEXT,
    p_auth_surface TEXT,
    p_intent TEXT,
    p_gateway TEXT,
    p_org_id UUID DEFAULT NULL,
    p_mfa_verified BOOLEAN DEFAULT FALSE,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auth_audit_logs (
        identity_id, auth_domain, auth_surface, intent, gateway, org_id, mfa_verified, user_agent, ip_address
    ) VALUES (
        p_identity_id, p_auth_domain, p_auth_surface, p_intent, p_gateway, p_org_id, p_mfa_verified, p_user_agent, 
        inet_client_addr()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS POLICIES
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Identity read by self
CREATE POLICY "Users can read own identity" ON public.identities FOR SELECT USING (id = auth.uid());

-- RLS for domains
-- Corporate: only if identity has any corporate role
CREATE POLICY "Corporate admin access" ON public.admin_roles 
FOR ALL USING (identity_id = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_roles WHERE identity_id = auth.uid() AND role = 'platform_governor'));

-- Tenant: only if identity belongs to org
CREATE POLICY "Tenant access" ON public.org_members
FOR ALL USING (identity_id = auth.uid() OR EXISTS (SELECT 1 FROM public.org_members WHERE identity_id = auth.uid() AND org_id = public.org_members.org_id AND role IN ('owner', 'admin')));

-- Audit logs: read by corporate admins
CREATE POLICY "Corporate admins can read audit logs" ON public.auth_audit_logs
FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE identity_id = auth.uid() AND role IN ('platform_governor', 'platform_support')));

COMMIT;
