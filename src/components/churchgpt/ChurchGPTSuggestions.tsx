import { BookOpen, Sparkles, MessageCircle, Heart, HelpCircle, Compass } from "lucide-react"

interface ChurchGPTSuggestionsProps {
  onSelect: (prompt: string) => void;
}

export function ChurchGPTSuggestions({ onSelect }: ChurchGPTSuggestionsProps) {
  const suggestions = [
    { label: "Understand a Bible verse", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Write a prayer for me", icon: <Sparkles className="w-5 h-5" /> },
    { label: "I have a faith question", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "Help with something else", icon: <Heart className="w-5 h-5" /> },
    { label: "What does Christianity say about suffering?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "I want to start reading the Bible", icon: <Compass className="w-5 h-5" /> }
  ]

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto flex-1 min-h-[400px]">
      <div className="text-center mb-8 space-y-2">
        <div className="mb-4 flex justify-center">
          <img src="/cgpt-icons/icon-128x128.png" alt="ChurchGPT" className="w-16 h-16" />
        </div>
        <h2 
          className="text-3xl font-bold text-[#1b3a6b]" 
          style={{ fontFamily: 'Georgia, serif' }}
        >
          ChurchGPT
        </h2>
        <p className="text-gray-400 font-medium text-xs tracking-widest uppercase">
          Your Christian AI Companion
        </p>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s.label)}
              className="flex items-center gap-3 p-4 min-h-[64px] bg-white border border-gray-200 hover:border-[#f5a623] hover:bg-amber-50 cursor-pointer transition-all rounded-xl shadow-sm text-left group"
            >
              <span className="shrink-0 text-[#f5a623]">
                {s.icon}
              </span>
              <span className="text-sm font-medium text-[#1b3a6b] leading-snug line-clamp-2">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
