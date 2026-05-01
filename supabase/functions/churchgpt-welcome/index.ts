/**
 * churchgpt-welcome — Send branded welcome email to ChurchGPT subscribers
 *
 * Modes:
 *   POST { user_id }          → send to one specific user
 *   POST { bulk: true }       → send to ALL users where welcome_sent_at IS NULL
 *
 * Called from:
 *   - PublicChurchGPTAuth.tsx on signup (single user)
 *   - Supabase SQL editor one-time: SELECT net.http_post(...) for backfill
 *
 * Uses platform BREVO_API_KEY (not church-specific).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHURCHGPT_URL = 'https://ai.churchos-ai.website/churchgpt'
const UPGRADE_URL   = 'https://ai.churchos-ai.website/churchgpt/upgrade'
const SENDER_NAME   = 'ChurchGPT'
const SENDER_EMAIL  = 'hello@churchos-ai.website'

function planLabel(tier: string): string {
  const map: Record<string, string> = {
    starter:    'Starter — 50 messages/month (free)',
    lite:       'Lite — 500 messages/month',
    pro:        'Pro — 3,000 messages/month',
    enterprise: 'Enterprise — Unlimited',
  }
  return map[tier?.toLowerCase()] ?? 'Starter — 50 messages/month (free)'
}

function buildEmail(displayName: string, email: string, tier: string): string {
  const name      = displayName || email.split('@')[0]
  const plan      = planLabel(tier)
  const isStarter = !tier || tier === 'starter'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ChurchGPT</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0f1f3d;padding:40px 40px 32px;text-align:center;">
              <img
                src="https://ai.churchos-ai.website/churchgpt-logo.png"
                alt="ChurchGPT"
                width="100"
                style="display:block;margin:0 auto 20px;width:100px;height:auto;"
              />
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Welcome to ChurchGPT
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:#D4AF37;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">
                Your Kingdom AI companion
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
                You&rsquo;re now part of a growing community of believers using ChurchGPT
                to explore Scripture, grow in faith, and get honest, biblically-grounded
                answers to the questions that matter most.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                ChurchGPT is unapologetically Christian. It won&rsquo;t give you a
                watered-down Gospel — it will walk with you through doubt, theology,
                apologetics, and prayer with the same conviction and warmth.
              </p>

              <!-- Plan badge -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.12em;text-transform:uppercase;">
                      Your plan
                    </p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#0f1f3d;">
                      ${plan}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <a href="${CHURCHGPT_URL}/chat"
                       style="display:inline-block;padding:16px 40px;background:#0f1f3d;color:#ffffff;
                              font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;
                              letter-spacing:0.02em;">
                      Start your first conversation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              ${isStarter ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${UPGRADE_URL}"
                       style="display:inline-block;padding:14px 40px;background:transparent;
                              color:#0f1f3d;font-size:14px;font-weight:600;text-decoration:none;
                              border-radius:12px;border:1px solid #e2e8f0;">
                      Upgrade for 500+ messages/month
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Verse -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border-left:3px solid #D4AF37;margin-bottom:32px;">
                <tr>
                  <td style="padding:12px 20px;">
                    <p style="margin:0;font-size:14px;font-style:italic;color:#64748b;line-height:1.7;">
                      &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
                    </p>
                    <p style="margin:6px 0 0;font-size:12px;font-weight:700;color:#D4AF37;letter-spacing:0.06em;">
                      PSALM 119:105
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
                Questions? Reply to this email or contact us at
                <a href="mailto:hello@churchos-ai.website"
                   style="color:#0f1f3d;font-weight:600;text-decoration:none;">
                  hello@churchos-ai.website
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                Church OS PVT LTD &nbsp;&middot;&nbsp; ChurchGPT Platform
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                You received this because you signed up at
                <a href="${CHURCHGPT_URL}" style="color:#94a3b8;">ai.churchos-ai.website/churchgpt</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendWelcomeEmail(
  brevoKey: string,
  email: string,
  displayName: string,
  tier: string
): Promise<{ ok: boolean; error?: string }> {
  const html = buildEmail(displayName, email, tier)
  const name = displayName || email.split('@')[0]

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': brevoKey,
    },
    body: JSON.stringify({
      sender:  { name: SENDER_NAME, email: SENDER_EMAIL },
      to:      [{ email, name }],
      subject: `Welcome to ChurchGPT, ${name} 🙏`,
      htmlContent: html,
    }),
  })

  if (res.ok) return { ok: true }
  const body = await res.text().catch(() => `HTTP ${res.status}`)
  return { ok: false, error: `HTTP ${res.status}: ${body}` }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const brevoKey = Deno.env.get('BREVO_API_KEY') ?? ''
  if (!brevoKey) {
    return new Response(JSON.stringify({ error: 'BREVO_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const body = await req.json().catch(() => ({}))
  const { user_id, bulk } = body

  let users: { user_id: string; email: string; display_name: string; subscription_tier: string }[] = []

  if (bulk) {
    // Backfill mode — all users who have never received a welcome email
    const { data, error } = await supabase
      .from('churchgpt_users')
      .select('user_id, email, display_name, subscription_tier')
      .is('welcome_sent_at', null)
      .not('email', 'ilike', '%@placeholder%')
      .not('email', 'is', null)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    users = data ?? []
  } else if (user_id) {
    // Single user mode
    const { data, error } = await supabase
      .from('churchgpt_users')
      .select('user_id, email, display_name, subscription_tier')
      .eq('user_id', user_id)
      .is('welcome_sent_at', null)
      .maybeSingle()

    if (error || !data) {
      return new Response(JSON.stringify({ sent: 0, reason: 'not_found_or_already_sent' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    users = [data]
  } else {
    return new Response(JSON.stringify({ error: 'Provide user_id or bulk:true' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    try {
      const result = await sendWelcomeEmail(
        brevoKey,
        user.email,
        user.display_name,
        user.subscription_tier ?? 'starter'
      )

      if (result.ok) {
        await supabase
          .from('churchgpt_users')
          .update({ welcome_sent_at: new Date().toISOString() })
          .eq('user_id', user.user_id)
        sent++
      } else {
        failed++
        errors.push(`${user.email}: ${result.error}`)
      }
    } catch (err: any) {
      failed++
      errors.push(`${user.email}: ${err.message}`)
    }
  }

  console.log(`[churchgpt-welcome] sent=${sent} failed=${failed}`)

  return new Response(
    JSON.stringify({ sent, failed, total: users.length, errors }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
