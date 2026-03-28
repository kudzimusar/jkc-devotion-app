import { supabase } from '@/lib/supabase';
import { getOrCreateSessionId } from './ai-session';

/**
 * AI LOGGING SYSTEM - Phase 5
 * Records every AI interaction for evaluation and improvement.
 * @see supabase/migrations/20260403000000_ai_evaluation_logging.sql
 */

interface LogEntry {
  userId: string | null;
  organizationId?: string | null;
  persona: string;
  path: string;
  userQuery: string;
  aiResponse?: string;
  responseTimeMs: number;
  toolsCalled?: any[];
  toolResults?: any[];
  tokensUsed?: number;
  modelUsed?: string;
  escalated?: boolean;
  errorMessage?: string;
}

export async function logAIConversation(entry: LogEntry): Promise<string | null> {
  const sessionId = getOrCreateSessionId();
  
  // Sanitize userId (if it's an empty string from the guest UI, make it null to avoid UUID errors)
  const sanitizedUserId = entry.userId && entry.userId.trim() !== "" ? entry.userId : null;
  
  try {
    const { data, error } = await supabase.from('ai_conversation_logs').insert({
      user_id: sanitizedUserId,
      organization_id: entry.organizationId,
      session_id: sessionId,
      persona: entry.persona,
      path: entry.path,
      user_query: entry.userQuery,
      ai_response: entry.aiResponse,
      response_time_ms: entry.responseTimeMs,
      tools_called: entry.toolsCalled,
      tool_results: entry.toolResults,
      tokens_used: entry.tokensUsed,
      model_used: entry.modelUsed || 'gemini-3.1-pro',
      escalated: entry.escalated || false,
      error_message: entry.errorMessage,
      created_at: new Date().toISOString()
    }).select('id').single();

    if (error) {
      console.warn('[AI LOGGER] Insert failed:', error.message);
      return null;
    }
    
    return data?.id || null;
  } catch (err) {
    console.error('[AI LOGGER] Critical insertion error:', err);
    return null;
  }
}
