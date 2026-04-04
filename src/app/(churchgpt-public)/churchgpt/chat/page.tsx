'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { ChurchGPTMessage } from "@/components/churchgpt/ChurchGPTMessage"
import { ChurchGPTInput } from "@/components/churchgpt/ChurchGPTInput"
import { PublicChurchGPTSidebar } from "@/components/churchgpt-public/PublicChurchGPTSidebar"
import { Menu, Search, MoreVertical, Edit2, Loader2 } from "lucide-react"

export default function ChurchGPTAuthenticatedChat() {
  const router = useRouter()
  const [sessionType, setSessionType] = useState('general')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/churchgpt/login')
        return
      }
      setUser(user)
      setAuthLoading(false)
    }
    checkAuth()

    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [router, supabase])

  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearConversation,
    conversations,
    conversationId,
    currentConversation,
    loadMessages,
    deleteConversation
  } = useChurchGPT(sessionType, undefined, undefined, false)

  useEffect(() => {
    if (currentConversation?.session_type) {
      setSessionType(currentConversation.session_type)
    }
  }, [currentConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1f3d]">
        <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]">
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 fixed lg:relative z-50 h-full 
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
      `}>
        <PublicChurchGPTSidebar 
          conversations={conversations}
          activeId={conversationId}
          onSelect={(id) => {
            loadMessages(id)
            if (window.innerWidth < 1024) setIsSidebarOpen(false)
          }}
          onDelete={deleteConversation}
          onNewChat={() => {
            clearConversation()
            if (window.innerWidth < 1024) setIsSidebarOpen(false)
          }}
          isLoading={isLoading}
          user={user}
        />
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-[-1] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#fafafa]">
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-all ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 truncate">
              <h1 className="text-sm font-bold text-[#0f1f3d] leading-tight truncate">
                {currentConversation?.title || "New Chat"}
              </h1>
              <span className="text-xs font-medium text-gray-300">•</span>
              <p className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-widest">
                {sessionType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-[#0f1f3d] hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center pt-20 text-center space-y-4">
                  <span className="text-4xl">✟</span>
                  <p className="text-slate-400 font-medium">How can I help you today?</p>
               </div>
            ) : (
              <div className="space-y-6">
                {messages.map(msg => (
                  <ChurchGPTMessage key={msg.id} message={msg} />
                ))}
              </div>
            )}
            {error && (
              <div className="mt-8 p-4 text-xs font-medium text-red-700 bg-red-100/50 border border-red-200 rounded-xl text-center shadow-sm max-w-lg mx-auto">
                {error}
              </div>
            )}
            <div ref={bottomRef} className="h-10 shrink-0" />
          </div>
        </main>

        <footer className="bg-gradient-to-t from-[#fafafa] via-[#fafafa]/95 to-transparent pt-4 pb-4 px-4 shrink-0">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <ChurchGPTInput 
              onSend={(msg, sType) => sendMessage(msg, sType)} 
              disabled={isLoading}
              sessionType={sessionType}
              setSessionType={setSessionType}
            />
            <p className="text-center mt-4 text-[10px] text-gray-400 font-medium tracking-wide">
              ChurchGPT can make mistakes · <span className="font-bold text-[#0f1f3d]/50 italic">Ephesians 4:15</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
