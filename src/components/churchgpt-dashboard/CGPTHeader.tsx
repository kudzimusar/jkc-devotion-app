'use client'
import Link from 'next/link'
import { RefreshCw, ExternalLink, ArrowLeft } from 'lucide-react'

const S: Record<string, React.CSSProperties> = {
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 24px',
    background: 'rgba(5,7,15,0.95)',
    backdropFilter: 'blur(20px)',
    position: 'sticky', top: 0, zIndex: 50,
  },
  inner: {
    maxWidth: 1400, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 64,
  },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  brand: { fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#6366f1' },
  sep: { color: 'rgba(255,255,255,0.2)', fontSize: 18 },
  title: { fontSize: 14, color: '#e2e8f0', fontWeight: 600 },
  badge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: 'rgba(99,102,241,0.15)', color: '#818cf8',
    border: '1px solid rgba(99,102,241,0.3)', letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
    color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, fontSize: 13,
    border: 'none', background: '#6366f1',
    color: '#fff', cursor: 'pointer', fontWeight: 600,
  },
}

export function CGPTHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <header style={S.header}>
      <div style={S.inner}>
        <div style={S.left}>
          <Link href="/corporate/dashboard" style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <span style={S.brand}>Church OS</span>
          <span style={S.sep}>›</span>
          <span style={S.title}>ChurchGPT Intelligence</span>
          <span style={S.badge}>Live</span>
        </div>
        <div style={S.right}>
          <Link href="/super-admin/billing" style={{ ...S.btnSecondary, textDecoration: 'none' } as React.CSSProperties}>
            Billing <ExternalLink size={12} />
          </Link>
          <Link href="https://ai.churchos-ai.website/churchgpt/chat/" target="_blank"
            style={{ ...S.btnSecondary, textDecoration: 'none' } as React.CSSProperties}>
            Live App <ExternalLink size={12} />
          </Link>
          <button style={S.btnPrimary} onClick={onRefresh}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>
    </header>
  )
}
