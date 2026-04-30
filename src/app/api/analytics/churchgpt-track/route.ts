import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      session_id,
      user_id,
      subscription_tier,
      session_type,
      page_path,
      started_at,
      ended_at,
      time_on_page_seconds,
      messages_sent,
      tokens_used,
      model_used,
      device_type,
      referrer,
      is_authenticated,
      converted_from_guest,
    } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    const service = getServiceClient()

    // Upsert: update if session exists (session_end event), insert if new
    const { error } = await service
      .from('churchgpt_session_analytics')
      .upsert({
        session_id,
        user_id: user_id ?? null,
        subscription_tier: subscription_tier ?? 'guest',
        session_type: session_type ?? 'general',
        page_path: page_path ?? '/churchgpt/chat/',
        started_at: started_at ?? new Date().toISOString(),
        ended_at: ended_at ?? null,
        time_on_page_seconds: time_on_page_seconds ?? 0,
        messages_sent: messages_sent ?? 0,
        tokens_used: tokens_used ?? 0,
        model_used: model_used ?? null,
        device_type: device_type ?? null,
        referrer: referrer ?? null,
        is_authenticated: is_authenticated ?? false,
        converted_from_guest: converted_from_guest ?? false,
      }, {
        onConflict: 'session_id',
      })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[churchgpt-track]', err)
    return NextResponse.json({ error: err.message ?? 'Track failed' }, { status: 500 })
  }
}
