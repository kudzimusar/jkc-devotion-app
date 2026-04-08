import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { record } = payload

    if (!record) {
      throw new Error("No record found in payload")
    }

    console.log(`Analyzing inquiry ${record.id} from ${record.first_name}`)

    // 1. GEMINI CLASSIFICATION
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    let aiResult = {
      intent: record.visitor_intent || "inquiry",
      sentiment: "Neutral",
      prayer_category: "General",
      internal_notes: "AI processing pending API key setup",
      reply_suggestion: "Welcome to Japan Kingdom Church! We received your message and will get back to you shortly."
    }

    if (geminiKey) {
      const prompt = `You are the Japan Kingdom Church (JKC) Ministry Intelligence Agent. 
      Analyze this message from ${record.first_name}:
      "${record.message}"
      
      Classify the intent into one of: [First Visit, Prayer Request, Testimony, General Question].
      Sentiment: [Positive, Urgent, Neutral].
      If a prayer request, categorize: [Health, Family, Career, Spiritual].
      Draft a warm, personal reply in ${record.preferred_language === 'JP' ? 'Japanese' : 'English'}.
      
      Respond only in JSON format:
      {
        "intent": "string",
        "sentiment": "string",
        "prayer_category": "string",
        "reply_suggestion": "string"
      }`

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        })
        
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          // Clean up JSON if Gemini adds markdown markers
          const cleanJson = text.replace(/```json|```/g, '').trim()
          aiResult = { ...aiResult, ...JSON.parse(cleanJson) }
        }
      } catch (gemError) {
        console.error("Gemini Error:", gemError)
      }
    }

    // 2. AUTOMATION: Prayer Request Logging
    if (aiResult.intent === "Prayer Request" || record.visitor_intent === "prayer_request") {
      const { error: prayerError } = await supabaseClient
        .from('prayer_requests')
        .insert({
          org_id: record.org_id,
          request_text: record.message,
          category: aiResult.prayer_category || 'General',
          urgency: aiResult.sentiment === 'Urgent' ? 'High' : 'Normal',
          status: 'pending',
          requires_pastoral_contact: aiResult.sentiment === 'Urgent'
        })
      if (prayerError) console.error("Failed to log prayer request:", prayerError)
    }

    // 3. UPDATE ORIGINAL RECORD
    const { error: updateError } = await supabaseClient
      .from('public_inquiries')
      .update({
        ai_classification: aiResult,
        status: 'analyzed'
      })
      .eq('id', record.id)

    if (updateError) throw updateError

    // 4. BREVO Integration: Confirmation Email
    const apiKey = Deno.env.get('BREVO_API_KEY')
    if (apiKey && record.email) {
      console.log(`Sending Brevo email to ${record.email} for intent ${record.visitor_intent}`)
      
      const subjects: Record<string, string> = {
        'prayer': "Your prayer request has been received — Japan Kingdom Church",
        'membership': "Welcome — Your JKC membership application has been received",
        'volunteer': "Thank you for volunteering — Japan Kingdom Church",
        'jkgroup': "Your jkGroup request has been received — Japan Kingdom Church",
        'class_hoth': "Heart of the House registration confirmed — Japan Kingdom Church",
        'class_language': "Kingdom Japanese Language Class — Application received",
        'event': "Event registration confirmed — Japan Kingdom Church"
      }
      
      const subject = subjects[record.visitor_intent] || "Thank you for connecting — Japan Kingdom Church"
      const step = aiResult.reply_suggestion || "We have received your message and will get back to you shortly."

      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify({
            sender: { name: "Japan Kingdom Church", email: "info@kudzimusar.com" },
            to: [{ email: record.email, name: `${record.first_name} ${record.last_name || ''}`.trim() }],
            subject: subject,
            htmlContent: `
              <div style="font-family: sans-serif; padding: 20px; color: #1b3a6b;">
                <p>Dear ${record.first_name},</p>
                <p>Thank you for reaching out to Japan Kingdom Church. ${step}</p>
                <p>Blessings,<br>Japan Kingdom Church Team</p>
              </div>
            `
          })
        })
        
        if (!brevoRes.ok) {
          const err = await brevoRes.json()
          console.error('[Brevo Error]', err)
        } else {
          console.log('[Brevo Success]')
        }
      } catch (e) {
        console.error('[Brevo Fetch Error]', e)
      }
    }

    return new Response(JSON.stringify({ success: true, aiResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("Visitor Connector Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
