'use client'

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getChurchGPTSupabaseClient } from "@/lib/churchgpt/supabase-client"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { ChurchGPTMessage } from "@/components/churchgpt/ChurchGPTMessage"
import { ChurchGPTInput } from "@/components/churchgpt/ChurchGPTInput"
import { PublicChurchGPTSidebar } from "@/components/churchgpt-public/PublicChurchGPTSidebar"
import { Loader2, PanelLeft, Share2, X, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { useCGPTTheme } from "@/hooks/useCGPTTheme"

// ── Analytics helpers ────────────────────────────────────────────────────────
function genSessionId() {
  return `cgpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
function getDevice() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return 'mobile'
  if (/Tablet|iPad/i.test(ua)) return 'tablet'
  return 'desktop'
}
async function trackSession(payload: Record<string, any>) {
  try {
    await fetch('/api/analytics/churchgpt-track', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch { /* fire-and-forget */ }
}

const SESSION_MODES = [
  { id: 'general',     label: 'Shepherd',    desc: 'General ministry & pastoral guidance',    color: 'oklch(72% 0.14 65)' },
  { id: 'devotional',  label: 'Devotional',  desc: 'Scripture reflections & quiet time',      color: 'oklch(72% 0.14 200)' },
  { id: 'prayer',      label: 'Prayer',      desc: 'Guided intercession & prayer writing',    color: 'oklch(72% 0.14 130)' },
  { id: 'bible-study', label: 'Bible Study', desc: 'Exegesis & deep Scripture study',         color: 'oklch(72% 0.14 290)' },
  { id: 'apologetics', label: 'Apologetics', desc: 'Defending the faith intellectually',      color: 'oklch(72% 0.14 10)' },
  { id: 'pastoral',    label: 'Pastoral',    desc: 'Compassionate care & support',            color: 'oklch(72% 0.14 65)' },
  { id: 'admin',       label: 'Admin',       desc: 'Church operations & planning',            color: 'oklch(72% 0.14 180)' },
]

const SUGGESTIONS = [
  { title: "Plan Sunday's sermon",     body: "Get an outline, scripture references, and talking points" },
  { title: "Study a Bible passage",    body: "Dive deep into context, meaning and application" },
  { title: "Write a prayer",           body: "Craft a prayer for your congregation or a personal need" },
  { title: "Apologetics question",     body: "Get help defending the faith with clarity and grace" },
]

function ChurchGPTAuthenticatedChat() {
  const router = useRouter()
  const [sessionType, setSessionType] = useState('general')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, toggle: toggleTheme } = useCGPTTheme()
  // Analytics refs
  const sessionIdRef = useRef<string>(genSessionId())
  const sessionStartRef = useRef<number>(Date.now())
  const messagesSentRef = useRef<number>(0)

  const supabase = getChurchGPTSupabaseClient()

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user
      if (!user) { router.push('/churchgpt/login'); return }
      setUser(user)
      setAuthLoading(false)
      // Fire page_view session start
      trackSession({
        session_id: sessionIdRef.current,
        user_id: user.id,
        subscription_tier: 'starter', // will be enriched from churchgpt_users in future
        session_type: 'general',
        page_path: '/churchgpt/chat/',
        started_at: new Date(sessionStartRef.current).toISOString(),
        device_type: getDevice(),
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        is_authenticated: true,
      })
    })
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false)

    // Session end tracking on page unload
    const handleEnd = () => {
      const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000)
      trackSession({
        session_id: sessionIdRef.current,
        ended_at: new Date().toISOString(),
        time_on_page_seconds: elapsed,
        messages_sent: messagesSentRef.current,
        session_type: sessionType,
      })
    }
    window.addEventListener('beforeunload', handleEnd)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') handleEnd() })
    return () => window.removeEventListener('beforeunload', handleEnd)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const {
    messages, isLoading, error, sendMessage, clearConversation,
    conversations, conversationId, loadMessages, deleteConversation,
    quotaState, upgradeModal, setUpgradeModal, selectedModel, setSelectedModel,
    availableModels, isPro,
  } = useChurchGPT(sessionType)


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeMode = SESSION_MODES.find(m => m.id === sessionType) ?? SESSION_MODES[0]

  if (authLoading) {
    return (
      <div className="cgpt-loading-screen">
        <Loader2 className="cgpt-loader" />
      </div>
    )
  }

  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div className={`cgpt-shell ${theme === 'light' ? 'cgpt-light' : ''}`}>
      {/* ── Sidebar ── */}
      <div className={`cgpt-sidebar-wrap ${sidebarOpen ? '' : 'cgpt-sidebar-hidden'}`}>
        <PublicChurchGPTSidebar
          conversations={conversations}
          activeId={conversationId}
          onSelect={(id) => { loadMessages(id); if (window.innerWidth < 1024) setSidebarOpen(false) }}
          onDelete={deleteConversation}
          onNewChat={() => { clearConversation(); if (window.innerWidth < 1024) setSidebarOpen(false) }}
          isLoading={isLoading}
          user={user}
        />
      </div>
      {sidebarOpen && (
        <div className="cgpt-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <ConversationHandler authLoading={authLoading} loadMessages={loadMessages} />

      {/* ── Main ── */}
      <div className="cgpt-main">
        {/* Topbar */}
        <div className="cgpt-topbar">
          <button className="cgpt-icon-btn" onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar">
            <PanelLeft size={16} />
          </button>

          {/* Model selector */}
          <div className="cgpt-model-selector-wrap" ref={dropdownRef}>
            <button
              className="cgpt-model-selector"
              onClick={() => setModelDropdownOpen(v => !v)}
            >
              <span className="cgpt-model-dot" style={{ background: activeMode.color }} />
              <span>ChurchGPT · {activeMode.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {modelDropdownOpen && (
              <div className="cgpt-model-dropdown">
                {SESSION_MODES.map(mode => (
                  <button
                    key={mode.id}
                    className={`cgpt-model-option ${sessionType === mode.id ? 'selected' : ''}`}
                    onClick={() => { setSessionType(mode.id); setModelDropdownOpen(false) }}
                  >
                    <span className="cgpt-model-option-dot" style={{ background: mode.color }} />
                    <div className="cgpt-model-option-info">
                      <span className="cgpt-model-option-name">{mode.label}</span>
                      <span className="cgpt-model-option-desc">{mode.desc}</span>
                    </div>
                    {sessionType === mode.id && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="cgpt-topbar-right">
            <button className="cgpt-icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="cgpt-icon-btn" title="Share">
              <Share2 size={15} />
            </button>
            <Link href="/churchgpt/account" className="cgpt-avatar" title="Account">
              {initials}
            </Link>
          </div>
        </div>

        {/* Messages area */}
        <div className="cgpt-messages-wrap">
          <div className="cgpt-messages-inner">
            {messages.length === 0 ? (
              <div className="cgpt-empty-state">
                <h1 className="cgpt-empty-title">
                  How can I <em>serve</em><br />you today?
                </h1>
                <p className="cgpt-empty-sub">
                  Ask me anything about Scripture, ministry, your congregation, or your walk with God.
                </p>
                <div className="cgpt-suggestions">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.title}
                      className="cgpt-suggestion"
                      onClick={() => sendMessage(s.title, sessionType)}
                    >
                      <strong>{s.title}</strong>
                      {s.body}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => <ChurchGPTMessage key={msg.id} message={msg} />)
            )}

            {error && (
              <div className="cgpt-error-banner">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="cgpt-input-area">
          <div className="cgpt-input-inner">
            {/* Pro model override */}
            {isPro && availableModels.length > 0 && (
              <div className="cgpt-model-override">
                <select
                  value={selectedModel ?? ''}
                  onChange={e => setSelectedModel(e.target.value || null)}
                  className="cgpt-model-override-select"
                >
                  <option value="">Auto model</option>
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

            <div className="cgpt-input-footer">
              {quotaState && quotaState.limit > 0 && quotaState.limit < 999999 && (
                <div className="cgpt-quota-row">
                  <div className="cgpt-quota-bar">
                    <div
                      className="cgpt-quota-fill"
                      style={{ width: `${Math.min((quotaState.used / quotaState.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <span>{quotaState.remaining} messages remaining</span>
                </div>
              )}
              <p className="cgpt-footer-hint">
                ChurchGPT · {activeMode.label} may make mistakes. Always verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade modal */}
      {upgradeModal && (
        <div className="cgpt-modal-overlay" onClick={() => setUpgradeModal(null)}>
          <div className="cgpt-modal" onClick={e => e.stopPropagation()}>
            <button className="cgpt-modal-close" onClick={() => setUpgradeModal(null)}>
              <X size={16} />
            </button>
            <div className="cgpt-modal-icon">
              <img src="/cgpt-icons/icon-128x128.png" alt="ChurchGPT" className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="cgpt-modal-title">Monthly limit reached</h2>
            <p className="cgpt-modal-body">{upgradeModal.message}</p>
            <Link href="/churchgpt/upgrade" className="cgpt-modal-cta">
              View upgrade options
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ConversationHandler({ authLoading, loadMessages }: { authLoading: boolean, loadMessages: (id: string) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const loadId = searchParams?.get('load')
    if (loadId && !authLoading) {
      loadMessages(loadId)
      // Clean up the URL without reloading
      router.replace('/churchgpt/chat')
    }
  }, [authLoading, searchParams, loadMessages, router])

  return null
}

export default function ChurchGPTChatPage() {
  return (
    <Suspense fallback={<div className="cgpt-loading-screen"><div className="cgpt-loader" /></div>}>
      <ChurchGPTAuthenticatedChat />
    </Suspense>
  )
}
