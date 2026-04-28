"use client"

import { useState, KeyboardEvent, useRef } from "react"
import { Paperclip, X, ArrowUp } from "lucide-react"

interface ChurchGPTInputProps {
  onSend: (message: string, sessionType: string, attachment?: { data: string, mimeType: string, name?: string }) => void
  disabled?: boolean
  sessionType: string
  setSessionType: (v: string) => void
  userRole?: 'admin' | 'pastor' | 'leader' | 'member' | 'visitor' | null
  placeholder?: string
}

export function ChurchGPTInput({ onSend, disabled, sessionType, setSessionType, userRole, placeholder }: ChurchGPTInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null)

  const sessionOptions = userRole === 'admin' || userRole === 'pastor'
    ? ['general', 'devotional', 'prayer', 'bible-study', 'apologetics', 'pastoral', 'admin', 'visitor']
    : userRole === 'member' || userRole === 'leader'
    ? ['general', 'devotional', 'prayer', 'bible-study', 'apologetics', 'pastoral']
    : ['general', 'prayer', 'bible-study', 'visitor']

  const canSend = (content.trim() || !!selectedFile) && !disabled

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

      {/* Textarea row */}
      <div className="cgpt-input-row">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Ask anything…"}
          className="cgpt-textarea"
          rows={1}
          disabled={disabled}
        />
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="cgpt-toolbar-chip"
          disabled={disabled}
        >
          <Paperclip size={12} />
          Attach
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

        <select
          value={sessionType}
          onChange={e => setSessionType(e.target.value)}
          disabled={disabled}
          className="cgpt-toolbar-chip cgpt-session-select"
        >
          {sessionOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt === 'bible-study' ? 'Bible Study' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
