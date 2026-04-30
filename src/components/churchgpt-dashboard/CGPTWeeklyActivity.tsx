'use client'

type WeeklyPoint = { day: string; messages: number }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CGPTWeeklyActivity({ weekly }: { weekly: WeeklyPoint[] }) {
  const max = Math.max(...weekly.map(p => p.messages), 1)
  const total = weekly.reduce((s, p) => s + p.messages, 0)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Weekly Activity</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Messages per day — last 7 days</p>
      </div>

      {weekly.length === 0 ? (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          Activity will appear here after users send messages
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {weekly.map((p, i) => {
            const pct = max > 0 ? (p.messages / max) * 100 : 0
            const dayLabel = new Date(p.day).toLocaleDateString('en', { weekday: 'short' })
            const isToday = p.day === new Date().toISOString().slice(0, 10)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700, opacity: p.messages > 0 ? 1 : 0 }}>{p.messages}</span>
                <div style={{ width: '100%', height: '80%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(pct, p.messages > 0 ? 8 : 0)}%`,
                    background: isToday
                      ? 'linear-gradient(0deg, #6366f1, #8b5cf6)'
                      : 'linear-gradient(0deg, #6366f144, #8b5cf444)',
                    borderRadius: '4px 4px 0 0',
                    border: isToday ? '1px solid #6366f1' : 'none',
                    transition: 'height 0.6s ease',
                    minHeight: p.messages > 0 ? 4 : 0,
                  }} />
                </div>
                <span style={{ fontSize: 10, color: isToday ? '#6366f1' : 'rgba(255,255,255,0.25)', fontWeight: isToday ? 700 : 400 }}>{dayLabel}</span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'This Week', value: total },
          { label: 'Peak Day', value: max === 1 && total === 0 ? 0 : max },
          { label: 'Avg / Day', value: weekly.length ? Math.round(total / weekly.length) : 0 },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>{m.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
