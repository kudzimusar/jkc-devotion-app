import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import TenantDetailsClient from "./tenant-details-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function TenantDetailsPage({ params }: Props) {
  const { id } = await params;

  // Fetch organization details
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select(`
      *,
      organization_subscriptions (
        *,
        company_plans (*)
      ),
      organization_features (*),
      admin_ai_insights (*)
    `)
    .is('admin_ai_insights.resolved_at', null)
    .eq('id', id)
    .single();

  if (orgError || !org) {
    return notFound();
  }

  // Fetch member count
  const { data: memberCountData } = await supabaseAdmin
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', id);

  const memberCount = memberCountData?.length || 0;

  // Fetch recent audit logs for this tenant
  const { data: auditLogs } = await supabaseAdmin
    .from('admin_audit_logs')
    .select(`
      *,
      profiles:admin_id (name, email)
    `)
    .eq('target_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch all plans for the override modal
  const { data: plans } = await supabaseAdmin
    .from('company_plans')
    .select('*')
    .eq('is_active', true);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <TenantDetailsClient 
        org={org} 
        memberCount={memberCount} 
        auditLogs={auditLogs || []}
        plans={plans || []}
      />
    </div>
  );
}
