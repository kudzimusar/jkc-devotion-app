import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Service-role client that bypasses RLS — used only in authenticated server routes
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function assertSuperAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: role } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['super_admin', 'platform_admin'])
    .single()
  // Also check profiles table fallback
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['super_admin', 'admin'].includes(profile.role ?? '')) return null
  }
  return user
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await assertSuperAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = getServiceClient()

    // ── Parallel data fetch ──────────────────────────────────────────────────
    const [
      subscribersRes,
      kpisRes,
      guestRes,
      interactionsRes,
      sessionAnalyticsRes,
      recentActivityRes,
    ] = await Promise.all([
      // 1. All subscribers with enriched engagement data
      service.from('v_churchgpt_subscriber_intelligence').select('*').order('created_at', { ascending: false }),

      // 2. Platform-wide KPI snapshot
      service.from('v_churchgpt_platform_kpis').select('*').single(),

      // 3. Guest session funnel data
      service.from('churchgpt_guest_sessions')
        .select('id, message_count, limit_reached, first_seen_at, last_seen_at, converted_user_id, converted_at, metadata')
        .order('first_seen_at', { ascending: false })
        .limit(100),

      // 4. Session type breakdown over last 30 days
      service.from('churchgpt_interactions')
        .select('session_type, message_count, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false }),

      // 5. Session analytics
      service.from('churchgpt_session_analytics')
        .select('subscription_tier, session_type, time_on_page_seconds, messages_sent, tokens_used, started_at, device_type')
        .order('started_at', { ascending: false })
        .limit(500),

      // 6. Recent interactions (last 7 days by day)
      service.from('churchgpt_interactions')
        .select('created_at, session_type, message_count')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false }),
    ])

    // ── Build daily conversation growth from interactions as fallback ────────
    const dailyInteractionMap: Record<string, number> = {}
    ;(interactionsRes.data ?? []).forEach((row: any) => {
      const day = row.created_at?.slice(0, 10) ?? ''
      if (day) dailyInteractionMap[day] = (dailyInteractionMap[day] ?? 0) + 1
    })
    const dailyGrowth = Object.entries(dailyInteractionMap)
      .map(([day, count]) => ({ day, interactions: count }))
      .sort((a, b) => a.day.localeCompare(b.day))

    // ── Funnel metrics ───────────────────────────────────────────────────────
    const guests = guestRes.data ?? []
    const funnelData = {
      visitors_est: guests.length + ((subscribersRes.data ?? []).length * 3), // rough visitor estimate
      guest_sessions: guests.length,
      guest_messages: guests.reduce((s: number, g: any) => s + (g.message_count ?? 0), 0),
      hit_limit: guests.filter((g: any) => g.limit_reached).length,
      signups: (subscribersRes.data ?? []).length,
      paid_users: (subscribersRes.data ?? []).filter((u: any) => u.subscription_status === 'active').length,
      conversion_guest_to_signup: guests.length > 0
        ? Math.round(((subscribersRes.data ?? []).length / guests.length) * 100)
        : 0,
      conversion_signup_to_paid: (subscribersRes.data ?? []).length > 0
        ? Math.round(((subscribersRes.data ?? []).filter((u: any) => u.subscription_status === 'active').length / (subscribersRes.data ?? []).length) * 100)
        : 0,
    }

    // ── Session analytics aggregation ────────────────────────────────────────
    const sessions = sessionAnalyticsRes.data ?? []
    const avgSessionDuration = sessions.length > 0
      ? Math.round(sessions.filter((s: any) => s.time_on_page_seconds > 0).reduce((sum: number, s: any) => sum + s.time_on_page_seconds, 0) / (sessions.filter((s: any) => s.time_on_page_seconds > 0).length || 1))
      : 0
    const sessionsByMode: Record<string, number> = {}
    sessions.forEach((s: any) => {
      const m = s.session_type ?? 'general'
      sessionsByMode[m] = (sessionsByMode[m] ?? 0) + 1
    })

    // ── Weekly activity (last 7 days) ────────────────────────────────────────
    const weeklyMap: Record<string, number> = {}
    ;(recentActivityRes.data ?? []).forEach((row: any) => {
      const day = row.created_at?.slice(0, 10) ?? ''
      if (day) weeklyMap[day] = (weeklyMap[day] ?? 0) + (row.message_count ?? 1)
    })
    const weeklyActivity = Object.entries(weeklyMap)
      .map(([day, messages]) => ({ day, messages }))
      .sort((a, b) => a.day.localeCompare(b.day))

    return NextResponse.json({
      subscribers: subscribersRes.data ?? [],
      kpis: kpisRes.data ?? {},
      funnel: funnelData,
      daily_growth: dailyGrowth,
      session_modes: sessionsByMode,
      weekly_activity: weeklyActivity,
      avg_session_duration_s: avgSessionDuration,
      interactions_by_type: interactionsRes.data ?? [],
    })
  } catch (err: any) {
    console.error('[churchgpt-intelligence]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
