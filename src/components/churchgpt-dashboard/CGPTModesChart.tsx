'use client'

const MODE_META: Record<string, { label: string; color: string; icon: string }> = {
  general:      { label: 'Shepherd',    color: '#6366f1', icon: '🕊' },
  devotional:   { label: 'Devotional',  color: '#06b6d4', icon: '📖' },
  prayer:       { label: 'Prayer',      color: '#10b981', icon: '🙏' },
  'bible-study':{ label: 'Bible Study', color: '#8b5cf6', icon: '✝' },
  apologetics:  { label: 'Apologetics', color: '#f59e0b', icon: '🛡' },
  pastoral:     { label: 'Pastoral',    color: '#ec4899', icon: '💙' },
  admin:        { label: 'Admin',       color: '#64748b', icon: '⚙' },
}

export function CGPTModesChart({ modes }: { modes: Record<string, number> }) {
  const entries = Object.entries(modes).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Session Modes</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>How users engage with ChurchGPT</p>
      </div>

      {entries.length === 0 ? (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          Mode data will appear as users chat
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(([mode, count]) => {
            const meta = MODE_META[mode] ?? { label: mode, color: '#6366f1', icon: '●' }
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={mode}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{meta.icon}</span>{meta.label}
                  </span>
                  <span style={{ fontSize: 12, color: meta.color, fontWeight: 700 }}>{count} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width 0.7s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Total interactions tracked</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{total}</span>
      </div>
    </div>
  )
}
