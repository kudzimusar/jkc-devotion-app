import { supabaseAdmin } from "@/lib/supabase-admin";
import TenantBrowserClient from "./tenant-browser-client";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  // Fetch organizations with their subscription status and counts
  const { data: orgs, error } = await supabaseAdmin
    .from('organizations')
    .select(`
      id,
      name,
      status,
      created_at,
      organization_subscriptions (
        status,
        company_plans (
          name
        )
      ),
      admin_ai_insights (*)
    `)
    .is('admin_ai_insights.resolved_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching organizations:", error);
  }

  // Fetch counts separately for efficiency in this high-fidelity setup
  const { data: counts, error: countError } = await supabaseAdmin
    .rpc('get_org_member_counts');

  const countMap = new Map(counts?.map((c: any) => [c.org_id, c.member_count]) || []);
  
  // Mapping
  const tenants = orgs?.map(org => {
    const sub = (org.organization_subscriptions as any)?.[0];
    const plan = sub?.company_plans?.name || 'No Plan';
    const insights = (org.admin_ai_insights as any[]) || [];
    
    // Determine priority
    const priorities = insights.map(i => i.priority);
    const rawTopPriority = priorities.includes('critical') 
      ? 'critical' 
      : priorities.includes('high') 
        ? 'high' 
        : priorities.includes('medium') 
          ? 'medium' 
          : 'low';
    
    const topPriority = (insights.length > 0 ? rawTopPriority : null) as 'critical' | 'high' | 'medium' | 'low' | null;

    return {
      id: org.id,
      name: org.name,
      status: org.status || 'active',
      plan,
      planStatus: sub?.status || 'inactive',
      memberCount: Number(countMap.get(org.id) || 0),
      createdAt: org.created_at,
      lastActive: null,
      aiInsights: insights,
      topPriority,
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Church Directory</h1>
        <p className="text-slate-400">Manage all registered churches and their system status.</p>
      </div>
      <TenantBrowserClient initialTenants={tenants} />
    </div>
  );
}
