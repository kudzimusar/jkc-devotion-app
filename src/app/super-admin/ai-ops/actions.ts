import { supabase } from "@/lib/supabase";

async function getAdminUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: role } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (role?.role !== 'super_admin') throw new Error("Access denied");
  return user;
}

export async function createBroadcast(data: {
  title: string;
  message: string;
  target_type: 'all' | 'plan' | 'selected';
  target_metadata: any;
  scheduled_at?: string;
}) {
  try {
    const admin = await getAdminUser();

    const { data: broadcast, error } = await supabase
      .from('platform_broadcasts')
      .insert({
        title: data.title,
        message: data.message,
        target_type: data.target_type,
        target_metadata: data.target_metadata,
        scheduled_at: data.scheduled_at || new Date().toISOString(),
        created_by: admin.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        action: 'create_broadcast',
        target_type: 'broadcast',
        target_id: broadcast.id,
        metadata: { target: data.target_type }
      });

    // If immediate, trigger dispatcher
    if (!data.scheduled_at || new Date(data.scheduled_at) <= new Date()) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      // Fire and forget fetch
      fetch(`${supabaseUrl}/functions/v1/dispatch-broadcasts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      }).catch(e => console.error("Dispatcher trigger failed:", e));
    }

    return { success: true, broadcast };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBroadcastStats(broadcastId: string) {
  try {
    await getAdminUser();

    const { data: receipts } = await supabase
      .from('broadcast_receipts')
      .select('is_read')
      .eq('broadcast_id', broadcastId);

    const total = receipts?.length || 0;
    const read = receipts?.filter(r => r.is_read).length || 0;

    return { 
      total, 
      read, 
      openRate: total > 0 ? (read / total) * 100 : 0 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function forceReaggregateAnalytics() {
  try {
    await getAdminUser();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${supabaseUrl}/functions/v1/daily-analytics-aggregator`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    if (!response.ok) throw new Error("Failed to trigger aggregation");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
