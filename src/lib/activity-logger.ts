import { supabase } from "./supabase";

export type ActivityAction = 'LOGIN' | 'LOGOUT' | 'MEMBER_UPDATE' | 'FINANCE_EDIT' | 'ROLE_CHANGE' | 'INTELLIGENCE_SWEEP' | 'MINISTRY_UPDATE';

/**
 * System Activity Logger
 * Records administrative and strategic actions for audit trails.
 */
export async function logActivity(
    action: ActivityAction,
    details: string,
    metadata: any = {}
) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // If it's a login action, also log to the new domain-aware audit system
        if (action === 'LOGIN') {
            await supabase.rpc('fn_log_auth_event', {
                p_identity_id: session.user.id,
                p_auth_domain: metadata.domain || 'tenant',
                p_auth_surface: metadata.surface || 'mission-control',
                p_intent: metadata.intent || 'login',
                p_gateway: 'web-v3',
                p_org_id: metadata.org_id,
                p_mfa_verified: !!session.user.factors?.some(f => f.status === 'verified'),
                p_user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
            });
        }

        // Try to get org_id from metadata first, then user_metadata, then profile
        let orgId = metadata.org_id || session.user.user_metadata?.org_id;

        if (!orgId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', session.user.id)
                .single();
            orgId = profile?.org_id;
        }

        await supabase.from('system_activity_logs').insert({
            user_id: session.user.id,
            org_id: orgId,
            action,
            details,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
            }
        });
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}
