"use client"

import { useState, useRef, useEffect } from "react"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { useVoiceConversation } from "@/hooks/useVoiceConversation"
import { supabase } from "@/lib/supabase"
import { resolveAdminOrgId } from "@/lib/org-resolver"
import { ChurchGPTMessage } from "./ChurchGPTMessage"
import { ChurchGPTInput } from "./ChurchGPTInput"
import { ChurchGPTSuggestions } from "./ChurchGPTSuggestions"
import { ChurchGPTSidebar } from "./ChurchGPTSidebar"
import { Menu, X, ChevronDown, Search, MoreVertical, Edit2, Plus, Trash2 } from "lucide-react"

export function ChurchGPTChat({ 
  initialSessionType = 'general',
  hideSidebar = false
}: { 
  initialSessionType?: string,
  hideSidebar?: boolean
}) {
  const [sessionType, setSessionType] = useState(initialSessionType)
  const [memberProfile, setMemberProfile] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  const [orgName, setOrgName] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(!hideSidebar)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const { voiceState, isAvailable: isVoiceAvailable, startListening, stopListening, speak, stopSpeaking } =
    useVoiceConversation(sessionType)
  
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      let userProfile = null
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setMemberProfile(profile)
        userProfile = profile
      }
      
      const adminCtx = await resolveAdminOrgId()
      const resolvedOrgId = adminCtx?.orgId || userProfile?.org_id
      if (resolvedOrgId) {
        setOrgId(resolvedOrgId)
        const { data: org } = await supabase.from('organizations').select('name').eq('id', resolvedOrgId).single()
        if (org?.name) setOrgName(org.name)
      }
    }
    init()

    // Handle initial sidebar state based on screen width
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [])

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
  } = useChurchGPT(sessionType, orgId, memberProfile)

  useEffect(() => {
    if (currentConversation?.session_type) {
      setSessionType(currentConversation.session_type)
    }
  }, [currentConversation])

  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMessageCount = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

    // Auto-speak the latest assistant reply when a new one arrives
    if (messages.length > prevMessageCount.current) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && last.content && voiceState !== 'listening') {
        speak(last.content, sessionType)
      }
    }
    prevMessageCount.current = messages.length
  }, [messages])

  async function handleMicPress() {
    if (voiceState === 'listening') {
      stopListening()
      return
    }
    try {
      const transcript = await startListening()
      if (transcript) sendMessage(transcript, sessionType, undefined, true)
    } catch {
      // permission denied or STT error — silently ignore
    }
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#fafafa]">
      {/* Sidebar - Contained Drawer on Mobile, Flex Child on Desktop */}
      {!hideSidebar && (
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 absolute lg:relative z-40 h-full 
          transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        `}>
          <ChurchGPTSidebar 
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
            memberProfile={memberProfile}
          />
          {/* Mobile Sidebar Close Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/40 z-[-1] lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#fafafa]">
        {/* Header - Transparent/White Glassmorphism */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-all ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 truncate">
              {isEditingTitle ? (
                <input 
                  type="text" 
                  autoFocus 
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                  defaultValue={currentConversation?.title || "New Chat"}
                  className="bg-transparent border-b border-[#f5a623] focus:outline-none text-sm font-bold text-[#1b3a6b]"
                />
              ) : (
                <div 
                  className="flex items-center space-x-2 cursor-pointer group truncate"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <h1 className="text-sm font-bold text-[#1b3a6b] leading-tight truncate">
                    {currentConversation?.title || "New Chat"}
                  </h1>
                  <span className="text-xs font-medium text-gray-300 group-hover:text-[#f5a623] transition-colors">•</span>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest hidden md:block">
                    {sessionType}
                  </p>
                  <Edit2 className="w-3 h-3 text-gray-200 group-hover:text-gray-400 transition-colors" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hideSidebar && (
              <button 
                onClick={clearConversation}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-lg transition-all"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-lg transition-all hidden sm:block">
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to clear this chat?")) {
                  clearConversation()
                }
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scroll Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
               <ChurchGPTSuggestions onSelect={(msg) => sendMessage(msg, sessionType)} sessionType={sessionType} />
            ) : (
              <div className="space-y-6">
                {messages.map(msg => (
                  <ChurchGPTMessage key={msg.id} message={msg} orgId={orgId} orgName={orgName} />
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

        {/* Footer / Input Bar Area */}
        <footer className="bg-gradient-to-t from-[#fafafa] via-[#fafafa]/95 to-transparent pt-4 pb-4 px-4 shrink-0 transition-all">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <ChurchGPTInput
              onSend={(msg, sType, att) => sendMessage(msg, sType, att)}
              disabled={isLoading}
              sessionType={sessionType}
              setSessionType={setSessionType}
              userRole={memberProfile?.role}
              voiceState={voiceState}
              isVoiceAvailable={isVoiceAvailable}
              onMicPress={handleMicPress}
              onStopSpeaking={stopSpeaking}
            />
            <p className="text-center mt-4 text-[10px] text-gray-400 font-medium tracking-wide">
              ChurchGPT can make mistakes · <span className="font-bold text-[#1b3a6b]/50 italic">Ephesians 4:15</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
