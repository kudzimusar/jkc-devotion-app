-- Fix handle_new_user trigger to ensure reliability during account seeding
-- This simplifies the trigger to only perform core profile creation, avoiding cascade failures from stats tables

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
        BEGIN
          INSERT INTO public.profiles (id, name, email, org_id)
          VALUES (
            new.id, 
            new.raw_user_meta_data->>'full_name', 
            new.email,
            COALESCE((new.raw_user_meta_data->>'org_id')::uuid, 'fa547adf-f820-412f-9458-d6bade11517d'::uuid)
          )
          ON CONFLICT (id) DO NOTHING;
          
          INSERT INTO public.user_progress (user_id)
          VALUES (new.id)
          ON CONFLICT (user_id) DO NOTHING;
          
          RETURN NEW;
        END;
        $function$;

-- Ensure trigger is attached correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
 AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
