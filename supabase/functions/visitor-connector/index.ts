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

    // ============================================================
    // SECTION 1 — GEMINI CLASSIFICATION (keep exactly as-is)
    // ============================================================
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

    // ============================================================
    // SECTION 2 — INTENT ROUTER
    // Routes each KCC submission to correct table + notifies leaders
    // ============================================================

    const orgId = record.org_id || 'fa547adf-f820-412f-9458-d6bade11517d';
    const guestName = `${record.first_name || ''}${record.last_name ? ' ' + record.last_name : ''}`.trim() || 'Anonymous';
    const intent = record.visitor_intent || 'inquiry';
    const submissionTime = new Date().toLocaleString('en-JP', { timeZone: 'Asia/Tokyo' });

    // Pastoral user IDs for JKC
    const PASTOR_ID = '72048012-23c9-4c63-ad87-9d05c88afec5';
    const OWNER_ID = 'c58b07e8-7d05-4d15-b196-e8cf0022209b';
    const ADMIN_ID = 'ef9761e7-265b-44ee-8855-1608ccacc79c';
    const SHEPHERD_ID = '02b02917-e2c4-482a-8590-20452d7fde82';

    // Routing map: intent -> which user IDs get notified
    const notifyMap: Record<string, string[]> = {
      membership:     [PASTOR_ID, OWNER_ID, ADMIN_ID],
      prayer:         [SHEPHERD_ID, PASTOR_ID],
      volunteer:      [PASTOR_ID, OWNER_ID],
      event:          [ADMIN_ID, OWNER_ID],
      jkgroup:        [SHEPHERD_ID, PASTOR_ID],
      class_hoth:     [PASTOR_ID, ADMIN_ID],
      class_language: [PASTOR_ID, ADMIN_ID],
    };
    const recipientIds = notifyMap[intent] || [PASTOR_ID, OWNER_ID];

    const intentLabels: Record<string, string> = {
      membership:     'Membership Application',
      prayer:         'Prayer Request',
      volunteer:      'Volunteer Application',
      event:          'Event Registration',
      jkgroup:        'jkGroup Request',
      class_hoth:     'Heart of the House Registration',
      class_language: 'Language Class Application',
    };
    const intentLabel = intentLabels[intent] || 'General Inquiry';

    // Link to correct Mission Control section
    const missionControlLinks: Record<string, string> = {
      membership: '/shepherd/dashboard/requests',
      prayer:     '/shepherd',
      volunteer:  '/shepherd',
      event:      '/shepherd',
      default:    '/shepherd',
    };
    const mcLink = missionControlLinks[intent] || missionControlLinks.default;

    // --- 2A: Route membership to membership_requests table ---
    if (intent === 'membership') {
      const { error: mrError } = await supabaseClient
        .from('membership_requests')
        .insert({
          org_id: orgId,
          user_id: null,
          status: 'pending',
          inquiry_id: record.id,
          guest_name: guestName,
          guest_email: record.email || null,
          guest_phone: record.phone || null,
          how_heard: record.how_heard || null,
          source: 'kcc_form',
          notes: record.message || null
        });
      if (mrError) console.error('[Router] membership_requests error:', JSON.stringify(mrError));
      else console.log('[Router] Membership request created in pipeline');
    }

    // --- 2B: Route prayer to prayer_requests table ---
    if (intent === 'prayer') {
      const isUrgent = aiResult.sentiment === 'Urgent' ||
                       (record.message || '').toLowerCase().includes('urgent');
      const { error: prError } = await supabaseClient
        .from('prayer_requests')
        .insert({
          org_id: orgId,
          request_text: record.prayer_request || record.message || '',
          category: aiResult.prayer_category || 'General',
          urgency: isUrgent ? 'High' : 'Normal',
          status: 'active',
          is_anonymous: !record.first_name || record.first_name === 'Guest',
          requires_pastoral_contact: isUrgent,
          inquiry_id: record.id
        });
      if (prError) console.error('[Router] prayer_requests error:', JSON.stringify(prError));
      else console.log('[Router] Prayer request created');
    }

    // --- 2C: In-app notifications to pastoral leaders ---
    const notificationRows = recipientIds.map(userId => ({
      org_id: orgId,
      user_id: userId,
      title: `New ${intentLabel}`,
      message: `${guestName}${record.email ? ' (' + record.email + ')' : ''} submitted via Kingdom Connect Card at ${submissionTime}.`,
      link_to: mcLink,
      is_read: false,
      type: 'kcc_submission'
    }));

    const { error: notifError } = await supabaseClient
      .from('member_notifications')
      .insert(notificationRows);
    if (notifError) console.error('[Router] member_notifications error:', JSON.stringify(notifError));
    else console.log(`[Router] Notified ${notificationRows.length} leaders`);

    // --- 2D: Brevo alert emails to pastoral leaders ---
    const brevoKey = Deno.env.get('BREVO_API_KEY');
    if (brevoKey) {
      // Get pastoral email addresses
      const { data: leaderUsers } = await supabaseClient
        .from('org_members')
        .select('user_id, role')
        .eq('org_id', orgId)
        .in('role', ['pastor', 'admin', 'owner', 'shepherd']);

      if (leaderUsers && leaderUsers.length > 0) {
        const leaderIds = leaderUsers.map((l: { user_id: string; role: string }) => l.user_id);
        const { data: leaderEmails } = await supabaseClient
          .from('profiles')
          .select('id, email, name')
          .in('id', leaderIds);

        if (leaderEmails && leaderEmails.length > 0) {
          const toRecipients = (leaderEmails as { id: string; email: string; name: string }[])
            .filter(l => l.email)
            .map(l => ({ email: l.email, name: l.name || l.email }));

          if (toRecipients.length > 0) {
            const submissionDetails = `
              <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">
                <tr><td style="padding:8px;color:#666;width:140px;">Name</td><td style="padding:8px;font-weight:bold;">${guestName}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Email</td><td style="padding:8px;">${record.email || 'Not provided'}</td></tr>
                <tr><td style="padding:8px;color:#666;">Phone</td><td style="padding:8px;">${record.phone || 'Not provided'}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Intent</td><td style="padding:8px;">${intentLabel}</td></tr>
                <tr><td style="padding:8px;color:#666;">Source</td><td style="padding:8px;">${record.how_heard || 'Web'}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Message</td><td style="padding:8px;">${record.message || record.prayer_request || 'No message provided'}</td></tr>
                <tr><td style="padding:8px;color:#666;">AI Analysis</td><td style="padding:8px;">${aiResult.reply_suggestion || 'Processing...'}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Time (JST)</td><td style="padding:8px;">${submissionTime}</td></tr>
              </table>
            `;

            try {
              const leaderBrevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'api-key': brevoKey
                },
                body: JSON.stringify({
                  sender: { name: 'Japan Kingdom Church', email: 'kudzimusar@gmail.com' },
                  to: toRecipients,
                  subject: `[Action Required] New ${intentLabel} — ${guestName}`,
                  htmlContent: `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                      <div style="background:#1b3a6b;padding:20px 24px;border-radius:8px 8px 0 0;">
                        <h2 style="color:#f5a623;margin:0;font-size:18px;">Kingdom Connect Card — New Submission</h2>
                        <p style="color:#fff;margin:4px 0 0;font-size:13px;">Japan Kingdom Church · Mission Control Alert</p>
                      </div>
                      <div style="background:#fff;border:1px solid #e5e7eb;padding:24px;border-radius:0 0 8px 8px;">
                        <p style="color:#374151;margin:0 0 16px;">A new <strong>${intentLabel}</strong> has been submitted via the Kingdom Connect Card and requires your attention.</p>
                        ${submissionDetails}
                        <div style="margin-top:24px;text-align:center;">
                          <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://churchos-ai.website'}${mcLink}"
                             style="background:#1b3a6b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
                            View in Mission Control
                          </a>
                        </div>
                        <p style="color:#9ca3af;font-size:11px;margin-top:16px;text-align:center;">
                          Church OS · Powered by Kingdom Intelligence
                        </p>
                      </div>
                    </div>
                  `
                })
              });
              const leaderBrevoBody = await leaderBrevoRes.json();
              console.log(`[Router] Brevo leader alert: ${leaderBrevoRes.ok ? 'sent' : 'failed'} to ${toRecipients.length} leaders`);
              try {
                await supabaseClient.from('kcc_email_log').insert({
                  org_id: orgId,
                  inquiry_id: record.id,
                  recipient_email: toRecipients.map((r: any) => r.email).join(', '),
                  recipient_type: 'leader',
                  subject: `[Action Required] New ${intentLabel} — ${guestName}`,
                  status: leaderBrevoRes.ok ? 'sent' : 'failed',
                  brevo_message_id: leaderBrevoRes.ok ? (leaderBrevoBody?.messageId || null) : null,
                  error_message: leaderBrevoRes.ok ? null : JSON.stringify(leaderBrevoBody)
                });
              } catch (logErr) {
                console.error('[EmailLog] leader log error:', logErr);
              }
            } catch (brevoAlertErr) {
              console.error('[Router] Brevo leader alert error:', brevoAlertErr);
            }
          }
        }
      }
    }

    // ============================================================
    // SECTION 3 — UPDATE ORIGINAL RECORD + PIL INSIGHT
    // ============================================================

    // 3A: Update public_inquiries with AI classification
    const { error: updateError } = await supabaseClient
      .from('public_inquiries')
      .update({
        ai_classification: aiResult,
        status: 'analyzed'
      })
      .eq('id', record.id);
    if (updateError) console.error('[Update] public_inquiries error:', JSON.stringify(updateError));

    // 3B: Write AI insight to ai_ministry_insights for PIL engine
    const insightSummary = `${intentLabel} from ${guestName}. ${aiResult.reply_suggestion || ''}`.trim();
    const recommendedAction = intent === 'membership'
      ? `Follow up with ${guestName} within 48 hours to schedule a Heart of the House class.`
      : intent === 'prayer'
      ? `Assign prayer to the intercessory team and follow up if marked urgent.`
      : intent === 'volunteer'
      ? `Review ${guestName}'s ministry preference and connect with the relevant ministry lead.`
      : `Review the Kingdom Connect submission and follow up with ${guestName}.`;

    const { error: insightError } = await supabaseClient
      .from('ai_ministry_insights')
      .insert({
        org_id: orgId,
        insight_type: 'kcc_activity',
        subject: `KCC: ${intentLabel} — ${guestName}`,
        summary: insightSummary,
        detail: JSON.stringify({
          intent,
          name: guestName,
          email: record.email,
          phone: record.phone,
          message: record.message,
          ai_sentiment: aiResult.sentiment,
          ai_prayer_category: aiResult.prayer_category,
          source: record.how_heard,
          submission_time: submissionTime
        }),
        recommended_action: recommendedAction,
        confidence: 'High',
        urgency: aiResult.sentiment === 'Urgent' ? 'high' : 'normal',
        is_approved: false,
        visible_to_ministry_leaders: true,
        generated_by: 'visitor-connector-v2',
        subject_id: record.id
      });
    if (insightError) console.error('[PIL] ai_ministry_insights error:', JSON.stringify(insightError));
    else console.log('[PIL] AI insight recorded');

    // ============================================================
    // SECTION 4 — BREVO GUEST CONFIRMATION EMAIL (keep exactly as-is)
    // ============================================================
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
            sender: { name: "Japan Kingdom Church", email: "kudzimusar@gmail.com" },
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

        const guestBrevoBody = await brevoRes.json()
        const guestEmailStatus = brevoRes.ok ? 'sent' : 'failed'
        const guestEmailError = brevoRes.ok ? null : JSON.stringify(guestBrevoBody)
        if (!brevoRes.ok) {
          console.error('[Brevo Error]', guestEmailError)
        } else {
          console.log('[Brevo Success] messageId:', guestBrevoBody?.messageId)
        }
        await supabaseClient.from('kcc_email_log').insert({
          org_id: orgId,
          inquiry_id: record.id,
          recipient_email: record.email,
          recipient_type: 'guest',
          subject: subject,
          status: guestEmailStatus,
          brevo_message_id: brevoRes.ok ? (guestBrevoBody?.messageId || null) : null,
          error_message: guestEmailError
        })
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
