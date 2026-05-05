"use client"

import { useState, KeyboardEvent, useRef } from "react"
import { Paperclip, X, ArrowUp, Mic, MicOff, Volume2 } from "lucide-react"
import type { VoiceState } from "@/hooks/useVoiceConversation"

interface ChurchGPTInputProps {
  onSend: (message: string, sessionType: string, attachment?: { data: string, mimeType: string, name?: string }) => void
  disabled?: boolean
  sessionType: string
  setSessionType: (v: string) => void
  userRole?: 'admin' | 'pastor' | 'leader' | 'member' | 'visitor' | null
  placeholder?: string
  // Voice props — optional; if omitted the mic button is not rendered
  voiceState?: VoiceState
  isVoiceAvailable?: boolean
  onMicPress?: () => void
  onStopSpeaking?: () => void
}

export function ChurchGPTInput({
  onSend,
  disabled,
  sessionType,
  setSessionType,
  userRole,
  placeholder,
  voiceState,
  isVoiceAvailable,
  onMicPress,
  onStopSpeaking,
}: ChurchGPTInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null)

  const sessionOptions =
    userRole === 'admin' || userRole === 'pastor'
      ? [
          'general', 'devotional', 'prayer', 'bible-study', 'apologetics',
          'pastoral', 'grief-support', 'visitor',
          'sermon-planning', 'worship-planning', 'event-planning',
          'stewardship', 'youth-ministry', 'small-group',
          'evangelism-coaching', 'leadership-development', 'admin',
        ]
      : userRole === 'leader'
      ? [
          'general', 'devotional', 'prayer', 'bible-study', 'apologetics',
          'pastoral', 'grief-support', 'small-group',
          'youth-ministry', 'evangelism-coaching', 'leadership-development',
        ]
      : userRole === 'member'
      ? [
          'general', 'devotional', 'prayer', 'bible-study', 'apologetics',
          'pastoral', 'grief-support', 'evangelism-coaching',
        ]
      : ['general', 'prayer', 'bible-study', 'visitor']

  const modeLabel: Record<string, string> = {
    'general': 'General',
    'devotional': 'Devotional',
    'prayer': 'Prayer',
    'bible-study': 'Bible Study',
    'apologetics': 'Apologetics',
    'pastoral': 'Pastoral',
    'grief-support': 'Grief Support',
    'visitor': 'Visitor',
    'admin': 'Admin',
    'sermon-planning': 'Sermon Planning',
    'worship-planning': 'Worship Planning',
    'event-planning': 'Event Planning',
    'stewardship': 'Stewardship',
    'youth-ministry': 'Youth Ministry',
    'small-group': 'Small Group',
    'evangelism-coaching': 'Evangelism',
    'leadership-development': 'Leadership',
  }

  const canSend = (content.trim() || !!selectedFile) && !disabled
  const isListening = voiceState === 'listening'
  const isSpeaking  = voiceState === 'speaking'

  const handleSend = () => {
    if (!canSend) return
    onSend(content.trim(), sessionType, selectedFile || undefined)
    setContent("")
    setSelectedFile(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedFile({ data: (reader.result as string).split(',')[1], mimeType: file.type, name: file.name })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }

  return (
    <div className="cgpt-input-box">
      {/* File preview */}
      {selectedFile && (
        <div className="cgpt-file-preview">
          <span className="cgpt-file-name">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="cgpt-file-remove">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#D4AF37] font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
          Listening… speak now
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2 text-xs text-[#1b3a6b] font-semibold">
            <Volume2 size={13} className="text-[#D4AF37]" />
            ChurchGPT is speaking…
          </div>
          <button
            onClick={onStopSpeaking}
            className="text-[10px] font-bold text-red-500 hover:underline"
          >
            Stop
          </button>
        </div>
      )}

      {/* Textarea row */}
      <div className="cgpt-input-row">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '' : (placeholder ?? "Ask anything…")}
          className="cgpt-textarea"
          rows={1}
          disabled={disabled || isListening}
        />

        {/* Mic button — always shown when onMicPress provided; grayed if unavailable */}
        {onMicPress && !isSpeaking && (
          <div className="relative" style={{ marginRight: 4 }}>
            <button
              type="button"
              onClick={isVoiceAvailable ? onMicPress : undefined}
              disabled={disabled || !isVoiceAvailable}
              title={
                !isVoiceAvailable
                  ? 'Voice not supported in this browser (try Chrome)'
                  : isListening
                  ? 'Stop listening'
                  : 'Speak your message'
              }
              className={`cgpt-send-btn transition-colors ${
                isListening
                  ? 'bg-red-500 text-white active'
                  : isVoiceAvailable
                  ? 'bg-transparent text-[#0f1f3d]/40 hover:text-[#D4AF37]'
                  : 'bg-transparent text-[#0f1f3d]/20 cursor-not-allowed'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            {isVoiceAvailable && !isListening && (
              <span className="absolute -top-1.5 -right-1 text-[6px] font-black bg-green-500 text-white px-0.5 rounded leading-tight pointer-events-none">
                NEW
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`cgpt-send-btn ${canSend ? 'active' : ''}`}
        >
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="cgpt-input-toolbar">
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cgpt-toolbar-chip"
            disabled={disabled}
          >
            <Paperclip size={12} />
            Attach
          </button>
          <span className="absolute -top-1.5 -right-1 text-[6px] font-black bg-[#D4AF37] text-[#0f1f3d] px-0.5 rounded leading-tight pointer-events-none">
            NEW
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx"
        />

        <select
          value={sessionType}
          onChange={e => setSessionType(e.target.value)}
          disabled={disabled}
          className="cgpt-toolbar-chip cgpt-session-select"
        >
          {sessionOptions.map(opt => (
            <option key={opt} value={opt}>
              {modeLabel[opt] ?? opt}
            </option>
          ))}
        </select>
      </div>

      {/* Capability indicator strip */}
      <div className="flex items-center gap-2 px-3 pb-2 flex-wrap">
        <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Features</span>
        <span className="inline-flex items-center gap-0.5 text-[9px] text-[#D4AF37] font-semibold">
          🎤 Voice
          <span className="ml-0.5 text-[6px] font-black bg-green-500 text-white px-1 py-px rounded leading-tight">NEW</span>
        </span>
        <span className="text-[8px] text-slate-300">·</span>
        <span className="text-[9px] text-slate-400 font-medium">📎 DOCX · XLSX · PDF</span>
        <span className="text-[8px] text-slate-300">·</span>
        <span className="text-[9px] text-slate-400 font-medium">📄 Export: Word · PDF · TXT</span>
        <span className="text-[8px] text-slate-300">·</span>
        <span className="text-[9px] text-slate-400 font-medium">17 ministry modes</span>
      </div>
    </div>
  )
}
