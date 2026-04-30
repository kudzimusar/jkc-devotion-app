import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildChurchGPTSystemPrompt } from '@/lib/churchgpt/buildSystemPrompt'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePublicOrgId } from '@/lib/org-resolver'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionType, memberProfile } = await req.json()
    const supabase = await createClient()
    
    // Use org-resolver as required
    let orgId = await resolvePublicOrgId()
    
    if (!orgId) {
       // Fallback for authorized server context if public resolver fails
       const { data: { user } } = await supabase.auth.getUser()
       if (user) {
         const { data: orgMember } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).limit(1).single()
         if (orgMember) {
           orgId = orgMember.org_id
         }
       }
    }
    
    // Get org context
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, settings')
      .eq('id', orgId)
      .single()

    // Build system prompt
    const systemPrompt = buildChurchGPTSystemPrompt({
      orgContext: org || undefined,
      memberProfile,
      sessionType: sessionType || 'general'
    })
    
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-04-17',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.75,
        topP: 0.95,
        maxOutputTokens: 8192,  // sufficient for full theological responses
      }
    })
    
    // Build chat history (all messages except the last)
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
    
    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]
    
    // Stream response
    const result = await chat.sendMessageStream(lastMessage.content)
    
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()
      }
    })
    
    // Log interaction to Supabase (fire and forget)
    logChurchGPTInteraction(supabase, {
      orgId: org?.id || orgId,
      memberProfile,
      sessionType,
      messageCount: messages.length,
    }).catch(console.error)
    
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
    
  } catch (error) {
    console.error('ChurchGPT API error DETAIL:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      { error: 'ChurchGPT is momentarily unavailable. Please try again.' },
      { status: 500 }
    )
  }
}

async function logChurchGPTInteraction(supabase: any, meta: any) {
  if (!meta.orgId) return
  await supabase.from('churchgpt_interactions').insert({
    org_id: meta.orgId,
    member_id: meta.memberProfile?.id,
    session_type: meta.sessionType || 'general',
    message_count: meta.messageCount,
    created_at: new Date().toISOString()
  })
}
