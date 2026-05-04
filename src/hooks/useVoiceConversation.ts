"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'unavailable'

interface VoiceProfile {
  rate: number
  pitch: number
  // preferred voice name fragment — matched against available voices
  voiceHint: string
}

const MODE_VOICE: Record<string, VoiceProfile> = {
  'devotional':           { rate: 0.88, pitch: 1.05, voiceHint: 'female' },
  'prayer':               { rate: 0.82, pitch: 1.00, voiceHint: 'female' },
  'pastoral':             { rate: 0.90, pitch: 0.95, voiceHint: 'male'   },
  'grief-support':        { rate: 0.80, pitch: 0.95, voiceHint: 'female' },
  'sermon-planning':      { rate: 0.95, pitch: 0.97, voiceHint: 'male'   },
  'worship-planning':     { rate: 0.92, pitch: 1.02, voiceHint: 'female' },
  'youth-ministry':       { rate: 1.05, pitch: 1.08, voiceHint: 'male'   },
  'small-group':          { rate: 0.93, pitch: 1.00, voiceHint: 'female' },
  'evangelism-coaching':  { rate: 1.00, pitch: 1.00, voiceHint: 'male'   },
  'leadership-development':{ rate: 0.97, pitch: 0.97, voiceHint: 'male'  },
  'bible-study':          { rate: 0.90, pitch: 0.98, voiceHint: 'male'   },
  'apologetics':          { rate: 0.95, pitch: 0.97, voiceHint: 'male'   },
  'stewardship':          { rate: 0.93, pitch: 0.97, voiceHint: 'male'   },
  'event-planning':       { rate: 1.00, pitch: 1.02, voiceHint: 'female' },
  'visitor':              { rate: 0.95, pitch: 1.05, voiceHint: 'female' },
  'general':              { rate: 0.95, pitch: 1.00, voiceHint: 'female' },
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')          // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // bold
    .replace(/\*([^*]+)\*/g, '$1')      // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/^\s*[-*+]\s+/gm, '')      // bullets
    .replace(/^\s*\d+\.\s+/gm, '')      // numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/>{1,}/g, '')              // blockquotes
    .replace(/---+/g, '.')              // hr
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function pickVoice(voices: SpeechSynthesisVoice[], hint: string): SpeechSynthesisVoice | null {
  const lower = hint.toLowerCase()
  // Prefer en-US or en-GB voices matching the gender hint in the name
  const candidates = voices.filter(v => v.lang.startsWith('en'))
  const hinted = candidates.filter(v => v.name.toLowerCase().includes(lower))
  return hinted[0] ?? candidates[0] ?? voices[0] ?? null
}

function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function useVoiceConversation(sessionType: string) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setIsAvailable(isSpeechAvailable())
  }, [])

  // Lazily init recognition
  function getRecognition(): any {
    if (recognitionRef.current) return recognitionRef.current
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return null
    const r = new SR()
    r.continuous = false
    r.interimResults = false
    r.lang = 'en-US'
    recognitionRef.current = r
    return r
  }

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isSpeechAvailable()) { reject(new Error('STT not available')); return }
      const r = getRecognition()
      if (!r) { reject(new Error('SpeechRecognition unavailable')); return }

      // Cancel any ongoing speech before listening
      window.speechSynthesis.cancel()

      setTranscript('')
      setVoiceState('listening')

      r.onresult = (e: any) => {
        const text = Array.from(e.results as any[])
          .map((res: any) => res[0].transcript)
          .join(' ')
          .trim()
        setTranscript(text)
        setVoiceState('idle')
        resolve(text)
      }

      r.onerror = (e: any) => {
        setVoiceState('idle')
        reject(new Error(e.error ?? 'STT error'))
      }

      r.onend = () => {
        setVoiceState(prev => prev === 'listening' ? 'idle' : prev)
      }

      r.start()
    })
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setVoiceState('idle')
  }, [])

  const speak = useCallback((text: string, mode?: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const clean = stripMarkdown(text)
    if (!clean) return

    const profile = MODE_VOICE[mode ?? sessionType] ?? MODE_VOICE['general']
    const utter = new SpeechSynthesisUtterance(clean)
    utter.rate  = profile.rate
    utter.pitch = profile.pitch
    utter.volume = 1

    // Voice selection — voices load async in some browsers
    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length) {
        const v = pickVoice(voices, profile.voiceHint)
        if (v) utter.voice = v
      }
    }

    applyVoice()
    if (!window.speechSynthesis.getVoices().length) {
      window.speechSynthesis.onvoiceschanged = applyVoice
    }

    utter.onstart = () => setVoiceState('speaking')
    utter.onend   = () => setVoiceState('idle')
    utter.onerror = () => setVoiceState('idle')

    utteranceRef.current = utter
    setVoiceState('speaking')
    window.speechSynthesis.speak(utter)
  }, [sessionType])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setVoiceState('idle')
  }, [])

  // Cancel everything on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  return {
    voiceState,
    transcript,
    isAvailable,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
