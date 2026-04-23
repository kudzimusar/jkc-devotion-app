-- Targeted DDL: Add missing columns to ministries table
-- This script adds the columns that the initial partial run missed.
-- All statements are idempotent (IF NOT EXISTS).

ALTER TABLE public.ministries
    ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#6D28D9',
    ADD COLUMN IF NOT EXISTS intelligence_tag TEXT DEFAULT 'OPERATIONAL',
    ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.forms
    ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL;

ALTER TABLE public.kids_registry
    ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id),
    ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS room_name TEXT;

ALTER TABLE public.children_checkins
    ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id);

-- Backfill forms.ministry_id from slug matching
UPDATE public.forms f
SET ministry_id = m.id
FROM public.ministries m
WHERE f.ministry_id IS NULL
  AND f.ministry = m.slug;

-- Backfill kids_registry.ministry_id
UPDATE public.kids_registry k
SET ministry_id = m.id
FROM public.ministries m
WHERE k.ministry_id IS NULL
  AND m.slug = 'children';

-- Backfill children_checkins.ministry_id
UPDATE public.children_checkins c
SET ministry_id = m.id
FROM public.ministries m
WHERE c.ministry_id IS NULL
  AND m.slug = 'children';

-- Now update intelligence_tag and secondary_color for all ministries
UPDATE public.ministries SET secondary_color = '#6D28D9', intelligence_tag = 'SOULFUL & TECH'         WHERE slug = 'worship';
UPDATE public.ministries SET secondary_color = '#D97706', intelligence_tag = 'PRECISE & SHARP'        WHERE slug = 'ushers';
UPDATE public.ministries SET secondary_color = '#0891B2', intelligence_tag = 'INDUSTRIAL & DARK'      WHERE slug = 'media';
UPDATE public.ministries SET secondary_color = '#DB2777', intelligence_tag = 'SOFT & PROTECTIVE'      WHERE slug = 'children';
UPDATE public.ministries SET secondary_color = '#CA8A04', intelligence_tag = 'VIBRANT & ACTIVE'       WHERE slug = 'youth';
UPDATE public.ministries SET secondary_color = '#6366F1', intelligence_tag = 'ETHEREAL & CALM'        WHERE slug = 'prayer';
UPDATE public.ministries SET secondary_color = '#059669', intelligence_tag = 'TRUST & SECURITY'       WHERE slug = 'pastoral';
UPDATE public.ministries SET secondary_color = '#15803D', intelligence_tag = 'URGENT & BOLD'          WHERE slug = 'evangelism';
UPDATE public.ministries SET secondary_color = '#1D4ED8', intelligence_tag = 'ACADEMIC & ELITE'       WHERE slug = 'language';
UPDATE public.ministries SET secondary_color = '#10B981', intelligence_tag = 'CLEAN & SECURE'         WHERE slug = 'finance';
UPDATE public.ministries SET secondary_color = '#92400E', intelligence_tag = 'WARM & INVITING'        WHERE slug = 'hospitality';
UPDATE public.ministries SET secondary_color = '#0D9488', intelligence_tag = 'ORGANIC & CONNECTED'    WHERE slug = 'fellowship';
UPDATE public.ministries SET secondary_color = '#2563EB', intelligence_tag = 'GLOBAL & EXPANSIVE'     WHERE slug = 'missions';
UPDATE public.ministries SET secondary_color = '#DC2626', intelligence_tag = 'GRITTY & COMPASSIONATE' WHERE slug = 'akiramenai';
UPDATE public.ministries SET secondary_color = '#4D7C0F', intelligence_tag = 'ORDERLY & FRESH'        WHERE slug = 'foodpantry';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
