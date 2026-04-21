/**
 * org-resolver.ts
 * Single source of truth for resolving org_id in all contexts.
 * Works across static export (public pages) and authenticated sessions (dashboard).
 */
import { supabase } from './supabase';

export const JKC_ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';
const ORG_CACHE_KEY = 'church_os_public_org';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory memoization
let memoizedPublicOrgId: string | null = null;
let memoizedAdminContext: { orgId: string; role: string } | null = null;

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
  // 0. Check in-memory memoization first
  if (memoizedPublicOrgId) return memoizedPublicOrgId;

  // 1. Check session cache
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(ORG_CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedOrg = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
          memoizedPublicOrgId = parsed.orgId;
          return parsed.orgId;
        }
      } catch { /* ignore */ }
    }
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : null;

  // Church OS platform subdomains — resolve to Church OS org record
  const CHURCHOS_SUBDOMAINS = [
    'churchos-ai.website',
    'www.churchos-ai.website',
    'app.churchos-ai.website',
    'admin.churchos-ai.website',
    'super.churchos-ai.website',
    'ai.churchos-ai.website',
    'onboard.churchos-ai.website',
    'auth.churchos-ai.website',
    'devotion.churchos-ai.website',
  ];

  if (hostname && CHURCHOS_SUBDOMAINS.includes(hostname)) {
    // CRITICAL: On admin subdomains, check if we have a tenant slug in the path or session first
    const slugFromSession = typeof window !== 'undefined' ? sessionStorage.getItem('church_os_church_slug') : null;
    if (slugFromSession && slugFromSession !== 'tenant' && slugFromSession !== 'onboarding') {
      const { data: tenantData } = await supabase
        .from('organizations')
        .select('id')
        .eq('church_slug', slugFromSession)
        .eq('status', 'active')
        .single();
      
      if (tenantData) {
        memoizedPublicOrgId = tenantData.id;
        return tenantData.id;
      }
    }

    // Otherwise, fall back to Church OS Company identity
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('domain', 'churchos-ai.website')
      .single();
    const resolvedId = data?.id ?? null;
    if (resolvedId && typeof window !== 'undefined') {
      memoizedPublicOrgId = resolvedId;
      const toCache: CachedOrg = { orgId: resolvedId, cachedAt: Date.now() };
      sessionStorage.setItem(ORG_CACHE_KEY, JSON.stringify(toCache));
    }
    return resolvedId;
  }

  // localhost dev fallback — resolves to JKC for local testing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return JKC_ORG_ID;
  }

  const isLocal = false;
  let orgId: string | null = null;

  try {
    if (isLocal) {
      // Step 2a: Try to resolve from the church slug in sessionStorage (set by ChurchProvider)
      const slugFromSession = typeof window !== 'undefined' ? sessionStorage.getItem('church_os_church_slug') : null;
      if (slugFromSession) {
        const { data } = await supabase
          .from('organizations')
          .select('id')
          .eq('church_slug', slugFromSession)
          .eq('status', 'active')
          .single();
        orgId = data?.id ?? null;
      }

      // Step 2b: Try to extract slug from URL path (e.g. /grace-fellowship/...)
      if (!orgId && typeof window !== 'undefined') {
        const pathSegments = window.location.pathname.replace(/^\//, '').split('/');
        const firstSegment = pathSegments[0];
        if (firstSegment && firstSegment !== 'jkc' && firstSegment !== 'welcome' && firstSegment !== 'member') {
          const { data } = await supabase
            .from('organizations')
            .select('id')
            .eq('church_slug', firstSegment)
            .eq('status', 'active')
            .single();
          orgId = data?.id ?? null;
        }
      }

      // Step 2c: Default to JKC for dev/localhost with no slug context
      if (!orgId) {
        const { data, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', JKC_ORG_ID)
          .single();

        if (error) console.error('[ORG RESOLVER] Local resolve failed:', error.message);
        orgId = data?.id ?? null;
      }
    } else {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('domain', hostname)
        .single();
      
      if (error) console.error(`[ORG RESOLVER] Domain resolve failed (${hostname}):`, error.message);
      orgId = data?.id ?? null;
    }
  } catch (err) {
    console.error('[ORG RESOLVER] Unexpected error during resolution:', err);
    return null;
  }

  // Cache the result
  if (orgId && typeof window !== 'undefined') {
    memoizedPublicOrgId = orgId;
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
  if (memoizedAdminContext) return memoizedAdminContext;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[ORG RESOLVER] session error:', sessionError.message);
      return null;
    }
    if (!session?.user) return null;

    const { data: rawMembers, error: membersError } = await supabase
      .from('org_members')
      .select('role, org_id')
      .eq('user_id', session.user.id);

    if (membersError) {
      console.error('[ORG RESOLVER] members query error:', membersError.message);
      return null;
    }

    if (!rawMembers || rawMembers.length === 0) {
      console.warn('[ORG RESOLVER] No org memberships found for user:', session.user.id);
      return null;
    }

    const members = rawMembers as { role: string; org_id: string }[];
    console.log('[ORG RESOLVER] Found memberships:', members.map(m => `${m.role}@${m.org_id}`));

    let result: { orgId: string; role: string } | null = null;

    // ── Organization Resolution Logic ──
    if (members.length === 1) {
      result = { orgId: members[0].org_id, role: members[0].role };
      console.log('[ORG RESOLVER] Single membership resolved:', result.role);
    } else if (members.length > 1) {
      // 1. Prioritize super_admin role (Corporate Layer)
      const saMatch = members.find(m => m.role === 'super_admin');
      if (saMatch) {
         result = { orgId: saMatch.org_id, role: saMatch.role };
         console.log('[ORG RESOLVER] Prioritized super_admin role');
      } else if (typeof window !== 'undefined') {
        const activeOrgId = sessionStorage.getItem('church_os_active_org');
        if (activeOrgId) {
          const match = members.find(m => m.org_id === activeOrgId);
          if (match) {
            result = { orgId: match.org_id, role: match.role };
            console.log('[ORG RESOLVER] Used active selection:', activeOrgId);
          }
        }
      }
      
      // Fallback to first if no selection
      if (!result) {
        result = { orgId: members[0].org_id, role: members[0].role };
        console.log('[ORG RESOLVER] Fallback to first membership:', result.role);
      }
    }

    if (result) {
      memoizedAdminContext = result;
    }
    return result;
  } catch (err) {
    console.error('[ORG RESOLVER] Admin resolution error:', err);
    return null;
  }
}

/**
 * SLUG RESOLVER
 * Maps a church_slug to an org_id. Used by [church_slug] dynamic routes.
 */
export async function resolveOrgBySlug(slug: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('church_slug', slug)
      .eq('status', 'active')
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * SLUG LOOKUP
 * Returns the church_slug for a given org_id. Used by BaseAuth to build redirect URLs.
 */
export async function resolveSlugByOrgId(orgId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('organizations')
      .select('church_slug')
      .eq('id', orgId)
      .single();
    return data?.church_slug ?? null;
  } catch {
    return null;
  }
}

/**
 * Clears the public org cache (call on domain change or logout)
 */
export function clearOrgCache() {
  memoizedPublicOrgId = null;
  memoizedAdminContext = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ORG_CACHE_KEY);
    sessionStorage.removeItem('church_os_active_org'); // Also clear admin selection
  }
}
