"use client";
/**
 * Admin Auth Module
 * Handles admin session persistence, role caching, and route guarding
 * for the /shepherd/* dashboard routes.
 */
import { supabase } from './supabase';
import { basePath as BP } from './utils';

export const ADMIN_ROLES = ['super_admin', 'owner', 'shepherd', 'admin', 'ministry_lead', 'ministry_leader'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
    super_admin: 100,
    owner: 90,
    shepherd: 80,
    admin: 70,
    ministry_lead: 60,
    ministry_leader: 60,
};

const CACHE_KEY = 'church_os_admin_session';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
                } catch { }
            }
        }

        // Fetch from Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            const { data: member } = await supabase
                .from('org_members')
                .select('role, org_id')
                .eq('user_id', session.user.id)
                .maybeSingle();

            let role = member?.role;
            let orgId = member?.org_id;

            // Fallback to user_roles if org_members doesn't have the role
            if (!role) {
                const { data: userRole } = await supabase
                    .from('user_roles')
                    .select('role_name, org_id')
                    .eq('user_id', session.user.id)
                    .limit(1)
                    .maybeSingle();

                if (userRole) {
                    role = userRole.role_name;
                    orgId = userRole.org_id;
                }
            }

            if (!role || !ADMIN_ROLES.includes(role as AdminRole)) return null;

            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', session.user.id)
                .single();

            const sessionData: CachedSession = {
                userId: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.email || 'Admin',
                role: role as AdminRole,
                orgId: orgId as string,
                cachedAt: Date.now(),
            };

            if (typeof window !== 'undefined') {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(sessionData));
            }
            return sessionData;
        } catch {
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
        }

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) return { success: false, error: authError.message };

        const session = await this.getAdminSession();
        if (!session) {
            await supabase.auth.signOut();
            return { success: false, error: 'You do not have admin access. Contact your administrator.' };
        }

        return { success: true, role: session.role, name: session.name };
    },

    // ── Logout ──
    async logoutAdmin() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(CACHE_KEY);
        }
        await supabase.auth.signOut();
        window.location.href = `${BP}/shepherd/login`;
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
