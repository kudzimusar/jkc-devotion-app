'use client'
import { useCGPTIntelligence } from '@/hooks/useCGPTIntelligence'
import { CGPTHeader } from '@/components/churchgpt-dashboard/CGPTHeader'
import { CGPTKPIRow } from '@/components/churchgpt-dashboard/CGPTKPIRow'
import { CGPTFunnel } from '@/components/churchgpt-dashboard/CGPTFunnel'
import { CGPTGrowthChart } from '@/components/churchgpt-dashboard/CGPTGrowthChart'
import { CGPTModesChart } from '@/components/churchgpt-dashboard/CGPTModesChart'
import { CGPTSubscriberTable } from '@/components/churchgpt-dashboard/CGPTSubscriberTable'
import { CGPTWeeklyActivity } from '@/components/churchgpt-dashboard/CGPTWeeklyActivity'
import { Loader2, AlertTriangle } from 'lucide-react'

export default function ChurchGPTDashboardPage() {
  const { data, loading, error, refetch } = useCGPTIntelligence()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 style={{ width: 36, height: 36, color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading ChurchGPT Intelligence…</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '24px 32px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertTriangle style={{ color: '#f87171', width: 20, height: 20 }} />
        <div>
          <p style={{ color: '#f87171', fontWeight: 600, marginBottom: 4 }}>Failed to load</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{error}</p>
          <button onClick={refetch} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Retry</button>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  return (
    <div style={{ minHeight: '100vh', background: '#05070f', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <CGPTHeader onRefresh={refetch} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 48px' }}>
        {/* KPI Cards */}
        <CGPTKPIRow kpis={data.kpis} funnel={data.funnel} avgSession={data.avg_session_duration_s} />

        {/* Funnel + Growth */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, marginTop: 24 }}>
          <CGPTFunnel funnel={data.funnel} />
          <CGPTGrowthChart daily={data.daily_growth} weekly={data.weekly_activity} />
        </div>

        {/* Modes + Weekly Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <CGPTModesChart modes={data.session_modes} />
          <CGPTWeeklyActivity weekly={data.weekly_activity} />
        </div>

        {/* Full Subscriber Table */}
        <div style={{ marginTop: 20 }}>
          <CGPTSubscriberTable subscribers={data.subscribers} />
        </div>
      </div>
    </div>
  )
}
