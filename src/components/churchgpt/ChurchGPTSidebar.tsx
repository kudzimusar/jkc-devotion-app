"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical
} from "lucide-react"
import { ChurchGPTConversation } from "@/hooks/useChurchGPT"
import { format, isToday, isYesterday, isThisWeek, subDays } from "date-fns"

interface ChurchGPTSidebarProps {
  conversations: ChurchGPTConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  isLoading?: boolean
  memberProfile?: any
}

export function ChurchGPTSidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  isLoading = false,
  memberProfile
}: ChurchGPTSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter(c => 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const groups: Record<string, ChurchGPTConversation[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: []
    }

    filtered.forEach(convo => {
      const date = new Date(convo.updated_at)
      if (isToday(date)) groups.Today.push(convo)
      else if (isYesterday(date)) groups.Yesterday.push(convo)
      else if (isThisWeek(date)) groups["This Week"].push(convo)
      else groups.Older.push(convo)
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }, [conversations, searchQuery])

  if (isCollapsed) {
    return (
      <aside className="w-16 flex-shrink-0 bg-[#0f1f3d] flex flex-col items-center py-4 transition-all duration-300 border-r border-white/5">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-white/60 hover:text-white mb-6"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="text-[#f5a623] text-xl font-bold mb-8">✟</div>
        <button 
          onClick={onNewChat}
          className="w-10 h-10 flex items-center justify-center bg-[#1b3a6b] text-white rounded-lg hover:bg-[#2a4d8a] mb-4"
        >
          <Plus className="w-5 h-5 text-[#f5a623]" />
        </button>
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center space-y-4">
          {conversations.slice(0, 5).map(c => (
            <div 
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                activeId === c.id ? "bg-[#f5a623]/20 border-l-2 border-[#f5a623]" : "hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-white/60" />
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-white/5 w-full flex flex-col items-center space-y-4">
          <Settings className="w-5 h-5 text-white/40 hover:text-white/80 cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-[#1b3a6b] flex items-center justify-center text-[10px] font-bold text-white border border-white/10 uppercase">
            {memberProfile?.name?.charAt(0) || "U"}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-[280px] flex-shrink-0 bg-[#0f1f3d] flex flex-col h-full overflow-hidden transition-all duration-300">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-[#f5a623] text-xl font-bold">✟</span>
          <h1 className="text-white text-lg tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>ChurchGPT</h1>
        </div>
        <button 
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-white/40 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center space-x-2 bg-[#1b3a6b] hover:bg-[#23457a] text-white rounded-lg transition-all border border-white/5 shadow-lg group"
        >
          <Plus className="w-4 h-4 text-[#f5a623] group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 group-focus-within:text-[#f5a623] transition-colors" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-md pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f5a623]/50 focus:bg-white/10 transition-all font-sans"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-hide pb-4">
        {groupedConversations.map(([group, items]) => (
          <div key={group} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-2">
              {group}
            </h3>
            {items.map((convo) => (
              <div
                key={convo.id}
                className={`group relative flex items-center p-2.5 rounded-lg cursor-pointer transition-all ${
                  activeId === convo.id
                    ? "bg-[#f5a623]/15 border-l-[3px] border-[#f5a623] shadow-inner"
                    : "hover:bg-white/5 border-l-[3px] border-transparent"
                }`}
                onClick={() => onSelect(convo.id)}
              >
                <MessageSquare className={`w-3.5 h-3.5 mr-3 flex-shrink-0 ${
                  activeId === convo.id ? "text-[#f5a623]" : "text-white/40"
                }`} />
                
                <span className={`text-[13px] truncate flex-1 leading-tight font-sans ${
                  activeId === convo.id ? "text-[#e8e8e8] font-medium" : "text-white/60"
                }`}>
                  {convo.title || "New Conversation"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(convo.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Profile Section */}
      <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1b3a6b] to-[#2a4d8a] flex items-center justify-center text-white text-[10px] font-bold border border-white/20 shrink-0">
            {memberProfile?.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#e8e8e8] truncate">
              {memberProfile?.name || "User"}
            </p>
            <p className="text-[10px] text-white/40 truncate">Tokyo Grace Community</p>
          </div>
        </div>
        <button className="p-1.5 text-white/30 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
