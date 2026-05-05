import { useState, useCallback, useEffect } from 'react'
import { getChurchGPTSupabaseClient } from '@/lib/churchgpt/supabase-client'
import { JKC_ORG_ID } from '@/lib/org-resolver'

export interface ChurchGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  scriptureRefs?: string[]
  document_data?: Record<string, unknown> | null
  attachment?: {
    data: string
    mimeType: string
    name?: string
  }
}

export interface ChurchGPTConversation {
  id: string
  title: string
  session_type: string
  created_at: string
  updated_at: string
}

export interface ChurchGPTQuotaState {
  remaining: number   // -1 = unknown/unlimited
  limit: number
  used: number
  tier: string
}

export interface ChurchGPTUpgradePayload {
  reason: string
  message: string
  upgradeUrl: string
  tier: string
}

// ── Guest fingerprint (stored in localStorage) ────────────────────────────────
const GUEST_FP_KEY = 'cgpt_fp'
const GUEST_MESSAGES_KEY = 'churchgpt_guest_messages'
const GUEST_COUNT_KEY = 'churchgpt_guest_count'

async function getOrCreateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server'
  const stored = localStorage.getItem(GUEST_FP_KEY)
  if (stored) return stored
  const raw = navigator.userAgent + (navigator.language ?? '') + screen.width + screen.height
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw + Date.now()))
  const fp = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  localStorage.setItem(GUEST_FP_KEY, fp)
  return fp
}

// ── Context detection ─────────────────────────────────────────────────────────
function detectContext(isGuest: boolean, orgId: string | null): string {
  if (!isGuest) return 'platform'
  if (orgId) return 'church'
  return 'public'
}

