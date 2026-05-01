'use client'

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { ChurchGPTMessage } from "@/components/churchgpt/ChurchGPTMessage"
import { ChurchGPTInput } from "@/components/churchgpt/ChurchGPTInput"
import { ChurchGPTSuggestions } from "@/components/churchgpt/ChurchGPTSuggestions"
import { GuestPrompt } from "./GuestPrompt"
import { X, ArrowUpRight } from "lucide-react"

export function PublicChurchGPTChat() {
  const [sessionType, setSessionType] = useState('general')
  const [guestCount, setGuestCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    quotaState,
    upgradeModal,
    setUpgradeModal,
  } = useChurchGPT(sessionType, undefined, undefined, true)

  useEffect(() => {
    const count = parseInt(localStorage.getItem('churchgpt_guest_count') || '0')
    setGuestCount(count)
    const handleStorage = () => {
      setGuestCount(parseInt(localStorage.getItem('churchgpt_guest_count') || '0'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    const count = parseInt(localStorage.getItem('churchgpt_guest_count') || '0')
    setGuestCount(count)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync guestCount from quotaState when available
  useEffect(() => {
    if (quotaState?.used !== undefined) setGuestCount(quotaState.used)
  }, [quotaState])

  const showSoftPrompt = guestCount === 5 || guestCount === 6
  const showHardPrompt = guestCount >= 7
  const isInputDisabled = showHardPrompt || !!upgradeModal || isLoading

  const GUEST_LIMIT = 7
  const guestRemaining = Math.max(0, GUEST_LIMIT - guestCount)

  return (
    <div className="flex flex-col h-[70vh] bg-white border-t border-slate-100">
      {/* Guest banner */}
      <div className="bg-slate-50 border-b border-slate-100 py-2 px-4 text-center">
        <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed">
          You&apos;re chatting as a guest ·{" "}
          <Link href="/churchgpt/signup" className="text-[#0f1f3d] font-bold hover:underline decoration-[#D4AF37] decoration-2 underline-offset-2">
            Sign up
          </Link>{" "}
          to save your conversation history
        </p>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar relative">
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
          {messages.length === 0 ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
              <ChurchGPTSuggestions onSelect={(msg) => sendMessage(msg, sessionType)} />
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map(msg => (
                <ChurchGPTMessage key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {showSoftPrompt && <GuestPrompt variant="soft" />}
          {showHardPrompt && <GuestPrompt variant="hard" />}

          {error && (
            <div className="mt-8 max-w-lg mx-auto">
              {error === 'service_unavailable' ? (
                <div className="p-6 bg-[#0f1f3d]/5 border border-[#0f1f3d]/10 rounded-2xl text-center space-y-3">
                  <div className="text-2xl">✟</div>
                  <p className="text-sm font-bold text-[#0f1f3d]">ChurchGPT is temporarily unreachable</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Our servers appear to be offline or unreachable right now.
                    Please check your connection and try again in a moment.
                    <br />
                    <span className="italic text-[#D4AF37] font-medium">"Be still, and know that I am God." — Psalm 46:10</span>
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs font-bold text-[#0f1f3d] border border-[#0f1f3d]/20 px-4 py-2 rounded-lg hover:bg-[#0f1f3d]/5 transition-colors"
                  >
                    Refresh and try again
                  </button>
                </div>
              ) : error === 'timeout' ? (
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center space-y-3">
                  <div className="text-2xl">⏳</div>
                  <p className="text-sm font-bold text-amber-800">Response took too long</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    ChurchGPT is taking longer than expected to respond — this sometimes happens
                    under heavy load. Please try sending your message again.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-[#0f1f3d]/5 border border-[#0f1f3d]/10 rounded-2xl text-center space-y-3">
                  <div className="text-2xl">✟</div>
                  <p className="text-sm font-bold text-[#0f1f3d]">Something went wrong on our end</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ChurchGPT encountered an error processing your message.
                    Our team has been notified. Please try again in a few moments.
                  </p>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-50 py-6 px-4 shrink-0 shadow-[0_-4px_24px_-12px_rgba(15,31,61,0.1)]">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
          <ChurchGPTInput
            onSend={(msg, sType) => sendMessage(msg, sType)}
            disabled={isInputDisabled}
            sessionType={sessionType}
            setSessionType={setSessionType}
          />

          {/* Quota bar */}
          <div className="w-full flex flex-col items-center gap-1">
            {guestCount >= 3 && (
              <>
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.15em]">
                  {guestCount} of {GUEST_LIMIT} guest messages used
                </p>
                {guestCount < GUEST_LIMIT && (
                  <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((guestCount / GUEST_LIMIT) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {guestRemaining <= 2 && guestCount < GUEST_LIMIT && (
                  <Link href="/churchgpt/upgrade" className="text-[10px] font-bold text-[#0f1f3d] hover:underline underline-offset-2 flex items-center gap-1">
                    Running low — sign up free for 50 msgs/month <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </>
            )}
            <p className="text-center text-[10px] text-slate-400 font-medium tracking-wide">
              ChurchGPT can make mistakes · <span className="font-bold text-[#0f1f3d]/40 italic">Ephesians 4:15</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Upgrade modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setUpgradeModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="text-3xl mb-3">✟</div>
              <h2 className="text-xl font-bold text-[#0f1f3d] mb-2">
                {upgradeModal.reason === 'guest_limit_reached'
                  ? 'Guest limit reached'
                  : upgradeModal.reason === 'user_quota_exceeded'
                  ? 'Monthly limit reached'
                  : 'Church plan limit reached'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{upgradeModal.message}</p>
            </div>

            <div className="space-y-3">
              {upgradeModal.reason === 'guest_limit_reached' && (
                <>
                  <Link
                    href="/churchgpt/signup"
                    className="block w-full py-3 px-4 bg-[#0f1f3d] text-white text-sm font-bold text-center rounded-xl hover:bg-[#1b3a6b] transition-colors"
                  >
                    Sign up free — 50 messages/month
                  </Link>
                  <Link
                    href="/churchgpt/upgrade"
                    className="block w-full py-3 px-4 border border-[#D4AF37] text-[#0f1f3d] text-sm font-bold text-center rounded-xl hover:bg-[#D4AF37]/10 transition-colors"
                  >
                    See all plans <ArrowUpRight className="inline w-4 h-4" />
                  </Link>
                </>
              )}
              {upgradeModal.reason === 'user_quota_exceeded' && (
                <Link
                  href="/churchgpt/upgrade"
                  className="block w-full py-3 px-4 bg-[#D4AF37] text-[#0f1f3d] text-sm font-bold text-center rounded-xl hover:bg-[#c9a227] transition-colors"
                >
                  Upgrade to Lite — $29/month, 500 messages
                </Link>
              )}
              {upgradeModal.reason === 'org_quota_exceeded' && (
                <Link
                  href="/churchgpt/upgrade"
                  className="block w-full py-3 px-4 bg-[#0f1f3d] text-white text-sm font-bold text-center rounded-xl hover:bg-[#1b3a6b] transition-colors"
                >
                  View upgrade options
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
