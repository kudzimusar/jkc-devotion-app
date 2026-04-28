'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Check, Star, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 'Free',
    priceNote: 'forever',
    limit: '50 messages/month',
    badge: null,
    features: [
      'ChurchGPT access',
      'Conversation history saved',
      'Basic Christian persona',
      'Public chat',
    ],
    cta: 'Sign up free',
    ctaVariant: 'outline' as const,
    action: 'signup',
  },
  {
    key: 'lite',
    name: 'Lite',
    price: '$29',
    priceNote: '/month',
    limit: '500 messages/month',
    badge: 'Most popular',
    features: [
      'Everything in Starter',
      "Your church's data access",
      'Church-branded persona',
      'Member profile embedding',
      '2× member multiplier',
      '14-day free trial',
    ],
    cta: 'Upgrade to Lite',
    ctaVariant: 'gold' as const,
    action: 'upgrade',
    planName: 'lite',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$79',
    priceNote: '/month',
    limit: '3,000 messages/month',
    badge: null,
    features: [
      'Everything in Lite',
      'Full admin tools (MCP)',
      'Model choice (Claude, Gemini)',
      'Admin analytics dashboard',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaVariant: 'dark' as const,
    action: 'upgrade',
    planName: 'pro',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceNote: '',
    limit: 'Unlimited messages',
    badge: null,
    features: [
      'Unlimited messages',
      'White-label deployment',
      'Custom AI models',
      'SLA + dedicated support',
      'Multi-campus support',
    ],
    cta: 'Contact us',
    ctaVariant: 'outline' as const,
    action: 'contact',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('starter')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)

      if (s?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', s.user.id)
          .single()

        if (profile?.org_id) {
          setOrgId(profile.org_id)
          const { data: sub } = await supabase
            .from('organization_subscriptions')
            .select('company_plans(name)')
            .eq('org_id', profile.org_id)
            .eq('status', 'active')
            .maybeSingle()

          const planName: string = (sub as any)?.company_plans?.name?.toLowerCase() ?? 'starter'
          setCurrentPlan(planName)
        }
      }
    }
    init()
  }, [])

  const handleAction = async (plan: typeof PLANS[number]) => {
    if (plan.action === 'signup') {
      router.push('/churchgpt/signup')
      return
    }
    if (plan.action === 'contact') {
      window.open('mailto:hello@churchos-ai.website', '_blank')
      return
    }

    // Upgrade via Stripe Checkout
    if (!session) {
      router.push('/churchgpt/login?redirect=/churchgpt/upgrade')
      return
    }

    setLoadingPlan(plan.key)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: 'churchgpt_subscription',
            plan_name: (plan as any).planName,
            org_id: orgId,
            user_email: session.user?.email,
          }),
        }
      )

      if (!res.ok) throw new Error('Failed to create checkout session')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1f3d] text-white">
      {/* Header */}
      <header className="border-b border-white/10 py-4 px-6 flex items-center gap-4">
        <Link href="/churchgpt" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to ChurchGPT
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-3">ChurchGPT Plans</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Equip your church<br />with Kingdom AI
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            From a free personal account to a full enterprise deployment. Every plan is built on the same uncompromising Christian foundation.
          </p>
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key
            const isLoading = loadingPlan === plan.key

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                  plan.badge
                    ? 'border-[#D4AF37] bg-white/5 shadow-[0_0_40px_rgba(212,175,55,0.15)]'
                    : 'border-white/10 bg-white/[0.03]'
                } ${isCurrent ? 'ring-2 ring-[#D4AF37]/50' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0f1f3d] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Current plan
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.priceNote && <span className="text-white/50 text-sm">{plan.priceNote}</span>}
                  </div>
                  <p className="text-white/40 text-xs mt-1">{plan.limit}</p>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleAction(plan)}
                  disabled={isLoading || isCurrent}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.ctaVariant === 'gold'
                      ? 'bg-[#D4AF37] text-[#0f1f3d] hover:bg-[#c9a227]'
                      : plan.ctaVariant === 'dark'
                      ? 'bg-white text-[#0f1f3d] hover:bg-white/90'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isCurrent ? 'Current plan' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-10">
          All plans include our unapologetically Christian AI foundation · Cancel anytime
        </p>
      </div>
    </div>
  )
}
