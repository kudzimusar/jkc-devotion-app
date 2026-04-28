'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { ChurchGPTMessage } from "@/components/churchgpt/ChurchGPTMessage"
import { ChurchGPTInput } from "@/components/churchgpt/ChurchGPTInput"
import { PublicChurchGPTSidebar } from "@/components/churchgpt-public/PublicChurchGPTSidebar"
import { Menu, Search, MoreVertical, Edit2, Loader2, Trash2, Plus } from "lucide-react"

export default function ChurchGPTAuthenticatedChat() {
  const router = useRouter()
  const [sessionType, setSessionType] = useState('general')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("New Chat")
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
    deleteConversation,
    renameConversation,
    quotaState,
    upgradeModal,
    setUpgradeModal,
    selectedModel,
    setSelectedModel,
    availableModels,
    isPro,
  } = useChurchGPT(sessionType)

  useEffect(() => {
    if (currentConversation) {
      setEditedTitle(currentConversation.title || "New Chat")
    }
  }, [currentConversation])

  const handleRename = async () => {
    if (conversationId && editedTitle.trim()) {
      await renameConversation(conversationId, editedTitle)
      setIsEditingTitle(false)
    }
  }

  const handleDelete = async () => {
    if (conversationId && window.confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(conversationId)
    }
  }

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
    <div className="relative flex h-screen overflow-hidden bg-[#fafafa]">
      {/* Sidebar - Contained Drawer on Mobile, Flex Child on Desktop */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 absolute lg:relative z-40 h-full 
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
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 truncate">
              {isEditingTitle && conversationId ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                  className="text-sm font-bold text-[#0f1f3d] bg-gray-50 border-none focus:ring-0 rounded p-1 w-full max-w-[200px]"
                />
              ) : (
                <div 
                  className={`flex items-center space-x-2 ${conversationId ? 'cursor-pointer group' : ''}`}
                  onClick={() => conversationId && setIsEditingTitle(true)}
                >
                  <h1 className="text-sm font-bold text-[#0f1f3d] leading-tight truncate">
                    {currentConversation?.title || "New Chat"}
                  </h1>
                  {conversationId && <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
              )}
              <span className="text-xs font-medium text-gray-300">•</span>
              <p className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-widest">
                {sessionType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                clearConversation()
              }}
              className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-lg transition-all"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-lg transition-all hidden sm:block"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="relative group/menu">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-[60] py-1 overflow-hidden">
                <button 
                  onClick={() => setIsEditingTitle(true)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename Chat</span>
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Chat</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button 
                  onClick={() => {
                    clearConversation()
                    setIsSidebarOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-[#1b3a6b] hover:bg-gray-50 font-medium"
                >
                  New Chat
                </button>
              </div>
            </div>
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
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
            {/* Pro model selector */}
            {isPro && availableModels.length > 0 && (
              <div className="self-end">
                <select
                  value={selectedModel ?? ''}
                  onChange={(e) => setSelectedModel(e.target.value || null)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#0f1f3d]"
                >
                  <option value="">Auto (default model)</option>
                  {availableModels.map((m: any) => (
                    <option key={m.model_id} value={m.model_id}>{m.display_name}</option>
                  ))}
                </select>
              </div>
            )}

            <ChurchGPTInput
              onSend={(msg, sType, att) => sendMessage(msg, sType, att)}
              disabled={isLoading}
              sessionType={sessionType}
              setSessionType={setSessionType}
            />

            <div className="flex flex-col items-center gap-1 w-full">
              {/* Quota bar for non-unlimited plans */}
              {quotaState && quotaState.limit > 0 && quotaState.limit < 999999 && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D4AF37] rounded-full"
                      style={{ width: `${Math.min((quotaState.used / quotaState.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <span>{quotaState.remaining} messages remaining</span>
                </div>
              )}
              <p className="text-center text-[10px] text-gray-400 font-medium tracking-wide">
                ChurchGPT can make mistakes · <span className="font-bold text-[#0f1f3d]/50 italic">Ephesians 4:15</span>
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
                ✕
              </button>
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">✟</div>
                <h2 className="text-xl font-bold text-[#0f1f3d] mb-2">Monthly limit reached</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{upgradeModal.message}</p>
              </div>
              <a
                href="/churchgpt/upgrade"
                className="block w-full py-3 px-4 bg-[#D4AF37] text-[#0f1f3d] text-sm font-bold text-center rounded-xl hover:bg-[#c9a227] transition-colors"
              >
                View upgrade options
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
