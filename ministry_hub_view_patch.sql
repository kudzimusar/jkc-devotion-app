CREATE OR REPLACE VIEW public.v_user_auth_contexts AS

-- 1. Super Admin / Corporate Console
SELECT
    user_id       AS identity_id,
    'corporate'   AS auth_domain,
    'console'     AS auth_surface,
    role          AS role,
    org_id
FROM public.org_members
WHERE role IN ('super_admin', 'super-admin')

UNION ALL

-- 2. Pastor's HQ
SELECT
    user_id       AS identity_id,
    'tenant'      AS auth_domain,
    'pastor-hq'   AS auth_surface,
    role          AS role,
    org_id
FROM public.org_members
WHERE role IN ('owner', 'pastor', 'super_admin', 'super-admin')

UNION ALL

-- 3. Mission Control (Shepherds/Admins)
SELECT
    user_id             AS identity_id,
    'tenant'            AS auth_domain,
    'mission-control'   AS auth_surface,
    role                AS role,
    org_id
FROM public.org_members
WHERE role IN ('admin', 'shepherd', 'owner', 'pastor', 'super_admin', 'super-admin')

UNION ALL

-- 4. Kingdom Class / Language School
SELECT
    om.user_id    AS identity_id,
    'tenant'      AS auth_domain,
    'kingdom-class' AS auth_surface,
    om.role       AS role,
    om.org_id
FROM public.org_members om
WHERE om.role IN ('owner', 'pastor', 'super_admin', 'super-admin')
   OR EXISTS (
       SELECT 1 FROM public.ministries m
       WHERE m.leader_id = om.user_id
         AND m.slug = 'language'
   )

UNION ALL

-- 5. Ministry Silos — ALL active members (not just ministry_lead)
SELECT
    mm.user_id                              AS identity_id,
    'tenant'                                AS auth_domain,
    'ministry'                              AS auth_surface,
    (mm.ministry_role || ':' || m.slug)     AS role,
    mm.org_id
FROM public.ministry_members mm
JOIN public.ministries m ON mm.ministry_id = m.id
WHERE mm.is_active = true
  AND mm.ministry_role IN ('leader', 'ministry_lead', 'ministry_leader', 'assistant', 'volunteer', 'member')
  AND m.is_active = true

UNION ALL

-- 5b. Ministry Hub (Admins/Shepherds/Pastors)
-- Gives a general entry point to the ministry dashboard hub for oversight
SELECT
    user_id             AS identity_id,
    'tenant'            AS auth_domain,
    'ministry'          AS auth_surface,
    'hub'               AS role,
    org_id
FROM public.org_members
WHERE role IN ('admin', 'shepherd', 'owner', 'pastor', 'super_admin', 'super-admin')

UNION ALL

-- 6. Member Profile
SELECT
    user_id       AS identity_id,
    'member'      AS auth_domain,
    'profile'     AS auth_surface,
    'member'      AS role,
    org_id
FROM public.org_members
WHERE role = 'member'

UNION ALL

-- 7. Onboarding
SELECT
    identity_id   AS identity_id,
    'onboarding'  AS auth_domain,
    'onboarding'  AS auth_surface,
    status        AS role,
    NULL::UUID    AS org_id
FROM public.onboarding_sessions;

GRANT SELECT ON public.v_user_auth_contexts TO authenticated;
