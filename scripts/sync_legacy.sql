-- Final cleanup for org_members to match profiles
UPDATE public.org_members om
SET stage = p.growth_stage,
    role = CASE 
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role_name = 'super_admin') THEN 'super_admin'
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role_name = 'owner') THEN 'owner'
        ELSE om.role
    END
FROM public.profiles p
WHERE om.user_id = p.id;
