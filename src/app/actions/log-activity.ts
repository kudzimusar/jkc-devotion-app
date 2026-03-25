"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { ActivityAction } from "@/lib/activity-logger";

export async function logActivityServer(
    userId: string,
    action: ActivityAction,
    details: string,
    metadata: any = {}
) {
    try {
        await supabaseAdmin.from('system_activity_logs').insert({
            user_id: userId,
            action,
            details,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                server_action_bypass: true
            }
        });
    } catch (err) {
        console.error("Failed to log activity securely via Server Action:", err);
    }
}
