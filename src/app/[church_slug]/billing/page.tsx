'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, MessageSquare, DollarSign, Calendar, TrendingUp, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface OrgUsageSummary {
  plan_name: string
  monthly_limit: number
  messages_used: number
  remaining: number
  cost_usd: number
  quota_pct: number
  renews_at: string | null
}

interface BillingEvent {
  id: string
  event_type: string
  amount_usd: number
  created_at: string
  stripe_event_id: string
}

export default function OrgBillingPage() {
  const params = useParams()
  const router = useRouter()
  const churchSlug = params.church_slug as string

  const [orgId, setOrgId] = useState<string | null>(null)
  const [summary, setSummary] = useState<OrgUsageSummary | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s) { router.push('/churchgpt/login'); return }
      setSession(s)

      // Resolve org from slug
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', churchSlug)
        .single()

      if (!org) { setLoading(false); return }
      setOrgId(org.id)

      // Load summary via RPC
      const { data: sum } = await supabase.rpc('get_org_usage_summary', { p_org_id: org.id })
      if (sum) setSummary(sum)

      // Load billing history
      const { data: events } = await supabase
        .from('churchgpt_billing_events')
        .select('id, event_type, amount_usd, created_at, stripe_event_id')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (events) setBillingHistory(events)
      setLoading(false)
    }
    load()
  }, [churchSlug])

  const handleUpgrade = async (planName: string) => {
    if (!session || !orgId) return
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
          plan_name: planName,
          org_id: orgId,
          user_email: session.user?.email,
        }),
      }
    )
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f1f3d]" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-6 text-slate-500">Could not load billing data for this organization.</div>
    )
  }

  const pct = Math.min(summary.quota_pct ?? 0, 100)
  const isAtRisk = pct >= 80
  const isUnlimited = summary.monthly_limit >= 999999

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1f3d]">ChurchGPT Billing</h1>
          <p className="text-slate-500 text-sm mt-1">Usage and subscription for your church</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${
          summary.plan_name === 'enterprise' ? 'bg-[#0f1f3d] text-white' :
          summary.plan_name === 'pro' ? 'bg-purple-100 text-purple-700' :
          summary.plan_name === 'lite' ? 'bg-[#D4AF37]/20 text-[#8a6f1a]' :
          'bg-slate-100 text-slate-600'
        }`}>
          {summary.plan_name ?? 'Starter'} plan
        </span>
      </div>

      {/* Usage card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-[#0f1f3d]">This month's usage</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat icon={<MessageSquare className="w-4 h-4" />} label="Messages used" value={(summary.messages_used ?? 0).toLocaleString()} />
          <Stat
            icon={<TrendingUp className="w-4 h-4" />}
            label="Remaining"
            value={isUnlimited ? '∞' : (summary.remaining ?? 0).toLocaleString()}
          />
          <Stat icon={<DollarSign className="w-4 h-4" />} label="Cost (USD)" value={`$${(summary.cost_usd ?? 0).toFixed(4)}`} />
        </div>

        {!isUnlimited && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Quota used</span>
              <span className={isAtRisk ? 'font-bold text-amber-600' : ''}>{pct.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : isAtRisk ? 'bg-amber-400' : 'bg-green-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {summary.monthly_limit > 0 && (
              <p className="text-xs text-slate-400 mt-1.5">
                {(summary.messages_used ?? 0).toLocaleString()} / {summary.monthly_limit.toLocaleString()} messages
              </p>
            )}
          </div>
        )}

        {summary.renews_at && (
          <div className="flex items-center gap-2 text-sm text-slate-500 border-t border-slate-50 pt-4">
            <Calendar className="w-4 h-4" />
            Renews on {new Date(summary.renews_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Upgrade / manage */}
      {summary.plan_name !== 'enterprise' && (
        <div className="bg-[#0f1f3d] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white">Upgrade your plan</p>
            <p className="text-white/60 text-sm mt-0.5">Get more messages, church data access, and model choice.</p>
          </div>
          <div className="flex gap-3">
            {summary.plan_name === 'starter' && (
              <button
                onClick={() => handleUpgrade('lite')}
                className="px-5 py-2.5 bg-[#D4AF37] text-[#0f1f3d] text-sm font-bold rounded-xl hover:bg-[#c9a227] transition-colors flex items-center gap-2"
              >
                Upgrade to Lite <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            {summary.plan_name === 'lite' && (
              <button
                onClick={() => handleUpgrade('pro')}
                className="px-5 py-2.5 bg-[#D4AF37] text-[#0f1f3d] text-sm font-bold rounded-xl hover:bg-[#c9a227] transition-colors flex items-center gap-2"
              >
                Upgrade to Pro <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            {summary.plan_name === 'pro' && (
              <a
                href="mailto:hello@churchos-ai.website"
                className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-colors"
              >
                Contact for Enterprise
              </a>
            )}
          </div>
        </div>
      )}

      {/* Billing history */}
      {billingHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-[#0f1f3d]">Billing history</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">Event</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {billingHistory.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-700 capitalize">{ev.event_type.replace('.', ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {ev.amount_usd > 0 ? `$${ev.amount_usd.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(ev.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-[#0f1f3d]">{value}</p>
      </div>
    </div>
  )
}
