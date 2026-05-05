'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useChurchGPT } from "@/hooks/useChurchGPT"
import { useVoiceConversation } from "@/hooks/useVoiceConversation"
import { useCGPTTheme } from "@/hooks/useCGPTTheme"
import { ChurchGPTMessage } from "@/components/churchgpt/ChurchGPTMessage"
import { ChurchGPTInput } from "@/components/churchgpt/ChurchGPTInput"
import { PublicChurchGPTSidebar } from "@/components/churchgpt-public/PublicChurchGPTSidebar"
import { Loader2, PanelLeft, Sun, Moon, X } from "lucide-react"
import Link from "next/link"

const SESSION_MODES = [
  { id: 'general',               label: 'General',       desc: 'Ministry & pastoral guidance',           color: 'oklch(72% 0.14 65)' },
  { id: 'devotional',            label: 'Devotional',    desc: 'Scripture reflections & quiet time',     color: 'oklch(72% 0.14 200)' },
  { id: 'prayer',                label: 'Prayer',        desc: 'Guided intercession & prayer writing',   color: 'oklch(72% 0.14 130)' },
  { id: 'bible-study',           label: 'Bible Study',   desc: 'Exegesis & deep Scripture study',        color: 'oklch(72% 0.14 290)' },
  { id: 'apologetics',           label: 'Apologetics',   desc: 'Defending the faith intellectually',     color: 'oklch(72% 0.14 10)' },
  { id: 'pastoral',              label: 'Pastoral',      desc: 'Compassionate care & support',           color: 'oklch(72% 0.14 65)' },
  { id: 'grief-support',         label: 'Grief Support', desc: 'Walking through loss with grace',        color: 'oklch(72% 0.14 260)' },
  { id: 'visitor',               label: 'Visitor',       desc: 'Welcome & first steps in faith',         color: 'oklch(72% 0.14 85)' },
  { id: 'sermon-planning',       label: 'Sermon',        desc: 'Outlines, texts & preaching resources',  color: 'oklch(72% 0.14 30)' },
  { id: 'worship-planning',      label: 'Worship',       desc: 'Service orders & worship flow',          color: 'oklch(72% 0.14 300)' },
  { id: 'event-planning',        label: 'Events',        desc: 'Church events & logistics',              color: 'oklch(72% 0.14 180)' },
  { id: 'stewardship',           label: 'Stewardship',   desc: 'Giving campaigns & financial health',    color: 'oklch(72% 0.14 150)' },
  { id: 'youth-ministry',        label: 'Youth',         desc: 'Youth lessons & ministry ideas',         color: 'oklch(72% 0.14 50)' },
  { id: 'small-group',           label: 'Small Group',   desc: 'Small group guides & discussion',        color: 'oklch(72% 0.14 220)' },
  { id: 'evangelism-coaching',   label: 'Evangelism',    desc: 'Sharing the faith effectively',          color: 'oklch(72% 0.14 110)' },
  { id: 'leadership-development',label: 'Leadership',    desc: 'Equipping and developing leaders',       color: 'oklch(72% 0.14 240)' },
  { id: 'admin',                 label: 'Admin',         desc: 'Church operations & planning',           color: 'oklch(72% 0.14 180)' },
]

const SUGGESTIONS = [
  { title: "Plan Sunday's sermon",  body: "Get an outline, scripture references, and talking points" },
  { title: "Study a Bible passage", body: "Dive deep into context, meaning and application" },
  { title: "Write a prayer",        body: "Craft a prayer for your congregation or a personal need" },
  { title: "Apologetics question",  body: "Get help defending the faith with clarity and grace" },
]

interface ChurchGPTAuthAppProps {
  loginRedirect?: string
}

export function ChurchGPTAuthApp({ loginRedirect = '/churchgpt/login' }: ChurchGPTAuthAppProps) {
  const router = useRouter()
  const [sessionType, setSessionType] = useState('general')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMessageCount = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, toggle: toggleTheme } = useCGPTTheme()

  const { voiceState, isAvailable: isVoiceAvailable, startListening, stopListening, speak, stopSpeaking } =
    useVoiceConversation(sessionType)

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      const u = res?.data?.user
      if (!u) { router.push(loginRedirect); return }
      setUser(u)
      setAuthLoading(false)
    })
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

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
    if (messages.length > prevMessageCount.current) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && last.content && voiceState !== 'listening') {
        speak(last.content, sessionType)
      }
    }
    prevMessageCount.current = messages.length
  }, [messages])

  async function handleMicPress() {
    if (voiceState === 'listening') { stopListening(); return }
    try {
      const transcript = await startListening()
      if (transcript) sendMessage(transcript, sessionType, undefined, true)
    } catch { /* permission denied */ }
  }

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

      {/* ── Main ── */}
      <div className="cgpt-main">
        {/* Topbar */}
        <div className="cgpt-topbar">
          <button className="cgpt-icon-btn" onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar">
            <PanelLeft size={16} />
          </button>

          {/* Mode selector */}
          <div className="cgpt-model-selector-wrap" ref={dropdownRef}>
            <button className="cgpt-model-selector" onClick={() => setModelDropdownOpen(v => !v)}>
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
            <div className="cgpt-avatar" title={user?.email}>{initials}</div>
          </div>
        </div>

        {/* Messages */}
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

            {error && <div className="cgpt-error-banner">{error}</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="cgpt-input-area">
          <div className="cgpt-input-inner">
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
              voiceState={voiceState}
              isVoiceAvailable={isVoiceAvailable}
              onMicPress={handleMicPress}
              onStopSpeaking={stopSpeaking}
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
            <Link href="/churchgpt/upgrade" className="cgpt-modal-cta">View upgrade options</Link>
          </div>
        </div>
      )}
    </div>
  )
}
