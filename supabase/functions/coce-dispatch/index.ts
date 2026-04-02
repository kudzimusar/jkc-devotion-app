import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * COCE DISPATCH ENGINE - Phase 1
 * Background worker triggered every minute to process scheduled communication campaigns.
 * Multi-tenant, bilingual, and multi-channel delivery.
 */

// Configuration
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'comms@churchos.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'Church OS';
const BREVO_API_URL = 'https://api.brevo.com/v3';

// LINE API (Placeholders for now) - Future Implementation
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Fetch scheduled campaigns ready for sending
  const { data: campaigns, error: campaignError } = await supabase
    .from('communication_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10); // Process in small batches to avoid timeouts

  if (campaignError) {
    console.error('[COCE] Failed to fetch campaigns:', campaignError);
    return new Response(JSON.stringify({ error: campaignError.message }), { status: 500 });
  }

  if (!campaigns || campaigns.length === 0) {
    return new Response(JSON.stringify({ message: "No campaigns to process." }), { status: 200 });
  }

  console.log(`[COCE] Found ${campaigns.length} campaigns ready for dispatch.`);

  for (const campaign of campaigns) {
    try {
      // 2. Mark campaign as sending
      await supabase.from('communication_campaigns').update({ status: 'sending' }).eq('id', campaign.id);

      // 3. Resolve the audience from member_communication_profiles
      // Note: This respects multi-tenant org_id
      let query = supabase
        .from('member_communication_profiles')
        .select(`
          member_id,
          email,
          phone_e164,
          line_user_id,
          preferred_language,
          preferred_channel,
          notification_preferences,
          member_status
        `)
        .eq('org_id', campaign.org_id);

      // Simple audience scope logic for first phase
      if (campaign.audience_scope === 'role' && campaign.audience_filter?.role) {
        query = query.eq('member_status', campaign.audience_filter.role);
      }

      const { data: profiles, error: profileError } = await query;
      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        await supabase.from('communication_campaigns').update({ status: 'sent', total_recipients: 0 }).eq('id', campaign.id);
        continue;
      }

      console.log(`[COCE] Campaign ${campaign.id} audience resolved: ${profiles.length} members.`);

      let sentCount = 0;
      let failedCount = 0;

      // 4. Group profiles for efficient delivery where possible
      // For now, iterate and deliver individually to keep track of receipts
      for (const profile of profiles) {
        // Dispatch across all requested channels for this campaign
        for (const channel of campaign.channels) {
          // Check opt-out unless it's an emergency or children_safety campaign
          const isCritical = ['emergency', 'children_safety'].includes(campaign.campaign_type);
          const pref = profile.notification_preferences?.[campaign.campaign_type]?.[channel];
          
          if (!isCritical && pref === false) {
            console.log(`[COCE] User ${profile.member_id} opted out of ${campaign.campaign_type} via ${channel}`);
            continue;
          }

          // Create the delivery record (the receipt)
          const { data: delivery, error: delError } = await supabase
            .from('communication_deliveries')
            .insert({
              org_id: campaign.org_id,
              campaign_id: campaign.id,
              member_id: profile.member_id,
              channel: channel,
              status: 'pending'
            })
            .select()
            .single();

          if (delError) {
            console.error(`[COCE] Failed to create delivery record for member ${profile.member_id}:`, delError);
            continue;
          }

          // 5. Deliver
          const deliveryResult = await deliverMessage({
            campaign,
            profile,
            channel,
            supabase
          });

          // 6. Update receipt
          await supabase
            .from('communication_deliveries')
            .update({
              status: deliveryResult.success ? 'sent' : 'failed',
              sent_at: deliveryResult.success ? new Date().toISOString() : null,
              failed_at: deliveryResult.success ? null : new Date().toISOString(),
              error_message: deliveryResult.error,
              external_message_id: deliveryResult.external_id,
              events: [{ 
                type: deliveryResult.success ? 'sent' : 'failed', 
                timestamp: new Date().toISOString(), 
                details: deliveryResult.error || 'Successfully handed off to provider'
              }]
            })
            .eq('id', delivery.id);

          if (deliveryResult.success) sentCount++;
          else failedCount++;
        }
      }

      // 7. Update final campaign stats
      await supabase.from('communication_campaigns').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: profiles.length,
        total_sent: sentCount,
        total_failed: failedCount
      }).eq('id', campaign.id);

    } catch (err: any) {
      console.error(`[COCE] Error processing campaign ${campaign.id}:`, err);
      await supabase.from('communication_campaigns').update({ status: 'failed', error_message: err.message }).eq('id', campaign.id);
    }
  }

  return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
});

/**
 * PROVIDER LAYER
 * Encapsulates specific channel logic (Brevo, LINE, etc.)
 */
async function deliverMessage({ campaign, profile, channel, supabase }: any) {
  // Select language template
  const isJP = profile.preferred_language === 'ja';
  const subject = isJP ? (campaign.subject_ja || campaign.subject_en) : (campaign.subject_en || campaign.subject_ja);
  const body = isJP ? (campaign.body_ja || campaign.body_en) : (campaign.body_en || campaign.body_ja);

  // EMAIL -> Brevo
  if (channel === 'email' && profile.email) {
    return await sendEmail(profile.email, subject, body);
  }

  // LINE -> Messaging API (Stubbed)
  if (channel === 'line' && profile.line_user_id) {
    return await sendLine(profile.line_user_id, body);
  }
  
  // IN-APP -> member_feed_items (If not already handled by manual post)
  // Actually, newsletters already create feed items in the UI. 
  // For other campaigns, we could simulate in-app delivery here.

  return { success: false, error: `No valid contact info for channel: ${channel}` };
}

async function sendEmail(email: string, subject: string, body: string) {
  if (!BREVO_API_KEY) return { success: false, error: 'BREVO_API_KEY missing' };
  
  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject,
        htmlContent: body.replace(/\n/g, '<br/>'),
        textContent: body
      })
    });

    const data = await response.json();
    if (response.ok) return { success: true, external_id: data.messageId };
    return { success: false, error: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function sendLine(userId: string, body: string) {
  // TODO: Implement LINE Messaging API (Needs Channel Access Token)
  // For now, log the attempt
  console.log(`[LINE MOCK] Sending to ${userId}: ${body.substring(0, 50)}...`);
  return { success: true, external_id: `mock_line_${Date.now()}` };
}
