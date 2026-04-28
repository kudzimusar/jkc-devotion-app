'use client'

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Give Stripe webhook 2s to process before showing confirmation
    const t = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1f3d] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
        {loading ? (
          <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37] mx-auto mb-4" />
        ) : (
          <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-bold text-white mb-2">
          {loading ? 'Processing…' : 'Subscription confirmed!'}
        </h1>
        <p className="text-white/60 text-sm mb-8">
          {loading
            ? 'Activating your plan…'
            : 'Your ChurchGPT plan is now active. Go ahead and start a conversation — your new quota is ready.'}
        </p>
        {!loading && (
          <Link
            href="/churchgpt/chat"
            className="inline-block px-6 py-3 bg-[#D4AF37] text-[#0f1f3d] font-bold rounded-xl hover:bg-[#c9a227] transition-colors"
          >
            Start chatting
          </Link>
        )}
      </div>
    </div>
  )
}
