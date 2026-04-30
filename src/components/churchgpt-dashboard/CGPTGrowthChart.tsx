'use client'
import { useState } from 'react'

type DailyPoint = { day: string; interactions: number }
type WeeklyPoint = { day: string; messages: number }

function MiniBar({ val, max, color }: { val: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: 48, gap: 2 }}>
      <div style={{ flex: 1, background: `${color}22`, borderRadius: '3px 3px 0 0', position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${pct}%`, transition: 'height 0.6s ease' }} />
      </div>
    </div>
  )
}

export function CGPTGrowthChart({ daily, weekly }: { daily: DailyPoint[]; weekly: WeeklyPoint[] }) {
  const [tab, setTab] = useState<'30d' | '7d'>('30d')
  const points = tab === '30d' ? daily : weekly
  const valueKey = tab === '30d' ? 'interactions' : 'messages'
  const maxVal = Math.max(...points.map((p: any) => p[valueKey] ?? 0), 1)
  const color = tab === '30d' ? '#6366f1' : '#8b5cf6'

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    border: 'none', cursor: 'pointer',
    background: active ? color : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.35)',
  })

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Platform Activity</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
            {tab === '30d' ? 'Daily interaction count — last 30 days' : 'Daily messages — last 7 days'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
          <button style={tabStyle(tab === '30d')} onClick={() => setTab('30d')}>30 Days</button>
          <button style={tabStyle(tab === '7d')} onClick={() => setTab('7d')}>7 Days</button>
        </div>
      </div>

      {points.length === 0 ? (
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
          No data yet — activity will appear here as users engage
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
            {points.map((p: any, i: number) => {
              const val = p[valueKey] ?? 0
              const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
              return (
                <div key={i} title={`${p.day}: ${val}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', cursor: 'pointer' }}>
                  <div style={{ width: '100%', background: `${color}33`, borderRadius: '3px 3px 0 0', position: 'relative' }}>
                    <div style={{ width: '100%', height: `${pct}%` }} />
                  </div>
                  <div style={{
                    width: '100%', background: `linear-gradient(0deg, ${color}, ${color}88)`,
                    borderRadius: '3px 3px 0 0', height: `${Math.max(pct * 1.2, 4)}%`,
                    minHeight: val > 0 ? 4 : 0, transition: 'height 0.5s ease'
                  }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {[points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].map((p: any, i) => (
              <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                {p?.day?.slice(5) ?? ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Total', value: points.reduce((s: number, p: any) => s + (p[valueKey] ?? 0), 0) },
          { label: 'Peak Day', value: maxVal },
          { label: 'Avg / Day', value: points.length ? Math.round(points.reduce((s: number, p: any) => s + (p[valueKey] ?? 0), 0) / points.length) : 0 },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
