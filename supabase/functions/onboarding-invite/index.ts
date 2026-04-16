import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, churchName, invitedBy } = await req.json()
    console.log('Invite Function: processing request for', email)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const siteUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://churchos-ai.website'
    const inviteLink = `${siteUrl}/onboarding?invited=true&church=${encodeURIComponent(churchName || '')}`

    // Log invitation for analytics
    const { error: insertErr } = await supabaseAdmin.from('onboarding_invitations').insert({
      email,
      church_name: churchName,
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      status: 'pending'
    })

    if (insertErr) {
      console.error('Insert error:', insertErr)
      return new Response(JSON.stringify({ error: insertErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Send invitation via Brevo
    try {
      console.log('Invite Function: sending email via Brevo to', email)
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')
      
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey || ''
        },
        body: JSON.stringify({
          sender: { name: 'Church OS', email: 'no-reply@churchos.ai' },
          to: [{ email }],
          subject: `Join ${churchName || 'the New Sanctuary'} on Church OS`,
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0c0e12; color: white; border-radius: 20px;">
              <h1 style="color: #72eff5; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">You're Invited</h1>
              <p style="color: #aaabb0; line-height: 1.6;">You have been invited to start the premium onboarding process for <strong>${churchName || 'your church'}</strong> on Church OS.</p>
              <div style="margin: 40px 0;">
                <a href="${inviteLink}" style="background: linear-gradient(to right, #72eff5, #1fb1b7); color: #002829; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Start Onboarding</a>
              </div>
              <p style="color: #666; font-size: 12px;">This invitation is active for 48 hours.</p>
            </div>
          `
        })
      })

      if (!brevoResponse.ok) {
        const brevoData = await brevoResponse.json()
        throw new Error(brevoData.message || 'Brevo API error')
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Invite Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
