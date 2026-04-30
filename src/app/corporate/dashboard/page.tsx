'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { Brain, Building2, CreditCard, Users, ArrowRight, Shield } from 'lucide-react'

const PRODUCTS = [
  {
    href: '/corporate/churchgpt',
    icon: Brain,
    color: '#6366f1',
    label: 'ChurchGPT Platform',
    desc: 'AI subscriber intelligence, session analytics, conversion funnel & token economics',
    badge: 'Live',
  },
  {
    href: '/super-admin/tenants',
    icon: Building2,
    color: '#06b6d4',
    label: 'Church Tenants',
    desc: 'Manage all church organizations, their members, and ministry data',
    badge: null,
  },
  {
    href: '/super-admin/billing',
    icon: CreditCard,
    color: '#10b981',
    label: 'Billing & Subscriptions',
    desc: 'Revenue overview, org-level quotas, and subscription health',
    badge: null,
  },
  {
    href: '/super-admin/analytics',
    icon: Users,
    color: '#8b5cf6',
    label: 'Platform Analytics',
    desc: 'Cross-tenant metrics, user growth, and church engagement data',
    badge: null,
  },
]

export default function CorporateHubPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/corporate/login')
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#05070f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Fixed noise/glow bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={20} style={{ color: '#6366f1' }} />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#D4AF37' }}>Church OS</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>Corporate</span>
          </div>
          <Link href="/super-admin" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Super Admin Console <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Corporate Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 10, maxWidth: 600 }}>
            Central command for all Church OS products and services. Select a product to manage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {PRODUCTS.map(p => (
            <Link key={p.href} href={p.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${p.color}22`,
                  borderRadius: 16, padding: '28px 28px', cursor: 'pointer',
                  transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${p.color}0a`; el.style.borderColor = `${p.color}55`; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.02)'; el.style.borderColor = `${p.color}22`; el.style.transform = 'translateY(0)' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p.icon size={20} style={{ color: p.color }} />
                  </div>
                  {p.badge && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}44`, letterSpacing: '0.08em' }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>{p.label}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{p.desc}</p>
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 4, color: p.color, fontSize: 13, fontWeight: 600 }}>
                  Open <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
