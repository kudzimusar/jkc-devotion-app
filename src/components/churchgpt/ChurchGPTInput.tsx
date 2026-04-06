"use client"

import { useState, KeyboardEvent, useRef } from "react"
import { Send, Mic, ChevronDown, Paperclip, X } from "lucide-react"

interface ChurchGPTInputProps {
  onSend: (message: string, sessionType: string, attachment?: { data: string, mimeType: string, name?: string }) => void
  disabled?: boolean
  sessionType: string
  setSessionType: (v: string) => void
  userRole?: 'admin' | 'pastor' | 'leader' | 'member' | 'visitor' | null
}

export function ChurchGPTInput({ onSend, disabled, sessionType, setSessionType, userRole }: ChurchGPTInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null)

  // Session options based on role
  const sessionOptions = userRole === 'admin' || userRole === 'pastor'
    ? ['general', 'devotional', 'prayer', 'bible-study', 'apologetics', 'pastoral', 'admin', 'visitor']
    : userRole === 'member' || userRole === 'leader'
    ? ['general', 'devotional', 'prayer', 'bible-study', 'apologetics', 'pastoral']
    : ['general', 'prayer', 'bible-study', 'visitor'] // unauthenticated / external

  const handleSend = () => {
    if ((content.trim() || selectedFile) && !disabled) {
      onSend(content.trim(), sessionType, selectedFile || undefined)
      setContent("")
      setSelectedFile(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1]
      setSelectedFile({
        data: base64String,
        mimeType: file.type,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
    // reset input so same file can be picked again
    e.target.value = ''
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
      {/* File Preview */}
      {selectedFile && (
        <div className="mx-2 mb-1 relative inline-block group">
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-2 pr-10 max-w-sm overflow-hidden">
            {selectedFile.mimeType.startsWith('image/') ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                <img src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#1b3a6b]/5 flex items-center justify-center shrink-0 border border-gray-100">
                <Paperclip className="w-4 h-4 text-[#1b3a6b]" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-700 truncate">{selectedFile.name}</span>
              <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tight">{selectedFile.mimeType.split('/')[1]} file</span>
            </div>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className="absolute -right-2 -top-2 bg-white border border-gray-100 shadow-md rounded-full p-1.5 hover:bg-gray-50 transition-colors group/close"
          >
            <X className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      )}

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
            onClick={() => fileInputRef.current?.click()}
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
            onChange={handleFileChange}
          />
          <button type="button" className="p-2 text-gray-400 hover:text-[#1b3a6b] hover:bg-gray-100 rounded-xl transition-all" disabled={disabled}>
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={(!content.trim() && !selectedFile) || disabled}
          className="bg-[#1b3a6b] text-[#D4AF37] p-2 px-5 rounded-xl hover:bg-[#152e55] disabled:opacity-30 transition-all flex shrink-0 items-center justify-center shadow-lg group"
        >
          <span className="mr-2 text-xs font-bold text-white tracking-widest uppercase">Send</span>
          <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
