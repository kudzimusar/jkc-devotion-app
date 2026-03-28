import { supabase } from "@/lib/supabase";

export type ActivityAction = 'LOGIN' | 'LOGOUT' | 'MEMBER_UPDATE' | 'FINANCE_EDIT' | 'ROLE_CHANGE' | 'INTELLIGENCE_SWEEP' | 'MINISTRY_UPDATE' | 'SOAP_ENTRY_CREATED' | 'PROFILE_UPDATE' | 'PREFERENCE_UPDATE';

/**
 * Logs activity from the client side.
 * RLS must allow the current user to insert to system_activity_logs.
 */
export async function logActivityServer(userId: string, action: ActivityAction, details: string, metadata: any = {}) {
    const { error } = await supabase.from('system_activity_logs').insert({ 
        actor_id: userId, 
        org_id: 'fa547adf-f820-412f-9458-d6bade11517d', // TODO: Make this dynamic from current user context
        action, 
        details, 
        metadata: { ...metadata, timestamp: new Date().toISOString() } 
    });
    if (error) console.error("Activity log error:", error.message);
}
