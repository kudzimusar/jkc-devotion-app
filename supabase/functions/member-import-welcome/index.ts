// member-import-welcome Edge Function
// Sends branded welcome emails to newly imported members via the church's Brevo config.
// Called after executeImport completes in MemberImportWizard.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { org_id, church_slug, org_name, members } = await req.json()
    // members: Array<{ profile_id: string; name: string; email: string; ministry_name: string | null; role: string | null }>

    if (!org_id || !members?.length) {
      return new Response(JSON.stringify({ sent: 0, error: 'org_id and members required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Fetch church's branded email config ──────────────────────────────────
    const { data: emailConfig } = await supabase
      .from('church_email_config')
      .select('sender_display_name, noreply_address, connect_address, admin_address, brevo_domain_verified')
      .eq('org_id', org_id)
      .single()

    const brevoKey = Deno.env.get('BREVO_API_KEY')
    const senderName = emailConfig?.sender_display_name ?? org_name ?? 'Church OS'

    // Prefer connect_address, then noreply_address, then platform default
    const senderEmail = emailConfig?.connect_address
      ?? emailConfig?.noreply_address
      ?? 'no-reply@churchos.ai'

    const profileBaseUrl = church_slug
      ? `https://www.churchos-ai.website/${church_slug}/member-app`
      : 'https://www.churchos-ai.website'

    let sent = 0
    const errors: string[] = []

    for (const member of members) {
      if (!member.email || member.email.includes('@placeholder.church')) continue

      const ministryLine = member.ministry_name
        ? `<p style="color:#aaabb0;font-size:14px;margin:0 0 8px 0;">Ministry: <strong style="color:#e2e8f0">${member.ministry_name}</strong>${member.role ? ` — ${member.role}` : ''}</p>`
        : ''

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0c0e12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:40px;background:#13151a;border-radius:20px;border:1px solid #1e2028;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:16px 24px;">
        <span style="color:white;font-size:18px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">${senderName}</span>
      </div>
    </div>

    <h1 style="color:#f8fafc;font-size:24px;font-weight:900;margin:0 0 8px 0;">Welcome to ${org_name ?? senderName}, ${member.name?.split(' ')[0] ?? 'Friend'}</h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
      Your profile has been added to our church management system. You now have access to your personal member profile where you can update your details, view your ministry, and stay connected with the church family.
    </p>

    ${ministryLine}

    <div style="text-align:center;margin:32px 0;">
      <a href="${profileBaseUrl}"
         style="display:inline-block;background:linear-gradient(to right,#7c3aed,#4f46e5);color:white;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">
        View My Profile
      </a>
    </div>

    <div style="background:#1e2028;border-radius:12px;padding:20px;margin:28px 0;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px 0;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What you can do in your profile:</p>
      <ul style="color:#aaabb0;font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
        <li>Update your contact information and photo</li>
        <li>View your ministry assignments and cell group</li>
        <li>Track your spiritual journey milestones</li>
        <li>Access church resources and devotionals</li>
        <li>Connect with ChurchGPT for spiritual guidance</li>
      </ul>
    </div>

    <p style="color:#64748b;font-size:12px;text-align:center;margin:28px 0 0 0;line-height:1.6;">
      This email was sent by ${senderName} via Church OS.<br>
      If you believe this was sent in error, please contact your church administrator.
    </p>
  </div>
</body>
</html>`

      if (brevoKey) {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: member.email, name: member.name }],
            subject: `Welcome to ${org_name ?? senderName} — Your profile is ready`,
            htmlContent: html,
          }),
        })
        if (res.ok) {
          sent++
        } else {
          const errData = await res.json().catch(() => ({}))
          errors.push(`${member.email}: ${errData.message ?? res.status}`)
          console.error('[member-import-welcome] Brevo error:', member.email, errData)
        }
      } else {
        // No Brevo key — log only
        console.log(`[MOCK WELCOME EMAIL] To: ${member.email} | Org: ${org_name}`)
        sent++
      }
    }

    return new Response(JSON.stringify({ sent, total: members.length, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('member-import-welcome error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
