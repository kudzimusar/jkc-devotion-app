'use client'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const TIER_COLOR: Record<string, string> = {
  starter: '#6b7280', lite: '#D4AF37', pro: '#3b82f6', enterprise: '#8b5cf6',
}
const TIER_MRR: Record<string, number> = { starter: 0, lite: 29, pro: 79, enterprise: 499 }

function fmtTime(s: number) {
  if (!s || s === 0) return '—'
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })
}

const COLS = ['User', 'Plan', 'Status', 'Conversations', 'Messages', 'Tokens', 'Time on Platform', 'Last Active', 'MRR', 'Joined']

export function CGPTSubscriberTable({ subscribers }: { subscribers: any[] }) {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'message_count' | 'tokens_total'>('created_at')

  const filtered = subscribers
    .filter(u => {
      const matchTier = tier === 'all' || u.subscription_tier === tier
      const q = search.toLowerCase()
      const matchSearch = !q || u.email?.toLowerCase().includes(q) || (u.display_name ?? '').toLowerCase().includes(q)
      return matchTier && matchSearch
    })
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Table header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Individual Subscribers</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>All registered users — free + paid, with full engagement depth</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Search email or name…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 12, width: 200, outline: 'none' }}
          />
          <select value={tier} onChange={e => setTier(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            {['all', 'starter', 'lite', 'pro', 'enterprise'].map(t => <option key={t} value={t}>{t === 'all' ? 'All tiers' : t}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
            <option value="created_at">Sort: Newest</option>
            <option value="message_count">Sort: Most Active</option>
            <option value="tokens_total">Sort: Most Tokens</option>
          </select>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{filtered.length} / {subscribers.length}</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {COLS.map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} style={{ padding: '48px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                  No subscribers match your filters.
                </td>
              </tr>
            ) : filtered.map((u, i) => {
              const tierColor = TIER_COLOR[u.subscription_tier] ?? '#6b7280'
              const isActive = ['active', 'trialing'].includes(u.subscription_status)
              const mrr = isActive ? (TIER_MRR[u.subscription_tier] ?? 0) : 0
              const quotaPct = u.quota_limit > 0 ? Math.min(100, Math.round((u.quota_used / u.quota_limit) * 100)) : 0

              return (
                <tr key={u.id ?? i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* User */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{u.display_name ?? u.email?.split('@')[0]}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{u.email}</div>
                  </td>

                  {/* Plan */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>
                      {u.subscription_tier}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: isActive ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                      {isActive ? '● Active' : u.subscription_status === 'inactive' ? '○ Free' : `○ ${u.subscription_status}`}
                    </span>
                  </td>

                  {/* Conversations */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: u.conversation_count > 0 ? '#e2e8f0' : 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                    {u.conversation_count ?? 0}
                  </td>

                  {/* Messages */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: u.message_count > 0 ? '#8b5cf6' : 'rgba(255,255,255,0.2)', fontWeight: u.message_count > 0 ? 600 : 400 }}>
                      {u.message_count ?? 0}
                    </div>
                    {/* Quota bar */}
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, width: 60, margin: '4px auto 0' }}>
                      <div style={{ height: '100%', width: `${quotaPct}%`, background: quotaPct > 80 ? '#f87171' : '#6366f1', borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{u.quota_used}/{u.quota_limit}</div>
                  </td>

                  {/* Tokens */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: u.tokens_total > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                    {u.tokens_total > 1000 ? `${(u.tokens_total / 1000).toFixed(1)}k` : (u.tokens_total ?? 0)}
                  </td>

                  {/* Time on Platform */}
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                    {fmtTime(u.total_time_seconds)}
                  </td>

                  {/* Last Active */}
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                    {u.last_active_at ? fmtDate(u.last_active_at) : '—'}
                  </td>

                  {/* MRR */}
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: mrr > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                    {mrr > 0 ? `$${mrr}` : '—'}
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                    {u.created_at ? fmtDate(u.created_at) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          All tiers shown — free users are future conversions, not excluded
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Potential MRR if all upgraded to Pro: <strong style={{ color: '#6366f1' }}>${subscribers.length * 79}</strong>
        </span>
      </div>
    </div>
  )
}
