import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { JKC_ORG_ID } from '@/lib/org-resolver'

export interface ChurchGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  scriptureRefs?: string[]
  attachment?: {
    data: string; // base64
    mimeType: string;
    name?: string;
  }
}

export interface ChurchGPTConversation {
  id: string
  title: string
  session_type: string
  created_at: string
  updated_at: string
}

export function useChurchGPT(sessionType: string = 'general', orgId?: string, memberProfile?: any, isGuest: boolean = false) {
  const [userId, setUserId] = useState<string | null>(null)
  const [orgIdState, setOrgIdState] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<ChurchGPTMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChurchGPTConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ChurchGPTConversation | null>(null)

  // Constants
  const GUEST_MESSAGES_KEY = 'churchgpt_guest_messages'
  const GUEST_COUNT_KEY = 'churchgpt_guest_count'

  const resolvedOrgId = orgId || orgIdState || memberProfile?.org_id || profile?.org_id || (!isGuest ? JKC_ORG_ID : null)
  const resolvedUserId = userId || profile?.id

  // Initial load of user/profile
  useEffect(() => {
    if (isGuest) {
      // Load guest messages from localStorage
      const saved = localStorage.getItem(GUEST_MESSAGES_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })))
        } catch (e) {
          console.error('Error parsing guest messages', e)
        }
      }
      return
    }

    const init = async () => {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, role, org_id')
        .eq('id', user.id)
        .single()
      
      if (!profileData) return
      
      setUserId(user.id)
      setOrgIdState(profileData.org_id)
      setProfile(profileData)
      
      // Now load conversations
      loadConversations()
    }
    init()
  }, [isGuest])

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (isGuest) return
    try {
      if (!resolvedOrgId) return

      const { data, error } = await supabase
        .from('churchgpt_conversations')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }, [resolvedOrgId, isGuest])

  // Load messages for a conversation
  const loadMessages = useCallback(async (convoId: string) => {
    if (isGuest || !convoId) return
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('churchgpt_messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      const mappedMessages = data.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at)
      }))

      // Atomic update
      setMessages(mappedMessages)
      setConversationId(convoId)
      
      const convo = conversations.find(c => c.id === convoId)
      if (convo) {
        setCurrentConversation(convo)
      }
    } catch (err) {
      console.error('Error loading messages:', err)
      setError('Failed to load conversation history.')
    } finally {
      setIsLoading(false)
    }
  }, [conversations, isGuest])

  const deleteConversation = useCallback(async (convoId: string) => {
    if (isGuest) return
    try {
      const { error } = await supabase
        .from('churchgpt_conversations')
        .delete()
        .eq('id', convoId)
      
      if (error) throw error
      
      setConversations(prev => prev.filter(c => c.id !== convoId))
      if (conversationId === convoId) {
        setConversationId(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }, [conversationId, isGuest])

  const renameConversation = useCallback(async (convoId: string, newTitle: string) => {
    if (isGuest) {
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title: newTitle } : c))
      if (conversationId === convoId) {
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null)
      }
      return
    }

    try {
      const { error } = await supabase
        .from('churchgpt_conversations')
        .update({ title: newTitle })
        .eq('id', convoId)
      
      if (error) throw error
      
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title: newTitle } : c))
      if (conversationId === convoId) {
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null)
      }
    } catch (err) {
      console.error('Error renaming conversation:', err)
    }
  }, [conversationId, isGuest])

  const createConversation = async (title: string, sType: string) => {
    if (isGuest) return null
    if (!resolvedUserId || !resolvedOrgId) {
      console.warn('[useChurchGPT] Could not create conversation: Missing user or orgId', { user: resolvedUserId, orgId: resolvedOrgId })
      return null
    }

    const { data, error } = await supabase
      .from('churchgpt_conversations')
      .insert({
        user_id: resolvedUserId,
        org_id: resolvedOrgId,
        title,
        session_type: sType
      })
      .select()
      .single()
    
    if (error) {
      console.error('[useChurchGPT] Create conversation failed:', error)
      throw error
    }
    
    setConversations(prev => [data, ...prev])
    setCurrentConversation(data)
    return data.id
  }

  const sendMessage = useCallback(async (content: string, overrideSessionType?: string, attachment?: { data: string, mimeType: string, name?: string }) => {
    if (!content.trim() && !attachment) return

    setIsLoading(true)
    setError(null)

    let currentConvoId = conversationId
    const activeSessionType = overrideSessionType || sessionType
    
    try {
      // 1. Create conversation if it doesn't exist (only for non-guests)
      if (!isGuest && !currentConvoId) {
        // Use first 30 chars of content as title
        const title = content.length > 50 ? content.substring(0, 47) + '...' : content
        try {
          currentConvoId = await createConversation(title, activeSessionType)
          if (currentConvoId) setConversationId(currentConvoId)
        } catch (e) {
          console.warn('[ChurchGPT] Could not create conversation, continuing without persistence', e)
        }
      }

      const userMessage: ChurchGPTMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachment
      }
      
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)

      // Guest Count Tracking
      if (isGuest) {
        const count = parseInt(localStorage.getItem(GUEST_COUNT_KEY) || '0')
        localStorage.setItem(GUEST_COUNT_KEY, (count + 1).toString())
        localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(newMessages))
      }

      // 2. Save user message to DB
      if (!isGuest && currentConvoId) {
        await supabase.from('churchgpt_messages').insert({
          conversation_id: currentConvoId,
          role: 'user',
          content
        })
        
        // Update conversation updated_at
        await supabase
          .from('churchgpt_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConvoId)
      }
      
      const assistantMessage: ChurchGPTMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      const CHURCHGPT_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/churchgpt-gateway`

      const response = await fetch(CHURCHGPT_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionType: activeSessionType,
          orgId: isGuest ? null : resolvedOrgId,
          userId: isGuest ? null : resolvedUserId,
          memberProfile: isGuest ? null : (memberProfile || profile),
          isGuest,
          attachment: userMessage.attachment
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

      // 3. Save assistant message to DB
      if (!isGuest && currentConvoId) {
        await supabase.from('churchgpt_messages').insert({
          conversation_id: currentConvoId,
          role: 'assistant',
          content: fullContent
        })
      }

      if (isGuest) {
        // Update localStorage with assistant response too
        setMessages(prev => {
          localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(prev))
          return prev
        })
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [messages, sessionType, orgId, memberProfile, conversationId, resolvedOrgId, resolvedUserId, profile, isGuest])

  const clearConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setCurrentConversation(null)
    setError(null)
    if (isGuest) {
      localStorage.removeItem(GUEST_MESSAGES_KEY)
      localStorage.setItem(GUEST_COUNT_KEY, '0')
    }
  }, [isGuest])

  // Load conversations list only after userId is set
  useEffect(() => {
    if (resolvedOrgId && !isGuest) {
      loadConversations()
    }
  }, [resolvedOrgId, loadConversations, isGuest])

  // Guest Persistence: Save to localStorage on message change
  useEffect(() => {
    if (isGuest && messages.length > 0) {
      localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages))
    }
  }, [messages, isGuest])

  // Persistence Fix: Load messages when conversationId changes
  useEffect(() => {
    if (conversationId && messages.length === 0 && !isLoading) {
      loadMessages(conversationId)
    }
  }, [conversationId, messages.length, isLoading, loadMessages])
  
  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearConversation,
    conversations,
    conversationId,
    currentConversation,
    loadMessages,
    deleteConversation,
    renameConversation,
    setConversationId
  }
}
