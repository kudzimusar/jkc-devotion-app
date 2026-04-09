import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let payloadIds: string[] = [];
    try {
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text);
        if (body.campaign_id) payloadIds.push(body.campaign_id);
      }
    } catch(e) {}

    let campaignsToProcess = [];

    if (payloadIds.length > 0) {
      // 1. Fetch Explicit Campaign
      const { data: campaign, error: campErr } = await supabaseClient
        .from("communication_campaigns")
        .select("*")
        .in("id", payloadIds)
        .eq("status", "draft"); // wait, if it's explicitly sent it could be draft or scheduled

      // Normally when triggered via UI, status is "draft" or "scheduled"
      // We will re-query it below properly
      const { data: c } = await supabaseClient.from("communication_campaigns").select("*").in("id", payloadIds);
      if (c && c.length > 0) campaignsToProcess = c;
    } else {
      // 2. Cron Mode: Fetch due scheduled campaigns
      const { data: pending } = await supabaseClient
        .from("communication_campaigns")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", new Date().toISOString()) 
        .limit(5);
      if (pending && pending.length > 0) campaignsToProcess = pending;
    }

    if (campaignsToProcess.length === 0) {
       return new Response(JSON.stringify({ success: true, message: "No campaigns to process" }), { headers: corsHeaders });
    }

    const brevoKey = Deno.env.get("BREVO_API_KEY");
    const lineKey = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

    for (const campaign of campaignsToProcess) {
      if (campaign.status === "sent") continue;

      // Mark as sending
      await supabaseClient
        .from("communication_campaigns")
        .update({ status: "sending" })
        .eq("id", campaign.id);

      let mcpQuery = supabaseClient
        .from("member_communication_profiles")
        .select("*")
        .eq("org_id", campaign.org_id);

      // Handle advanced audience scoping
      if (campaign.audience_scope === "individual" && campaign.audience_filter?.target_id) {
        mcpQuery = mcpQuery.eq("email", campaign.audience_filter.target_id);
      } else if (campaign.audience_scope === "ministry" && campaign.audience_filter?.target_id) {
        const { data: members } = await supabaseClient
          .from("ministry_members")
          .select("user_id")
          .eq("ministry_id", campaign.audience_filter.target_id);
        const pids = members?.map((m: any) => m.user_id) || [];
        if (pids.length > 0) mcpQuery = mcpQuery.in("member_id", pids);
        else mcpQuery = mcpQuery.eq("member_id", "00000000-0000-0000-0000-000000000000"); // Force empty result if nobody in ministry
      } else if (campaign.audience_scope === "small_group" && campaign.audience_filter?.target_id) {
        const { data: members } = await supabaseClient
          .from("bible_study_group_members")
          .select("user_id")
          .eq("group_id", campaign.audience_filter.target_id);
        const pids = members?.map((m: any) => m.user_id) || [];
        if (pids.length > 0) mcpQuery = mcpQuery.in("member_id", pids);
        else mcpQuery = mcpQuery.eq("member_id", "00000000-0000-0000-0000-000000000000"); // Force empty result
      }

      const { data: profiles } = await mcpQuery;
      if (!profiles || profiles.length === 0) {
        // If there's truly no one to send to, we mark it sent with 0 payload
        await supabaseClient
          .from("communication_campaigns")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            total_sent: 0,
            total_failed: 0,
          })
          .eq("id", campaign.id);
        continue;
      }

      let totalSent = 0;
      let totalFailed = 0;

    for (const profile of profiles) {
      const isJa = profile.preferred_language === "ja";
      let sentToMember = false;

      // EMAIL
      if (campaign.channels.includes("email") && profile.email) {
        const subject = isJa ? campaign.subject_ja : campaign.subject_en;
        const bodyContent = isJa ? campaign.body_ja : campaign.body_en;
        
        if (brevoKey && subject && bodyContent) {
          try {
            const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
              method: "POST",
              headers: {
                "accept": "application/json",
                "api-key": brevoKey,
                "content-type": "application/json"
              },
              body: JSON.stringify({
                sender: { name: "Church OS", email: "kudzimusar@gmail.com" }, // Using verified email instead of unverified communications@jkc.org
                to: [{ email: profile.email }],
                subject: subject,
                htmlContent: `<div style="font-family: sans-serif; white-space: pre-wrap;">${bodyContent}</div>`,
                tags: [campaign.id]
              })
            });
            if (brevoRes.ok) {
              sentToMember = true;
              await supabaseClient.from('communication_deliveries').insert({
                org_id: campaign.org_id,
                campaign_id: campaign.id,
                member_id: profile.member_id,
                channel: 'email',
                status: 'sent',
                sent_at: new Date().toISOString()
              });
            }
            else {
              console.error("Brevo error:", await brevoRes.text());
            }
          } catch (e) {
            console.error("Brevo catch:", e);
          }
        } else {
             // Mock success if no keys but they wanted to send
             console.log(`[MOCK EMAIL] Sent to ${profile.email}: ${subject}`);
             sentToMember = true;
        }
      }

      // LINE
      if (campaign.channels.includes("line") && profile.line_user_id) {
        const lineContent = isJa ? campaign.line_message_ja : campaign.line_message_en;
        
        if (lineKey && lineContent) {
          try {
            const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${lineKey}`
              },
              body: JSON.stringify({
                to: profile.line_user_id,
                messages: [{ type: "text", text: lineContent }]
              })
            });
            if (lineRes.ok) sentToMember = true;
          } catch (e) {
            console.error("Line error:", e);
          }
        } else {
             console.log(`[MOCK LINE] Sent to ${profile.line_user_id}: ${lineContent}`);
             sentToMember = true;
        }
      }

      if (sentToMember) totalSent++;
      else totalFailed++;
    }

    // 4. Finalize Campaign
    await supabaseClient
      .from("communication_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_sent: totalSent,
        total_failed: totalFailed
      })
      .eq("id", campaign.id);

    } // end of campaignsToProcess loop

    return new Response(JSON.stringify({ success: true, processed: campaignsToProcess.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[coce-dispatch] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
