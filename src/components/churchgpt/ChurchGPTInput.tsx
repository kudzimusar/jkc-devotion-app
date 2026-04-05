"use client"

import { useState, KeyboardEvent, useRef } from "react"
import { Send, Mic, ChevronDown, Paperclip } from "lucide-react"

interface ChurchGPTInputProps {
  onSend: (message: string, sessionType: string) => void
  disabled?: boolean
  sessionType: string
  setSessionType: (v: string) => void
  userRole?: 'admin' | 'pastor' | 'leader' | 'member' | 'visitor' | null
}

export function ChurchGPTInput({ onSend, disabled, sessionType, setSessionType, userRole }: ChurchGPTInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Session options based on role
  const sessionOptions = userRole === 'admin' || userRole === 'pastor'
    ? ['general', 'devotional', 'prayer', 'bible-study', 'apologetics', 'pastoral', 'admin', 'visitor']
    : userRole === 'member' || userRole === 'leader'
    ? ['general', 'devotional', 'prayer', 'bible-study', 'apologetics', 'pastoral']
    : ['general', 'prayer', 'bible-study', 'visitor'] // unauthenticated / external

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim(), sessionType)
      setContent("")
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-white border-2 border-[#e8e8e8] rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-[#f5a623]/20 focus-within:border-[#f5a623]/40 transition-all p-3 flex flex-col space-y-3">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask ChurchGPT anything..."
        className="w-full resize-none bg-transparent px-2 pt-1 pb-1 text-gray-800 focus:outline-none min-h-[48px] text-[15px] font-sans scrollbar-hide"
        rows={1}
        disabled={disabled}
      />
      
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center space-x-2">
          {/* Custom Styled Select Overlay */}
          <div className="relative group">
            <select 
              value={sessionType}
              onChange={e => setSessionType(e.target.value)}
              disabled={disabled}
              className="appearance-none text-[11px] font-bold uppercase tracking-wider bg-gray-100/80 border border-transparent text-gray-500 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {sessionOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          <button 
            type="button" 
            onClick={() => {
              // alert('File attachments are coming in a future update.')
              fileInputRef.current?.click()
            }}
            className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-xl transition-all" 
            disabled={disabled}
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={(e) => console.log('File picked:', e.target.files?.[0])}
          />
          <button type="button" className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-xl transition-all" disabled={disabled}>
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="bg-[#1b3a6b] text-[#f5a623] p-2 px-5 rounded-xl hover:bg-[#152e55] disabled:opacity-30 transition-all flex shrink-0 items-center justify-center shadow-lg group"
        >
          <span className="mr-2 text-xs font-bold text-white tracking-widest uppercase">Send</span>
          <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
