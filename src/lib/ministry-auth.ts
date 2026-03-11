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
    ministryName: string;
    slug: string;
    color: string;
    icon: string;
    description: string;
}

export const MinistryAuth = {
    async getMinistrySession(slug: string): Promise<MinistrySession | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            // Run the exact query from the spec via Supabase JS client
            const { data, error } = await supabase
                .from('ministry_members')
                .select(`
                    ministry_role,
                    ministry_id,
                    ministries!inner(name, slug, color, icon, description, is_active)
                `)
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .eq('ministries.slug', slug)
                .eq('ministries.is_active', true)
                .maybeSingle();

            if (error || !data) return null;

            const ministry = Array.isArray(data.ministries) ? data.ministries[0] : data.ministries;

            return {
                userId: session.user.id,
                ministryRole: data.ministry_role as MinistryRole,
                ministryId: data.ministry_id as string,
                ministryName: ministry.name,
                slug: ministry.slug,
                color: ministry.color,
                icon: ministry.icon,
                description: ministry.description,
            };
        } catch {
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
                window.location.href = `${BP}/ministry-dashboard?redirect=/ministry-dashboard/${slug}`;
            }
            throw new Error('Access denied: You are not logged in.');
        }

        const session = await this.getMinistrySession(slug);
        
        if (!session) {
            if (typeof window !== 'undefined') {
                window.location.href = `${BP}/ministry-dashboard`;
            }
            throw new Error('Access denied: You are not a member of this ministry.');
        }

        if (!this.can(session.ministryRole, minimumRole)) {
             if (typeof window !== 'undefined') {
                window.location.href = `${BP}/ministry-dashboard`;
            }
            throw new Error('Access denied: Insufficient role.');
        }

        return session;
    }
};
