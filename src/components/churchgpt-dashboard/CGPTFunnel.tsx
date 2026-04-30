'use client'

type FunnelData = {
  guest_sessions: number
  hit_limit: number
  signups: number
  paid_users: number
  conversion_guest_to_signup: number
  conversion_signup_to_paid: number
}

const STAGES = [
  { key: 'guest_sessions', label: 'Visitors / Guests', color: '#6366f1', desc: 'Anonymous chat sessions' },
  { key: 'hit_limit', label: 'Hit Quota Limit', color: '#f59e0b', desc: 'Reached free message cap' },
  { key: 'signups', label: 'Signed Up (Free)', color: '#8b5cf6', desc: 'Created an account' },
  { key: 'paid_users', label: 'Paid Subscribers', color: '#10b981', desc: 'Active paying users' },
]

export function CGPTFunnel({ funnel }: { funnel: FunnelData }) {
  const max = funnel.guest_sessions || 1

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Conversion Funnel</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Guest → Free → Paid pipeline</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STAGES.map((stage, i) => {
          const value = (funnel as any)[stage.key] ?? 0
          const pct = Math.round((value / max) * 100)
          const dropPct = i > 0
            ? Math.round((1 - value / Math.max((funnel as any)[STAGES[i - 1].key] ?? 1, 1)) * 100)
            : null

          return (
            <div key={stage.key}>
              {dropPct !== null && dropPct > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 8 }}>
                  <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>↓ {dropPct}% drop-off</span>
                </div>
              )}
              <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                border: `1px solid ${stage.color}22`, padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{stage.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stage.desc}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: stage.color }}>{value}</div>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`,
                    borderRadius: 3, transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion rates */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Guest → Signup', value: `${funnel.conversion_guest_to_signup}%`, color: '#8b5cf6' },
          { label: 'Signup → Paid', value: `${funnel.conversion_signup_to_paid}%`, color: '#10b981' },
        ].map(m => (
          <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
