-- Fix: handle_new_user trigger used ON CONFLICT (id) which only catches PK conflicts.
-- profiles has UNIQUE(email, org_id) — when a profile row already exists for that
-- email+org pair (e.g. admin pre-seeded the member), the trigger threw an unhandled
-- unique_violation exception → "database error saving new user".
-- Fix: use ON CONFLICT DO NOTHING (no target) which suppresses ANY unique violation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text;
  v_org_id uuid;
  v_name   text;
BEGIN
  v_source := new.raw_user_meta_data->>'source';
  v_name   := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  IF v_source = 'churchgpt_public' THEN
    INSERT INTO public.profiles (id, name, email, org_id)
    VALUES (new.id, v_name, new.email, NULL)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.churchgpt_users (user_id, email, display_name, source)
    VALUES (new.id, new.email, v_name, 'churchgpt_public')
    ON CONFLICT (user_id) DO NOTHING;

  ELSE
    v_org_id := (new.raw_user_meta_data->>'org_id')::uuid;

    INSERT INTO public.profiles (id, name, email, org_id)
    VALUES (new.id, v_name, new.email, v_org_id)
    ON CONFLICT DO NOTHING;

    IF v_org_id IS NOT NULL THEN
      INSERT INTO public.member_stats (user_id, org_id)
      VALUES (new.id, v_org_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
