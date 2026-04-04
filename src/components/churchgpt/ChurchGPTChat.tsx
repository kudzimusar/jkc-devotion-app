"use client"

import { useState, useRef, useEffect } from "react"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { supabase } from "@/lib/supabase"
import { ChurchGPTMessage } from "./ChurchGPTMessage"
import { ChurchGPTInput } from "./ChurchGPTInput"
import { ChurchGPTSuggestions } from "./ChurchGPTSuggestions"
import { Trash2 } from "lucide-react"

export function ChurchGPTChat({ initialSessionType = 'general' }: { initialSessionType?: string }) {
  const [sessionType, setSessionType] = useState(initialSessionType)
  const [memberProfile, setMemberProfile] = useState<any>(null)
  
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setMemberProfile(profile)
      }
    }
    getProfile()
  }, [])

  const { messages, isLoading, error, sendMessage, clearConversation } = useChurchGPT(sessionType, undefined, memberProfile)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] bg-[#fcfbf9]">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#1b3a6b] text-white text-xs font-bold shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M8 8h8" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1b3a6b] leading-tight">ChurchGPT</h1>
            <p className="text-xs text-gray-500 font-medium">Your Christian AI Companion</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={clearConversation}
            className="flex items-center space-x-2 text-xs text-gray-500 hover:text-red-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-full"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto w-full min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <ChurchGPTSuggestions onSelect={(msg) => sendMessage(msg)} />
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <ChurchGPTMessage key={msg.id} message={msg} />
              ))}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg text-center">
              {error}
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      <footer className="sticky bottom-0 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9] to-transparent pt-6 pb-6 px-4 shrink-0">
        <ChurchGPTInput 
          onSend={(msg, sType) => sendMessage(msg)} 
          disabled={isLoading}
          sessionType={sessionType}
          setSessionType={setSessionType}
        />
        <div className="text-center mt-3 text-[10px] text-gray-400">
          ChurchGPT can make mistakes. Consider verifying important spiritual counsel.
        </div>
      </footer>
    </div>
  )
}
