import { createClient } from '@supabase/supabase-js';

// Fallback values for build time transparency
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AnalyticsService = {
    async logEvent(userId: string, eventType: string, payload: any) {
        if (!userId) return;
        try {
            await supabase.from('member_analytics').insert({
                user_id: userId,
                event_type: eventType,
                ...payload,
                created_at: new Date().toISOString()
            });
        } catch (e) {
            console.error("Failed to log analytics event", e);
        }
    }
};

export const ExtendedProfileService = {
    // Falls back to localStorage if profiles schema isn't updated, but logs analytics securely.
    async saveLocal(key: string, data: any) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(data));
        }
    },
    async getLocal(key: string, defaultVal: any) {
        if (typeof window !== 'undefined') {
            const val = localStorage.getItem(key);
            if (val) {
                try { return JSON.parse(val); } catch (e) { return defaultVal; }
            }
        }
        return defaultVal;
    }
};
