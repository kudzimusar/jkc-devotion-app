'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useChurchGPT } from '@/hooks/useChurchGPT'

const MODES = ['GENERAL', 'PRAYER', 'SCRIPTURE', 'SERMON PREP', 'COUNSELLING']
const MODES_SESSION = ['general', 'prayer', 'scripture', 'sermon', 'counselling']

export default function ChurchGPTLandingPage() {
  const chatRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesWrapRef = useRef<HTMLDivElement>(null)
  const [modeIdx, setModeIdx] = useState(0)
  const [input, setInput] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isDark = theme === 'dark'

  const sessionType = MODES_SESSION[modeIdx]
  const { messages, isLoading, sendMessage, upgradeModal } = useChurchGPT(
    sessionType, undefined, undefined, true
  )

  useEffect(() => {
    if (messagesWrapRef.current) {
      messagesWrapRef.current.scrollTop = messagesWrapRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text, sessionType)
  }, [input, isLoading, sendMessage, sessionType])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 600)
  }

  return (
    <div className={`cgpt-lp-root ${isDark ? 'cgpt-lp-dark' : 'cgpt-lp-light'}`}>

      {/* NAV */}
      <nav className="cgpt-lp-nav">
        <a href="#" className="cgpt-lp-nav-logo">
          <span className="cgpt-lp-nav-cross">
            <svg width="18" height="22" viewBox="0 0 20 24" fill="none">
              <rect x="8.5" y="0" width="3" height="24" fill="currentColor" rx="1.5"/>
              <rect x="0" y="7" width="20" height="3" fill="currentColor" rx="1.5"/>
            </svg>
          </span>
          <span className="cgpt-lp-nav-brand">ChurchGPT</span>
        </a>
        <div className="cgpt-lp-nav-actions">
          <button
            className="cgpt-lp-theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {isDark ? '☀' : '🌙'}
          </button>
          <Link href="/churchgpt/login" className="cgpt-lp-nav-ghost">Sign In</Link>
          <button onClick={scrollToChat} className="cgpt-lp-nav-gold">
            Try Free
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="cgpt-lp-hero">
        <div className="cgpt-lp-hero-inner">
          <div className="cgpt-lp-hero-cross">
            <svg className="cgpt-lp-cross-svg" width="52" height="62" viewBox="0 0 52 62" fill="none">
              <rect x="21.5" y="0" width="9" height="62" fill="#C99B30" rx="4"/>
              <rect x="0" y="18" width="52" height="9" fill="#C99B30" rx="4"/>
            </svg>
          </div>

          <div className="cgpt-lp-eyebrow">
            <span className="cgpt-lp-eyebrow-dot"/>
            Your Christian AI Companion
          </div>

          <h1 className="cgpt-lp-title">ChurchGPT</h1>

          <p className="cgpt-lp-sub">
            The AI that knows the Bible, <strong>loves people</strong>, and never pretends to be neutral about Jesus.
          </p>

          <div className="cgpt-lp-cta-row">
            <button onClick={scrollToChat} className="cgpt-lp-btn-primary">
              Try ChurchGPT Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
            </button>
            <Link href="/churchgpt/login" className="cgpt-lp-btn-secondary">Sign In</Link>
          </div>

          <div className="cgpt-lp-trust">
            <div className="cgpt-lp-trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
              Bible-grounded answers
            </div>
            <div className="cgpt-lp-trust-div"/>
            <div className="cgpt-lp-trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
              Free to start
            </div>
            <div className="cgpt-lp-trust-div"/>
            <div className="cgpt-lp-trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
              No sign-up required
            </div>
          </div>
        </div>

        <div className="cgpt-lp-scroll-hint">
          <span>Start chatting</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9"/></svg>
        </div>
      </section>

      {/* GUEST NOTICE */}
      <div className="cgpt-lp-guest-bar">
        You&apos;re chatting as a guest &nbsp;·&nbsp;{' '}
        <Link href="/churchgpt/signup" className="cgpt-lp-guest-link">Sign up</Link>
        {' '}to save your conversation history
      </div>

      {/* CHAT */}
      <section className="cgpt-lp-chat" ref={chatRef} id="chat">
        <div className="cgpt-lp-messages-wrap" ref={messagesWrapRef}>
          <div className="cgpt-lp-messages-inner">

            {/* Welcome message shown when no conversation yet */}
            {messages.length === 0 && (
              <div className="cgpt-lp-msg-ai">
                <div className="cgpt-lp-ai-avatar">✝</div>
                <div className="cgpt-lp-ai-body">
                  <div className="cgpt-lp-ai-label">ChurchGPT</div>
                  <div className="cgpt-lp-ai-text">
                    Peace be with you. I&apos;m ChurchGPT — an AI companion built to help you explore
                    Scripture, deepen your faith, and grow in your walk with God.<br/><br/>
                    You can ask me about Bible verses, theology, prayer, church history, or anything on
                    your heart. What would you like to explore today?
                  </div>
                  <div className="cgpt-lp-scripture-ref">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    Psalm 119:105
                  </div>
                </div>
              </div>
            )}

            {/* Conversation messages */}
            {messages.map((msg) => (
              msg.role === 'user' ? (
                <div key={msg.id} className="cgpt-lp-msg-user">
                  <div className="cgpt-lp-user-label">You</div>
                  <div className="cgpt-lp-user-bubble">{msg.content}</div>
                </div>
              ) : (
                <div key={msg.id} className="cgpt-lp-msg-ai">
                  <div className="cgpt-lp-ai-avatar">✝</div>
                  <div className="cgpt-lp-ai-body">
                    <div className="cgpt-lp-ai-label">ChurchGPT</div>
                    {msg.content ? (
                      <>
                        <div
                          className="cgpt-lp-ai-text"
                          dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }}
                        />
                        <CopyBtn text={msg.content} />
                      </>
                    ) : (
                      <div className="cgpt-lp-typing"><span/><span/><span/></div>
                    )}
                  </div>
                </div>
              )
            ))}

            {/* Typing indicator */}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="cgpt-lp-msg-ai">
                <div className="cgpt-lp-ai-avatar">✝</div>
                <div className="cgpt-lp-ai-body">
                  <div className="cgpt-lp-ai-label">ChurchGPT</div>
                  <div className="cgpt-lp-typing"><span/><span/><span/></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quota upgrade nudge */}
        {upgradeModal && (
          <div className="cgpt-lp-upgrade-bar">
            <span>{upgradeModal.message}</span>
            <Link href="/churchgpt/upgrade" className="cgpt-lp-upgrade-link">Upgrade →</Link>
          </div>
        )}

        {/* INPUT */}
        <div className="cgpt-lp-input-area">
          <div className="cgpt-lp-input-inner">
            <div className="cgpt-lp-input-box">
              <div className="cgpt-lp-input-row">
                <textarea
                  ref={inputRef}
                  className="cgpt-lp-input-field"
                  placeholder="Ask ChurchGPT anything…"
                  rows={1}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                  }}
                  onKeyDown={handleKey}
                />
                <button
                  className="cgpt-lp-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5,12 12,5 19,12"/>
                  </svg>
                </button>
              </div>
              <div className="cgpt-lp-input-toolbar">
                <button className="cgpt-lp-mode-btn" onClick={() => setModeIdx(i => (i + 1) % MODES.length)}>
                  {MODES[modeIdx]}
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                </button>
              </div>
            </div>
            <div className="cgpt-lp-input-footer">
              ChurchGPT can make mistakes &nbsp;·&nbsp;{' '}
              <a href="https://www.biblegateway.com/passage/?search=Ephesians+4%3A15" target="_blank" rel="noopener noreferrer">
                Ephesians 4:15
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="cgpt-lp-copy-btn"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
