/**
 * Supabase Admin Client — Service Role
 * Bypasses RLS for admin dashboard queries.
 * NEVER expose this client on the member-facing frontend.
 * Only used inside /shepherd/* routes.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const isMissingVars = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

if (isMissingVars && process.env.NODE_ENV === 'production') {
  console.log('ℹ️ [Supabase Admin] Admin keys skipped for static export. This is normal for public-facing deployments.');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
