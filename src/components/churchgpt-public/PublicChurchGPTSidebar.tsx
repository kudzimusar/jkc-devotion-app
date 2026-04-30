'use client'

import { useState, useMemo, useEffect } from "react"
import { Plus, Trash2, Settings, User, LogOut } from "lucide-react"
import { ChurchGPTConversation } from "@/hooks/useChurchGPT"
import { isToday, isYesterday, isThisWeek } from "date-fns"
import { useRouter } from "next/navigation"
import { getChurchGPTSupabaseClient } from "@/lib/churchgpt/supabase-client"
import Link from "next/link"

interface PublicChurchGPTSidebarProps {
  conversations: ChurchGPTConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  isLoading?: boolean
  user: any
}

export function PublicChurchGPTSidebar({
  conversations: conversationsProp,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  isLoading = false,
  user
}: PublicChurchGPTSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selfConversations, setSelfConversations] = useState<ChurchGPTConversation[]>([])
  const router = useRouter()
  const supabase = getChurchGPTSupabaseClient()

  // When the sidebar is rendered on pages that pass no conversations (e.g. Account, Settings),
  // load them directly so history is always visible.
  useEffect(() => {
    if (conversationsProp.length > 0) return  // already provided by parent
    const load = async () => {
      const res: any = await supabase.auth.getUser()
      const uid = res?.data?.user?.id
      if (!uid) return
      const { data } = await supabase
        .from('churchgpt_conversations')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
      if (data) setSelfConversations(data)
    }
    load()
  }, [conversationsProp.length])

  const conversations = conversationsProp.length > 0 ? conversationsProp : selfConversations

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/churchgpt')
  }

  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase()

  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter(c =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const groups: Record<string, ChurchGPTConversation[]> = {
      Today: [], Yesterday: [], 'This Week': [], Older: []
    }
    filtered.forEach(convo => {
      const d = new Date(convo.updated_at)
      if (isToday(d)) groups.Today.push(convo)
      else if (isYesterday(d)) groups.Yesterday.push(convo)
      else if (isThisWeek(d)) groups['This Week'].push(convo)
      else groups.Older.push(convo)
    })
    return Object.entries(groups).filter(([, items]) => items.length > 0)
  }, [conversations, searchQuery])

  return (
    <aside className="cgpt-sidebar">
      {/* Logo — clicking navigates back to the main chat */}
      <Link href="/churchgpt/chat" className="cgpt-sidebar-logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <div className="cgpt-logo-mark">✝</div>
        <span className="cgpt-logo-text">ChurchGPT</span>
      </Link>

      {/* New conversation */}
      <div className="cgpt-sidebar-section">
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="cgpt-new-btn"
        >
          <Plus size={14} strokeWidth={2} />
          New conversation
        </button>
      </div>

      {/* Conversation list */}
      <div className="cgpt-conv-scroll">
        {groupedConversations.map(([group, items]) => (
          <div key={group} className="cgpt-conv-group">
            <div className="cgpt-conv-group-label">{group.toUpperCase()}</div>
            {items.map(convo => (
              <div
                key={convo.id}
                className={`cgpt-conv-item ${activeId === convo.id ? 'active' : ''}`}
                onClick={() => onSelect(convo.id)}
              >
                <span className="cgpt-conv-title">{convo.title || 'New Conversation'}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(convo.id) }}
                  className="cgpt-conv-delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="cgpt-conv-empty">No conversations yet</div>
        )}
      </div>

      {/* Footer nav */}
      <div className="cgpt-sidebar-footer">
        <Link href="/churchgpt/settings" className="cgpt-footer-item">
          <Settings size={15} strokeWidth={1.8} />
          Settings
        </Link>
        <Link href="/churchgpt/account" className="cgpt-footer-item">
          <User size={15} strokeWidth={1.8} />
          Account
        </Link>
        <div className="cgpt-sidebar-user">
          <div className="cgpt-user-avatar">{initials}</div>
          <div className="cgpt-user-info">
            <span className="cgpt-user-email">{user?.email?.split('@')[0] ?? 'User'}</span>
            <span className="cgpt-user-sub">ChurchGPT</span>
          </div>
          <button onClick={handleSignOut} className="cgpt-signout" title="Sign out">
            <LogOut size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  )
}
