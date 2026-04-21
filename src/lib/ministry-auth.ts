"use client";
import { supabase } from './supabase';
import { basePath as BP } from './utils';

export const MINISTRY_ROLES = ['leader', 'assistant', 'volunteer', 'member'] as const;
export type MinistryRole = typeof MINISTRY_ROLES[number];

export const MINISTRY_ROLE_HIERARCHY: Record<MinistryRole, number> = {
    leader: 60,
    assistant: 40,
    volunteer: 20,
    member: 10,
};

export interface MinistrySession {
    userId: string;
    ministryRole: MinistryRole;
    ministryId: string;
    orgId: string;
    ministryName: string;
    slug: string;
    color: string;
    icon: string;
    description: string;
}

export const MinistryAuth = {
    async getMinistrySession(slug: string): Promise<MinistrySession | null> {
        try {
            const { data: { session: authSess } } = await supabase.auth.getSession();
            if (!authSess?.user) return null;

            // 1. SKELETON KEY: Check if user is an Admin/Shepherd/Owner/Pastor of the org
            const { data: orgRoles } = await supabase
                .from('org_members')
                .select('role, org_id')
                .eq('user_id', authSess.user.id)
                .in('role', ['admin', 'shepherd', 'owner', 'pastor', 'super_admin', 'super-admin']);

            const isAdmin = orgRoles && orgRoles.length > 0;

            // 2. Resolve ministry info
            const { data: ministry, error: minError } = await supabase
                .from('ministries')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .maybeSingle();

            if (minError || !ministry) return null;

            // 3. Resolve user role in this ministry
            const { data: memberData } = await supabase
                .from('ministry_members')
                .select('ministry_role')
                .eq('user_id', authSess.user.id)
                .eq('ministry_id', ministry.id)
                .eq('is_active', true)
                .maybeSingle();

            // If user is Admin, they get "leader" rank automatically for the skeleton key
            const effectiveRole = memberData?.ministry_role || (isAdmin ? 'leader' : null);

            if (!effectiveRole) return null;

            return {
                userId: authSess.user.id,
                ministryRole: effectiveRole as MinistryRole,
                ministryId: ministry.id as string,
                orgId: ministry.org_id,
                ministryName: ministry.name,
                slug: ministry.slug,
                color: ministry.color,
                icon: ministry.icon,
                description: ministry.description,
            };

        } catch (err) {
            console.error('[MinistryAuth] Session error:', err);
            return null;
        }
    },

    can(userRole: MinistryRole, requiredRole: MinistryRole): boolean {
        return (MINISTRY_ROLE_HIERARCHY[userRole] || 0) >= (MINISTRY_ROLE_HIERARCHY[requiredRole] || 0);
    },

    async requireAccess(slug: string, minimumRole: MinistryRole = 'member'): Promise<MinistrySession> {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (!authSession?.user) {
            if (typeof window !== 'undefined') {
                 window.location.href = `${BP}/login/`;
            }
            throw new Error('Access denied: You are not logged in.');
        }

        const session = await this.getMinistrySession(slug);
        
        if (!session) {
            if (typeof window !== 'undefined') {
                 // Try to redirect to context selector instead of a generic login
                 window.location.href = `${BP}/auth/context-selector/?domain=tenant`;
            }
            throw new Error('Access denied: You do not have permission for this ministry.');
        }

        if (!this.can(session.ministryRole, minimumRole)) {
             if (typeof window !== 'undefined') {
                window.location.href = `${BP}/auth/context-selector/?domain=tenant`;
            }
            throw new Error('Access denied: Insufficient role.');
        }

        return session;
    }
};
