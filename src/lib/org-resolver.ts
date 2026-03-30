/**
 * org-resolver.ts
 * Single source of truth for resolving org_id in all contexts.
 * Works across static export (public pages) and authenticated sessions (dashboard).
 */
import { supabase } from './supabase';

export const JKC_ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';
const ORG_CACHE_KEY = 'church_os_public_org';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CachedOrg {
  orgId: string;
  cachedAt: number;
}

/**
 * PUBLIC PAGE RESOLVER
 * Maps window.location.hostname to an org_id via the organizations table.
 * Used by WatchClient and other public-facing pages.
 * Falls back to the first org for localhost/dev environments.
 */
export async function resolvePublicOrgId(): Promise<string | null> {
  // 1. Check session cache
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(ORG_CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedOrg = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
          return parsed.orgId;
        }
      } catch { /* ignore */ }
    }
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : null;
  const isLocal = !hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('github.io');

  let orgId: string | null = null;

  if (isLocal) {
    // Dev/GitHub Pages fallback: use the JKC org explicitly
    // This is intentional — in production each domain resolves dynamically
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', JKC_ORG_ID)
      .single();
    orgId = data?.id ?? null;
  } else {
    // Production: resolve by domain
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('domain', hostname)
      .single();
    orgId = data?.id ?? null;
  }

  // Cache the result
  if (orgId && typeof window !== 'undefined') {
    const toCache: CachedOrg = { orgId, cachedAt: Date.now() };
    sessionStorage.setItem(ORG_CACHE_KEY, JSON.stringify(toCache));
  }

  return orgId;
}

/**
 * ADMIN SESSION RESOLVER
 * Resolves org_id from the authenticated user's org_members record.
 * Handles multi-org users by requiring an explicit org selection.
 * Used by AdminAuth and dashboard pages.
 */
export async function resolveAdminOrgId(): Promise<{ orgId: string; role: string } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: members, error } = await supabase
    .from('org_members')
    .select('role, org_id')
    .eq('user_id', session.user.id);

  if (error || !members || members.length === 0) return null;

  // Single org: straightforward
  if (members.length === 1) {
    return { orgId: members[0].org_id, role: members[0].role };
  }

  // Multi-org: check if an active org is stored in session
  if (typeof window !== 'undefined') {
    const activeOrgId = sessionStorage.getItem('church_os_active_org');
    if (activeOrgId) {
      const match = members.find(m => m.org_id === activeOrgId);
      if (match) return { orgId: match.org_id, role: match.role };
    }
  }

  // Default to the first org (highest role wins in future enhancement)
  return { orgId: members[0].org_id, role: members[0].role };
}

/**
 * Clears the public org cache (call on domain change or logout)
 */
export function clearOrgCache() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ORG_CACHE_KEY);
  }
}
