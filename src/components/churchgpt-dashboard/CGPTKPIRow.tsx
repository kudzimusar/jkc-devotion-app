'use client'
import { Users, MessageSquare, Zap, Clock, TrendingUp, DollarSign, Activity, UserCheck } from 'lucide-react'

const TIER_MRR: Record<string, number> = { starter: 0, lite: 29, pro: 79, enterprise: 499 }

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }
function fmtTime(s: number) {
  if (!s || s === 0) return '—'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60); const sec = s % 60
  return `${m}m ${sec}s`
}

function KPI({ label, value, sub, icon: Icon, color, accent }:
  { label: string; value: string | number; sub?: string; icon: any; color: string; accent: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}22`,
      borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export function CGPTKPIRow({ kpis, funnel, avgSession }: { kpis: any; funnel: any; avgSession: number }) {
  const totalTokens = kpis.total_tokens_used ?? 0
  const mrr = kpis.mrr_usd ?? 0
  const totalUsers = kpis.total_registered_users ?? 0
  const guestSessions = kpis.total_guest_sessions ?? 0
  const totalMessages = kpis.total_messages ?? 0
  const totalConvos = kpis.total_conversations ?? 0
  const convRate = funnel.conversion_guest_to_signup ?? 0

  const cards = [
    { label: 'Registered Users', value: totalUsers, sub: `${guestSessions} guest sessions`, icon: Users, color: '#e2e8f0', accent: '#6366f1' },
    { label: 'Total Conversations', value: totalConvos, sub: `${fmt(totalMessages)} messages sent`, icon: MessageSquare, color: '#e2e8f0', accent: '#8b5cf6' },
    { label: 'Tokens Consumed', value: fmt(totalTokens), sub: totalTokens === 0 ? 'tracking starts now' : 'lifetime platform usage', icon: Zap, color: '#fbbf24', accent: '#f59e0b' },
    { label: 'Avg Session Time', value: fmtTime(avgSession), sub: 'per chat session', icon: Clock, color: '#e2e8f0', accent: '#06b6d4' },
    { label: 'Monthly Revenue', value: `$${mrr}`, sub: mrr === 0 ? 'free tier only' : 'est. MRR', icon: DollarSign, color: mrr > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)', accent: '#10b981' },
    { label: 'Paid Users', value: kpis.paid_users ?? 0, sub: `${kpis.free_users ?? 0} on free tier`, icon: UserCheck, color: '#e2e8f0', accent: '#ec4899' },
    { label: 'Guest→Signup Rate', value: `${convRate}%`, sub: `${funnel.hit_limit ?? 0} hit quota limit`, icon: TrendingUp, color: convRate > 10 ? '#4ade80' : '#fbbf24', accent: '#f97316' },
    { label: 'Platform Activity', value: kpis.total_sessions_tracked ?? 0, sub: 'sessions tracked', icon: Activity, color: '#e2e8f0', accent: '#3b82f6' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, paddingTop: 28 }}>
      {cards.map(c => <KPI key={c.label} {...c} />)}
    </div>
  )
}