export function useChurchGPT(
  sessionType: string = 'general',
  orgId?: string,
  memberProfile?: any,
  isGuest: boolean = false
) {
  const supabase = getChurchGPTSupabaseClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [orgIdState, setOrgIdState] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<ChurchGPTMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChurchGPTConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ChurchGPTConversation | null>(null)
  const [quotaState, setQuotaState] = useState<ChurchGPTQuotaState | null>(null)
  const [upgradeModal, setUpgradeModal] = useState<ChurchGPTUpgradePayload | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])

  const resolvedOrgId = orgId || orgIdState || memberProfile?.org_id || profile?.org_id || (!isGuest ? JKC_ORG_ID : null)
  const resolvedUserId = userId || profile?.id
  const userTier: string = (profile as any)?.tier ?? quotaState?.tier ?? (isGuest ? 'guest' : 'starter')
  const isPro = userTier === 'pro' || userTier === 'enterprise'

  // Initial load
  useEffect(() => {
    if (isGuest) {
      const saved = localStorage.getItem(GUEST_MESSAGES_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
        } catch {}
      }
      return
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, role, org_id')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setOrgIdState(profileData.org_id)
        setProfile(profileData)
      }
      
      loadConversations()
    }
    init()
  }, [isGuest])

  // Once userId resolves from async init, load conversations (init's call ran with stale closure)
  useEffect(() => {
    if (!isGuest && resolvedUserId) loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUserId, isGuest])

  // Load available models for Pro+ model selector
  useEffect(() => {
    if (!isPro) return
    supabase
      .from('churchgpt_model_config')
      .select('model_id, display_name, is_available, is_user_selectable')
      .eq('is_available', true)
      .eq('is_user_selectable', true)
      .then((res: any) => { if (res?.data) setAvailableModels(res.data) })
  }, [isPro])

  const loadConversations = useCallback(async () => {
    if (isGuest || !resolvedUserId) return
    try {
      // ChurchGPT-only subscribers have no org_id — scope by user_id alone
      let query = supabase
        .from('churchgpt_conversations')
        .select('*')
        .eq('user_id', resolvedUserId)
        .order('updated_at', { ascending: false })
        
      if (resolvedOrgId) {
        query = query.eq('org_id', resolvedOrgId)
      }
      const { data, error } = await query
      if (error) throw error
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }, [resolvedOrgId, resolvedUserId, isGuest])

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

      const mappedMessages = data.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at)
      }))

      setMessages(mappedMessages)
      setConversationId(convoId)

      const convo = conversations.find(c => c.id === convoId)
      if (convo) setCurrentConversation(convo)
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
      if (conversationId === convoId) setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null)
      return
    }
    try {
      const { error } = await supabase
        .from('churchgpt_conversations')
        .update({ title: newTitle })
        .eq('id', convoId)
      if (error) throw error
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title: newTitle } : c))
      if (conversationId === convoId) setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null)
    } catch (err) {
      console.error('Error renaming conversation:', err)
    }
  }, [conversationId, isGuest])

  const createConversation = async (title: string, sType: string) => {
    if (isGuest) return null
    if (!resolvedUserId) {
      console.warn('[useChurchGPT] Could not create conversation: Missing user_id')
      return null
    }
    const row: Record<string, any> = { user_id: resolvedUserId, title, session_type: sType }
    if (resolvedOrgId) row.org_id = resolvedOrgId
    const { data, error } = await supabase
      .from('churchgpt_conversations')
      .insert(row)
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

  const sendMessage = useCallback(async (
    content: string,
    overrideSessionType?: string,
    attachment?: { data: string, mimeType: string, name?: string },
    voiceMode = false
  ) => {
    if (!content.trim() && !attachment) return

    setIsLoading(true)
    setError(null)
    setUpgradeModal(null)

    let currentConvoId = conversationId
    const activeSessionType = overrideSessionType || sessionType
    const context = detectContext(isGuest, resolvedOrgId ?? null)

    try {
      // Create conversation for authenticated users
      if (!isGuest && !currentConvoId) {
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

      // Guest: update localStorage count
      if (isGuest) {
        const count = parseInt(localStorage.getItem(GUEST_COUNT_KEY) || '0')
        localStorage.setItem(GUEST_COUNT_KEY, (count + 1).toString())
        localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(newMessages))
      }

      // Persist user message for authenticated users
      if (!isGuest && currentConvoId) {
        await supabase.from('churchgpt_messages').insert({ conversation_id: currentConvoId, role: 'user', content })
        await supabase.from('churchgpt_conversations').update({ updated_at: new Date().toISOString() }).eq('id', currentConvoId)
      }

      // Add placeholder assistant message
      const assistantMessage: ChurchGPTMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      // Get guest fingerprint
      const fingerprint = isGuest ? await getOrCreateFingerprint() : null

      // ── Attachment pre-processing ─────────────────────────────────────────
      // Images and PDFs go to Gemini as inline data; all other formats get
      // converted to text first so the model can read them.
      let gatewayAttachment: { data: string; mimeType: string } | undefined
      let attachmentText = ''

      if (attachment) {
        const isInlineType =
          attachment.mimeType.startsWith('image/') ||
          attachment.mimeType === 'application/pdf'

        if (isInlineType) {
          gatewayAttachment = { data: attachment.data, mimeType: attachment.mimeType }
        } else {
          try {
            const convRes = await fetch('/api/read-attachment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: attachment.data, mimeType: attachment.mimeType, name: attachment.name }),
            })
            if (convRes.ok) {
              const { text } = await convRes.json()
              if (text) attachmentText = `\n\n[Attached file: ${attachment.name ?? 'document'}]\n${text}`
            }
          } catch {
            // silently skip — don't block the message
          }
        }
      }

      const CHURCHGPT_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/churchgpt-gateway`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30_000)

      let res: Response
      try {
        res = await fetch(CHURCHGPT_ENDPOINT, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            })
          },
          body: JSON.stringify({
            message: content + attachmentText,
            history: newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
            conversation_id: currentConvoId ?? null,
            org_id: isGuest ? null : (resolvedOrgId ?? null),
            model_preference: isPro ? (selectedModel ?? null) : null,
            context,
            sessionType: activeSessionType,
            memberProfile: isGuest ? null : (memberProfile || profile),
            fingerprint,
            ...(voiceMode ? { voice_mode: true } : {}),
            ...(gatewayAttachment ? { attachment: gatewayAttachment } : {}),
          })
        })
      } catch (fetchErr: any) {
        clearTimeout(timeoutId)
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
        const isTimeout = fetchErr?.name === 'AbortError'
        setError(isTimeout ? 'timeout' : 'service_unavailable')
        return
      }
      clearTimeout(timeoutId)

      // ── 429 quota exceeded ─────────────────────────────────────────────────
      if (res.status === 429) {
        const errorData = await res.json()
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
        setUpgradeModal({
          reason: errorData.reason,
          message: errorData.message,
          upgradeUrl: errorData.upgrade_url,
          tier: errorData.tier
        })
        // Update guest count display from real server count
        if (isGuest && errorData.used !== undefined) {
          localStorage.setItem(GUEST_COUNT_KEY, String(errorData.used))
        }
        return
      }

      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
        setError(res.status >= 500 ? 'server_error' : 'server_error')
        return
      }

      const data = await res.json()
      let reply: string = data.reply ?? ''
      // Guard 1: response body itself is a double-encoded JSON string
      if (!reply && typeof data === 'string') {
        try { reply = (JSON.parse(data) as any).reply ?? '' } catch {}
      }
      // Guard 2: reply field contains the full JSON envelope (gateway wrapping bug)
      if (reply && reply.trimStart().startsWith('{')) {
        try {
          const inner = JSON.parse(reply)
          if (typeof inner?.reply === 'string') reply = inner.reply
        } catch {}
      }

      // Update assistant message with reply and optional document_data
      const documentData: Record<string, unknown> | null = data.document_data ?? null
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id ? { ...m, content: reply, document_data: documentData } : m
      ))

      // Update quota state from response
      if (data.remaining_quota !== undefined) {
        setQuotaState({
          remaining: data.remaining_quota,
          limit: data.quota_limit ?? -1,
          used: data.messages_used ?? 0,
          tier: data.tier ?? (isGuest ? 'guest' : 'starter')
        })
      }

      // Update guest count in localStorage
      if (isGuest && data.messages_used !== undefined) {
        localStorage.setItem(GUEST_COUNT_KEY, String(data.messages_used))
      }

      // Persist assistant message for authenticated users
      if (!isGuest && currentConvoId && reply) {
        await supabase.from('churchgpt_messages').insert({ conversation_id: currentConvoId, role: 'assistant', content: reply })
      }

      if (isGuest) {
        setMessages(prev => {
          localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(prev))
          return prev
        })
      }
    } catch (err) {
      console.error(err)
      setError('server_error')
    } finally {
      setIsLoading(false)
    }
  }, [messages, sessionType, orgId, memberProfile, conversationId, resolvedOrgId, resolvedUserId, profile, isGuest, isPro, selectedModel])

  const clearConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setCurrentConversation(null)
    setError(null)
    setUpgradeModal(null)
    if (isGuest) {
      localStorage.removeItem(GUEST_MESSAGES_KEY)
      localStorage.setItem(GUEST_COUNT_KEY, '0')
    }
  }, [isGuest])

  useEffect(() => {
    if (!isGuest && (resolvedOrgId || resolvedUserId)) loadConversations()
  }, [resolvedOrgId, resolvedUserId, loadConversations, isGuest])

  useEffect(() => {
    if (isGuest && messages.length > 0) {
      localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages))
    }
  }, [messages, isGuest])

  useEffect(() => {
    if (conversationId && messages.length === 0 && !isLoading) loadMessages(conversationId)
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
    setConversationId,
    quotaState,
    upgradeModal,
    setUpgradeModal,
    selectedModel,
    setSelectedModel,
    availableModels,
    isPro,
    userTier,
  }
}
