"use client";
/**
 * Admin Auth Module (Refactored)
 * Handles domain-isolated sessions, multi-context resolution, and route guarding.
 */
import { supabase } from './supabase';
import { basePath as BP } from './utils';
import { clearOrgCache } from './org-resolver';

export type AuthDomain = 'corporate' | 'tenant' | 'onboarding' | 'member';
export type AuthSurface = 'console' | 'mission-control' | 'ministry' | 'profile' | 'onboarding';

// ── Legacy compatibility exports ──
export type AdminRole = 'super_admin' | 'pastor' | 'owner' | 'shepherd' | 'admin' | 'ministry_lead' | 'ministry_leader' | 'member';

export const ADMIN_ROLES: AdminRole[] = [
    'super_admin', 'pastor', 'owner', 'shepherd', 'admin', 'ministry_lead', 'ministry_leader', 'member'
];

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
    super_admin: 100,
    pastor: 90,
    owner: 85,
    shepherd: 70,
    admin: 60,
    ministry_lead: 40,
    ministry_leader: 40,
    member: 10,
};

export interface DomainSession {
  identity_id: string;
  auth_domain: AuthDomain;
  auth_surface: AuthSurface;
  org_id?: string;
  role: string;
  expires_at: number;
  name: string;
  email: string;
}

const DOMAIN_CACHE_KEY = 'church_os_active_domain';
const SESSION_CACHE_KEY = 'church_os_domain_session';

export const AdminAuth = {
    // ── Get session (Isolated by domain) ──
    async getSession(requiredDomain?: AuthDomain): Promise<DomainSession | null> {
        if (typeof window === 'undefined') return null;

        const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (cached) {
            try {
                const session: DomainSession = JSON.parse(cached);
                if (Date.now() < session.expires_at) {
                    if (!requiredDomain || session.auth_domain === requiredDomain) {
                        return session;
                    }
                }
            } catch (e) {
                console.error('[AdminAuth] Session parse error:', e);
            }
        }

        // Fetch/Resolve session from view
        try {
            const { data: { session: sbSession } } = await supabase.auth.getSession();
            if (!sbSession?.user) return null;

            // Fetch contexts for this identity
            const { data: contexts, error } = await supabase
                .from('v_user_auth_contexts')
                .select('*')
                .eq('identity_id', sbSession.user.id);

            if (error || !contexts || contexts.length === 0) return null;

            // If a domain is required, filter for it
            let activeContext = contexts[0];
            const cachedDomain = sessionStorage.getItem(DOMAIN_CACHE_KEY);
            
            if (requiredDomain) {
                activeContext = contexts.find(c => c.auth_domain === requiredDomain) || contexts[0];
                if (activeContext.auth_domain !== requiredDomain) return null;
            } else if (cachedDomain) {
                activeContext = contexts.find(c => c.auth_domain === cachedDomain) || contexts[0];
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', sbSession.user.id)
                .single();

            const domainSession: DomainSession = {
                identity_id: sbSession.user.id,
                auth_domain: activeContext.auth_domain,
                auth_surface: activeContext.auth_surface,
                org_id: activeContext.org_id,
                role: activeContext.role,
                expires_at: Date.now() + (30 * 60 * 1000), // 30 min default
                name: profile?.name || sbSession.user.email || 'User',
                email: sbSession.user.email || ''
            };

            sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(domainSession));
            sessionStorage.setItem(DOMAIN_CACHE_KEY, domainSession.auth_domain);
            
            return domainSession;
        } catch (err) {
            console.error('[AdminAuth] Session resolution error:', err);
            return null;
        }
    },

    // ── Login ──
    async login(email: string, password: string, domain: AuthDomain): Promise<{
        success: boolean;
        session?: DomainSession;
        error?: string;
    }> {
        // Clear existing session
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_CACHE_KEY);
            sessionStorage.setItem(DOMAIN_CACHE_KEY, domain);
            clearOrgCache();
        }

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) return { success: false, error: authError.message };

        const session = await this.getSession(domain);
        if (!session) {
            await supabase.auth.signOut();
            return { success: false, error: `Access denied. No active context for the ${domain} domain.` };
        }

        return { success: true, session };
    },

    // ── Logout ──
    async logout() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_CACHE_KEY);
            sessionStorage.removeItem(DOMAIN_CACHE_KEY);
            clearOrgCache();
        }
        await supabase.auth.signOut();
        window.location.href = `${BP}/`;
    },

    // ── Permission check: does role meet or exceed required clearance ──
    can(role: string, requiredRole: AdminRole): boolean {
        return (ROLE_HIERARCHY[role as AdminRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
    },

    // ── Clear cached session ──
    clearCache() {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_CACHE_KEY);
            sessionStorage.removeItem(DOMAIN_CACHE_KEY);
        }
    },

    // ── Deprecated: logoutAdmin (Legacy compat alias) ──
    async logoutAdmin() {
        return this.logout();
    },

    // ── Deprecated: getAdminSession (Legacy compat) ──
    async getAdminSession() {
        const session = await this.getSession();
        if (!session) return null;
        return {
            userId: session.identity_id,
            email: session.email,
            name: session.name,
            role: session.role as any,
            orgId: session.org_id || '',
            cachedAt: Date.now()
        };
    }
};

