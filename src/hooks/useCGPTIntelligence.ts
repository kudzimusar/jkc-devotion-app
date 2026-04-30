'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export type CGPTIntelligence = {
  subscribers: any[]
  kpis: any
  funnel: any
  daily_growth: { day: string; interactions: number }[]
  session_modes: Record<string, number>
  weekly_activity: { day: string; messages: number }[]
  avg_session_duration_s: number
  interactions_by_type: any[]
}

export function useCGPTIntelligence() {
  const router = useRouter()
  const [data, setData] = useState<CGPTIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/corporate/login'); return }
      const res = await fetch('/api/super-admin/churchgpt-intelligence', { cache: 'no-store' })
      if (res.status === 401) { router.push('/corporate/login'); return }
      if (!res.ok) throw new Error(`API error ${res.status}`)
      setData(await res.json())
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  return { data, loading, error, refetch: load }
}
