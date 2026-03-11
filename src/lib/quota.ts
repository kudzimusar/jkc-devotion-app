import { supabaseAdmin as supabase } from './supabase-admin';

export async function checkQuota(orgId: string): Promise<boolean> {
    const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_status, tier')
        .eq('id', orgId)
        .single();

    if (error || !org) return false;

    if (org.subscription_status === 'canceled') return false;

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
        .from('api_usage_logs')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId)
        .gte('created_at', `${today}T00:00:00.000Z`);

    const usageCount = count || 0;
    const tier = org.tier || 'lite';

    let limit = 1000;
    if (tier === 'pro') limit = 10000;
    if (tier === 'enterprise') limit = Infinity;

    return usageCount < limit;
}

export async function recordApiUsage(orgId: string) {
    await supabase
        .from('api_usage_logs')
        .insert([{ org_id: orgId }]);
}
