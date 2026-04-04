import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ChurchGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  scriptureRefs?: string[]
}

export function useChurchGPT(sessionType: string = 'general', orgId?: string, memberProfile?: any) {
  const [messages, setMessages] = useState<ChurchGPTMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChurchGPTMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    
    const assistantMessage: ChurchGPTMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])
    
    try {
      const CHURCHGPT_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/churchgpt-gateway`
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/churchgpt-gateway`
        : './api/churchgpt/'

      const response = await fetch(CHURCHGPT_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionType,
          orgId,
          memberProfile
        })
      })
      
      if (!response.ok) throw new Error('ChurchGPT request failed')
      
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullContent += chunk
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: fullContent }
            : m
        ))
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [messages, sessionType, orgId, memberProfile])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])
  
  return { messages, isLoading, error, sendMessage, clearConversation }
}
