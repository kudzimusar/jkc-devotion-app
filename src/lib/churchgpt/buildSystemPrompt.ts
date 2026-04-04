import { CHURCHGPT_CORE_IDENTITY } from './identity.const'
import { SESSION_MODIFIERS } from './sessionModifiers.const'
import { CHURCHGPT_KNOWLEDGE_BASE } from './knowledge.const'
import type { ChurchGPTContext } from './types'

export function buildChurchGPTSystemPrompt(context?: ChurchGPTContext): string {
  const parts: string[] = [CHURCHGPT_CORE_IDENTITY, CHURCHGPT_KNOWLEDGE_BASE]
  
  if (context?.orgContext?.name) {
    parts.push(`You are deployed within ${context.orgContext.name}. Reference this church warmly when relevant.`)
  }
  
  if (context?.memberProfile?.full_name) {
    parts.push(`The member you are speaking with is ${context.memberProfile.full_name}.${
      context.memberProfile.spiritual_notes 
        ? ` Pastoral context: ${context.memberProfile.spiritual_notes}` 
        : ''
    } Use their name naturally in conversation.`)
  }
  
  const sessionType = context?.sessionType || 'general'
  const modifier = SESSION_MODIFIERS[sessionType]
  if (modifier) parts.push(modifier)
  
  return parts.join('\\n\\n---\\n\\n')
}
