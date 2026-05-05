-- Member talent pool view used by the PIL engine to match member skills to ministry gaps.
-- skills: derived from profiles.skill_notes (comma-separated text → array)
-- current_ministries: active ministry_members entries for this member

DROP VIEW IF EXISTS public.vw_member_talent_pool;

CREATE VIEW public.vw_member_talent_pool AS
SELECT
    p.id          AS user_id,
    p.name,
    p.email,
    p.org_id,
    p.occupation,
    CASE
        WHEN p.skill_notes IS NOT NULL AND p.skill_notes <> ''
        THEN string_to_array(p.skill_notes, ',')
        ELSE ARRAY[]::text[]
    END AS skills,
    COALESCE(
        ARRAY(
            SELECT mm.ministry_name
            FROM   public.ministry_members mm
            WHERE  mm.user_id  = p.id
              AND  mm.org_id   = p.org_id
              AND  mm.is_active = true
              AND  mm.status    = 'active'
        ),
        ARRAY[]::text[]
    ) AS current_ministries
FROM public.profiles p
WHERE p.org_id IS NOT NULL;

GRANT SELECT ON public.vw_member_talent_pool TO authenticated;
