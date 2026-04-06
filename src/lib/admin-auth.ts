"use client";
/**
 * Admin Auth Module
 * Handles admin session persistence, role caching, and route guarding
 * for the /shepherd/* dashboard routes.
 */
import { supabase } from './supabase';
import { basePath as BP } from './utils';
import { resolveAdminOrgId, clearOrgCache } from './org-resolver';

export const ADMIN_ROLES = ['super_admin', 'pastor', 'owner', 'shepherd', 'admin', 'ministry_lead', 'ministry_leader', 'member'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
    super_admin: 100,
    pastor: 100,
    owner: 95,
    shepherd: 80,
    admin: 70,
    ministry_lead: 60,
    ministry_leader: 60,
    member: 10,
};

const CACHE_KEY = 'church_os_admin_session';
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes for better UX

interface CachedSession {
    userId: string;
    email: string;
    name: string;
    role: AdminRole;
    orgId: string;
    cachedAt: number;
}

export const AdminAuth = {
    // ── Get session (from cache or Supabase) ──
    async getAdminSession(): Promise<CachedSession | null> {
        // Check cache first
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const parsed: CachedSession = JSON.parse(cached);
                    if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
                        return parsed;
                    }
                } catch (e) {
                    console.error('[AdminAuth] Cache parse error:', e);
                }
            }
        }

        // Fetch from Supabase
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            if (!session?.user) {
                console.log('[AdminAuth] No active session found');
                return null;
            }

            const res = await resolveAdminOrgId();
            if (!res) {
                console.warn('[AdminAuth] Could not resolve organization context for user:', session.user.id);
                return null;
            }
            
            const { orgId, role } = res;
            if (!role || !ADMIN_ROLES.includes(role as AdminRole)) {
                console.warn('[AdminAuth] Invalid or insufficient role detected:', role);
                return null;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.warn('[AdminAuth] Profile fetch warning (continuing with email):', profileError.message);
            }

            const sessionData: CachedSession = {
                userId: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.email || 'User',
                role: role as AdminRole,
                orgId: orgId as string,
                cachedAt: Date.now(),
            };

            if (typeof window !== 'undefined') {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(sessionData));
            }
            console.log(`[AdminAuth] Session established:`, { role, email: sessionData.email });
            return sessionData;
        } catch (err) {
            console.error('[AdminAuth] Fatal session resolution error:', err);
            return null;
        }
    },

    // ── Login ──
    async loginAdmin(email: string, password: string): Promise<{
        success: boolean;
        role?: AdminRole;
        name?: string;
        error?: string;
    }> {
        // Clear any existing cache
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(CACHE_KEY);
            clearOrgCache();
        }

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) return { success: false, error: authError.message };

        const session = await this.getAdminSession();
        if (!session) {
            await supabase.auth.signOut();
            return { success: false, error: 'You do not have administrative access for this organization.' };
        }

        return { success: true, role: session.role, name: session.name };
    },

    // ── Logout ──
    async logoutAdmin() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(CACHE_KEY);
            clearOrgCache();
        }
        await supabase.auth.signOut();
        window.location.href = `${BP}/login/`;
    },

    // ── Check if role has permission ──
    can(userRole: AdminRole, requiredRole: AdminRole): boolean {
        return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
    },

    // ── Clear cache (force refresh) ──
    clearCache() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(CACHE_KEY);
        }
    },
};
