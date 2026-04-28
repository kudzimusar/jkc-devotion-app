'use client'

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, AlertTriangle, TrendingUp, Users, DollarSign, MessageSquare } from "lucide-react"

interface OrgQuotaHealth {
  org_id: string
  org_name: string
  plan_name: string
  monthly_limit: number
  messages_used: number
  quota_pct_used: number
  cost_usd: number
  renews_at: string | null
}

export default function AdminBillingPage() {
  const [orgs, setOrgs] = useState<OrgQuotaHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_churchgpt_org_quota_health')
        .select('*')
        .order('quota_pct_used', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setOrgs(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalCost = orgs.reduce((sum, o) => sum + (o.cost_usd ?? 0), 0)
  const totalMessages = orgs.reduce((sum, o) => sum + (o.messages_used ?? 0), 0)
  const atRiskOrgs = orgs.filter(o => o.quota_pct_used >= 80).length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f1f3d]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100">
        Error loading billing data: {error}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0f1f3d]">ChurchGPT Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Monthly quota health across all organizations</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={<Users className="w-5 h-5" />} label="Total orgs" value={String(orgs.length)} />
        <SummaryCard icon={<MessageSquare className="w-5 h-5" />} label="Total messages" value={totalMessages.toLocaleString()} />
        <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Total cost (USD)" value={`$${totalCost.toFixed(2)}`} />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          label="At-risk orgs (≥80%)"
          value={String(atRiskOrgs)}
          highlight={atRiskOrgs > 0}
        />
      </div>

      {/* Org table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Organization</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Messages</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Usage</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Cost (USD)</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Renews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orgs.map((org) => {
              const pct = Math.min(org.quota_pct_used ?? 0, 100)
              const isAtRisk = pct >= 80
              const isOver = pct >= 100

              return (
                <tr key={org.org_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0f1f3d]">{org.org_name ?? org.org_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      org.plan_name === 'enterprise' ? 'bg-[#0f1f3d] text-white' :
                      org.plan_name === 'pro' ? 'bg-purple-100 text-purple-700' :
                      org.plan_name === 'lite' ? 'bg-[#D4AF37]/20 text-[#8a6f1a]' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {org.plan_name ?? 'starter'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {(org.messages_used ?? 0).toLocaleString()}
                    {org.monthly_limit > 0 && org.monthly_limit < 999999 && (
                      <span className="text-slate-400"> / {org.monthly_limit.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-red-500' : isAtRisk ? 'bg-amber-400' : 'bg-green-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${isOver ? 'text-red-600' : isAtRisk ? 'text-amber-600' : 'text-slate-500'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">${(org.cost_usd ?? 0).toFixed(4)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {org.renews_at ? new Date(org.renews_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {orgs.length === 0 && (
          <div className="py-16 text-center text-slate-400">No organizations found</div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon, label, value, highlight
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white'}`}>
      <div className={`mt-0.5 ${highlight ? 'text-amber-500' : 'text-slate-400'}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-xl font-bold ${highlight ? 'text-amber-700' : 'text-[#0f1f3d]'}`}>{value}</p>
      </div>
    </div>
  )
}
