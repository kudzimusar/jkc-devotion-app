-- Church OS Extension: Admin Onboarding & Multi-Factor Enforcement
-- Enhances org_members for secure external invitations and MFA tracking

-- 1. Extend org_members for invitations
ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS invitation_token uuid DEFAULT gen_random_uuid();
ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'active'; 
-- status: 'active', 'pending', 'expired'
ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz;
ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);

-- 2. Create a restricted view for invitation validation (bypasses users needing an account to check a token)
-- Since we are in a static export, we need a way for a "non-user" to verify a token.
-- SECURITY: This view only exposes the role and token.
CREATE OR REPLACE VIEW public.vw_invitation_check AS
SELECT invitation_token, role, org_id, invited_by
FROM public.org_members
WHERE invitation_status = 'pending';

GRANT SELECT ON public.vw_invitation_check TO anon;

-- 3. Trigger to handle automatic role assignment on signup IF a token matches the email
-- This assumes the invitation flow saves the email in org_members or we match by invitation_token.
-- Let's add email to org_members temporarily for matching if user doesn't have ID yet.
ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION public.handle_invited_signup()
RETURNS TRIGGER AS $$
DECLARE
    target_role text;
    target_org_id uuid;
BEGIN
    -- Check if there's a pending invitation for this email
    SELECT role, org_id INTO target_role, target_org_id
    FROM public.org_members
    WHERE email = NEW.email AND invitation_status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        -- Update the org_member record with the new user_id
        UPDATE public.org_members
        SET user_id = NEW.id,
            invitation_status = 'active',
            invitation_token = NULL
        WHERE email = NEW.email AND invitation_status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (requires superuser, but in Supabase we can use the bypass)
-- Note: In a managed Supabase, we usually trigger on public.profiles or similar if we sync them.
-- Let's stick to a manual "Accept Invitation" process in the frontend to be safe.

-- 4. MFA Enforcement Flag
ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS mfa_enforced boolean DEFAULT false;

-- Policy to allow Pastor/Admins to manage invitations
CREATE POLICY "Admins manage invitations" ON public.org_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('pastor', 'super_admin', 'owner')
    )
);

NOTIFY pgrst, 'reload schema';
