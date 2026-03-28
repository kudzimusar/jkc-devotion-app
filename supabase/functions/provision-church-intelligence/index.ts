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

    if (!record || !record.org_id) {
      throw new Error("No organization record found in payload")
    }

    const orgId = record.org_id
    console.log(`🚀 Starting AI Provisioning for Organization: ${orgId}`)

    // 1. Update status to 'processing'
    await supabaseClient
      .from('organization_intelligence')
      .update({ ai_provisioning_status: 'processing' })
      .eq('org_id', orgId)

    // 2. Fetch Church Identity Context
    const { data: orgData } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    const churchName = orgData?.name || "Your Church"

    // 3. GENERATE WELCOME INSIGHT VIA GEMINI
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    let growthBlueprint = {
      title: "Your Growth Blueprint",
      description: `Welcome to Church OS, ${churchName}. Based on your theological DNA, our AI is currently calibrating your strategic trajectory.`,
      action: "Start by importing your current member list to begin sentiment analysis.",
      category: "Growth",
      score: 85
    }

    if (geminiKey) {
      const prompt = `You are the Church OS Strategic Intelligence Engine.
      You are provisioning a new church on your platform.
      
      Church Context:
      - Name: ${churchName}
      - Theological Tradition: ${record.theological_tradition}
      - Ministry Emphasis: ${record.ministry_emphasis}
      - Worship Style: ${record.worship_style}
      - Congregation Size: ${record.congregation_size}
      - Language: ${record.primary_language}
      
      Generate a "First Prophetic Insight" for the pastor. This should be a growth blueprint.
      - insight_title: A compelling 3-5 word title.
      - insight_description: A 2-sentence vision based on their theological DNA.
      - recommended_action: One clear first step to take in the platform.
      - category: One of [Growth, Discipleship, Community, Warning].
      
      Respond only in JSON:
      {
        "insight_title": "string",
        "insight_description": "string",
        "recommended_action": "string",
        "category": "string",
        "probability_score": number
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
          const cleanJson = text.replace(/```json|```|`/g, '').trim()
          const aiResult = JSON.parse(cleanJson)
          growthBlueprint = {
            title: aiResult.insight_title,
            description: aiResult.insight_description,
            action: aiResult.recommended_action,
            category: aiResult.category,
            score: aiResult.probability_score || 85
          }
        }
      } catch (e) {
        console.error("Gemini Error:", e)
      }
    }

    // 4. Save Insight to Database
    await supabaseClient
      .from('prophetic_insights')
      .insert({
        org_id: orgId,
        category: growthBlueprint.category,
        insight_title: growthBlueprint.title,
        insight_description: growthBlueprint.description,
        recommended_action: growthBlueprint.action,
        probability_score: growthBlueprint.score,
        risk_level: 'Low',
        metadata: { source: 'onboarding_provisioning', dna: record }
      })

    // 5. SEND WELCOME EMAIL VIA BREVO
    const brevoKey = Deno.env.get('BREVO_API_KEY')
    if (brevoKey) {
      // Find Owner Email
      const { data: owner } = await supabaseClient
        .from('org_members')
        .select('profiles(email)')
        .eq('org_id', orgId)
        .eq('role', 'owner')
        .single()

      const targetEmail = (owner?.profiles as any)?.email

      if (targetEmail) {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: "Church OS Support", email: "onboarding@churchos.com" },
            to: [{ email: targetEmail }],
            subject: `Welcome to Church OS, ${churchName}!`,
            htmlContent: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h1 style="color: #4f46e5;">Welcome to the Future of Church growth</h1>
                <p>Hello Pastor,</p>
                <p>We are excited to partner with <strong>${churchName}</strong>. Our AI has analyzed your theological DNA and generated your first <strong>Prophetic Insight</strong>:</p>
                
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">🔮 ${growthBlueprint.title}</h3>
                  <p>${growthBlueprint.description}</p>
                  <p><strong>Recommended Action:</strong> ${growthBlueprint.action}</p>
                </div>

                <p>You can access your full Strategic Dashboard here: <a href="https://jkc.church-os.com/admin">Pastor HQ</a></p>
                <p>Blessings,<br>The Church OS Team</p>
              </div>
            `
          })
        })
      }
    }

    // 6. FINAL STATUS UPDATE
    await supabaseClient
      .from('organization_intelligence')
      .update({ 
        ai_provisioning_status: 'completed',
        welcome_insight_generated: true,
        ai_provisioned_at: new Date().toISOString()
      })
      .eq('org_id', orgId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

    } catch (error: any) {
    console.error("AI Provisioning Error:", error.message)
    
    // Attempt to set status to failed so the UI can react
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const payload = await req.json()
      if (payload?.record?.org_id) {
        await supabaseClient
          .from('organization_intelligence')
          .update({ ai_provisioning_status: 'failed' })
          .eq('org_id', payload.record.org_id)
      }
    } catch (innerError) {
      console.error("Failed to update status to 'failed':", innerError)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
