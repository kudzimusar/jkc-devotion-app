'use client'

import { useState, useRef, useEffect } from "react"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { ChurchGPTMessage } from "@/components/churchgpt/ChurchGPTMessage"
import { ChurchGPTInput } from "@/components/churchgpt/ChurchGPTInput"
import { ChurchGPTSuggestions } from "@/components/churchgpt/ChurchGPTSuggestions"
import { GuestPrompt } from "./GuestPrompt"

export function PublicChurchGPTChat() {
  const [sessionType, setSessionType] = useState('general')
  const [guestCount, setGuestCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage
  } = useChurchGPT(sessionType, undefined, undefined, true)

  useEffect(() => {
    // Initial guest count
    const count = parseInt(localStorage.getItem('churchgpt_guest_count') || '0')
    setGuestCount(count)

    // Listen for storage changes (to sync guest count)
    const handleStorage = () => {
      setGuestCount(parseInt(localStorage.getItem('churchgpt_guest_count') || '0'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Update guest count when messages change
  useEffect(() => {
    const count = parseInt(localStorage.getItem('churchgpt_guest_count') || '0')
    setGuestCount(count)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showSoftPrompt = guestCount === 5 || guestCount === 6
  const showHardPrompt = guestCount >= 7
  const isInputDisabled = showHardPrompt || isLoading

  return (
    <div className="flex flex-col h-[70vh] bg-white border-t border-slate-100">
      {/* Banner */}
      <div className="bg-slate-50 border-b border-slate-100 py-2 px-4 text-center">
        <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed">
          You&apos;re chatting as a guest · <a href="/churchgpt/signup" className="text-[#0f1f3d] font-bold hover:underline decoration-[#D4AF37] decoration-2 underline-offset-2">Sign up</a> to save your conversation history
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
            <div className="mt-8 p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-2xl text-center shadow-sm max-w-lg mx-auto">
              {error}
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-50 py-6 px-4 shrink-0 shadow-[0_-4px_24px_-12px_rgba(15,31,61,0.1)]">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <ChurchGPTInput 
            onSend={(msg, sType) => sendMessage(msg, sType)} 
            disabled={isInputDisabled}
            sessionType={sessionType}
            setSessionType={setSessionType}
          />
          <div className="mt-4 flex flex-col items-center gap-1">
            {guestCount >= 3 && (
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-1">
                {guestCount} of 7 guest messages used
              </p>
            )}
            <p className="text-center text-[10px] text-slate-400 font-medium tracking-wide">
              ChurchGPT can make mistakes · <span className="font-bold text-[#0f1f3d]/40 italic">Ephesians 4:15</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
