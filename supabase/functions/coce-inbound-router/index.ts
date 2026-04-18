import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-brevo-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ── Optional Brevo secret verification ──
  const brevoSecret = Deno.env.get("BREVO_INBOUND_SECRET");
  if (brevoSecret) {
    const incoming = req.headers.get("x-brevo-secret");
    if (incoming !== brevoSecret) {
      console.warn("[coce-inbound-router] Invalid Brevo secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: corsHeaders, status: 401,
      });
    }
  }

  let processed = 0;
  let failures = 0;

  try {
    const payload = await req.json();
    const items: any[] = payload.items ?? [];

    if (items.length === 0) {
      return new Response(JSON.stringify({ processed: 0, failures: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    for (const item of items) {
      try {
        // ── Parse fields from Brevo webhook ──
        const toAddresses: any[] = item.To ?? [];
        const toAddress = toAddresses[0]?.Address ?? "";
        const fromAddress = item.From?.Address ?? "";
        const fromName = item.From?.Name ?? "";
        const subject = item.Subject ?? "";
        const bodyText = item.RawTextBody ?? item.RawHtmlBody ?? "";
        const bodyHtml = item.RawHtmlBody ?? "";
        const messageId = item.MessageId ?? "";
        const inReplyTo = item.InReplyTo ?? null;
        const sentAt = item.SentAtDate ?? new Date().toISOString();

        // ── Extract reply token from To address ──
        // Format: reply+{token}@reply.{slug}.churchos-ai.website
        const tokenMatch = toAddress.match(/reply\+([^@]+)@/);
        const token = tokenMatch?.[1] ?? null;

        let orgId: string | null = null;
        let campaignId: string | null = null;
        let threadId: string | null = null;
        let memberId: string | null = null;
        let deliveryId: string | null = null;
        let routingStatus = "unknown_token";

        if (token) {
          const { data: resolved } = await supabase.rpc("resolve_reply_token", { p_token: token });
          if (resolved) {
            orgId = resolved.org_id;
            campaignId = resolved.campaign_id;
            threadId = resolved.thread_id;
            memberId = resolved.member_id;
            deliveryId = resolved.delivery_id;
            routingStatus = "routed";
          }
        }

        // ── AI classification ──
        let aiTone = "neutral";
        let aiCategory = "reply";
        let aiUrgencyScore = 20;
        let aiActionRequired = false;
        let aiSummary = "";
        let aiSuggestedResponse = "";
        let aiConfidence = 0;

        if (geminiKey && bodyText) {
          // Fetch original campaign subject for context
          let campaignSubject = "";
          if (campaignId) {
            const { data: camp } = await supabase
              .from("communication_campaigns")
              .select("subject_en")
              .eq("id", campaignId)
              .single();
            campaignSubject = camp?.subject_en ?? "";
          }

          const classifyPrompt = `Analyse this email from a church member.
From: ${fromName} <${fromAddress}>
Subject: ${subject}
Body: ${bodyText.substring(0, 2000)}
Original campaign this replies to: ${campaignSubject}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "tone": "one of: joy, crisis, gratitude, confusion, anger, neutral, urgent",
  "category": "one of: prayer_request, question, complaint, celebration, reply, inquiry, personal_crisis",
  "urgency_score": 0,
  "action_required": false,
  "summary": "one sentence summary of the email",
  "suggested_response": "2-3 paragraph draft pastoral response",
  "confidence": 0.85
}`;

          try {
            const gemRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: classifyPrompt }] }],
                  generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
                }),
              }
            );
            const gemData = await gemRes.json();
            const rawText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (rawText) {
              const cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
              const parsed = JSON.parse(cleanJson);
              aiTone = parsed.tone ?? aiTone;
              aiCategory = parsed.category ?? aiCategory;
              aiUrgencyScore = parsed.urgency_score ?? aiUrgencyScore;
              aiActionRequired = parsed.action_required ?? aiActionRequired;
              aiSummary = parsed.summary ?? "";
              aiSuggestedResponse = parsed.suggested_response ?? "";
              aiConfidence = parsed.confidence ?? 0;
            }
          } catch (classErr: any) {
            console.error("[coce-inbound-router] AI classification error:", classErr.message);
          }
        }

        // ── Insert inbound_email_log ──
        const { data: inboundLog, error: logError } = await supabase
          .from("inbound_email_log")
          .insert({
            org_id: orgId,
            from_address: fromAddress,
            from_name: fromName,
            to_address: toAddress,
            subject,
            body_text: bodyText.substring(0, 10000),
            body_html: bodyHtml.substring(0, 50000),
            message_id: messageId,
            in_reply_to: inReplyTo,
            received_at: sentAt,
            campaign_id: campaignId,
            thread_id: threadId,
            member_id: memberId,
            delivery_id: deliveryId,
            routing_status: routingStatus,
            matched_token: token,
          })
          .select("id")
          .single();

        if (logError) {
          console.error("[coce-inbound-router] inbound_email_log insert error:", logError.message);
          failures++;
          continue;
        }

        // ── Update communication_events with AI classification ──
        // The trigger auto-creates an event row; find it by message_id or inbound log id
        if (orgId && aiSummary) {
          await supabase
            .from("communication_events")
            .update({
              ai_tone: aiTone,
              ai_category: aiCategory,
              ai_urgency_score: aiUrgencyScore,
              ai_action_required: aiActionRequired,
              ai_summary: aiSummary,
              ai_suggested_response: aiSuggestedResponse,
              ai_classification_confidence: aiConfidence,
            })
            .eq("external_identifier", messageId)
            .eq("org_id", orgId);
        }

        // ── Crisis escalation ──
        if (aiUrgencyScore >= 80 && orgId && memberId) {
          await supabase.from("member_alerts").insert({
            org_id: orgId,
            member_id: memberId,
            alert_type: "crisis_comms",
            severity: "critical",
            title: `Crisis inbound: ${aiSummary}`,
            description: `Inbound message from ${fromName} classified as crisis. Urgency: ${aiUrgencyScore}/100`,
            metadata: { inbound_log_id: inboundLog.id, thread_id: threadId },
          });
          console.warn(`[coce-inbound-router] CRISIS flagged for member ${memberId}, urgency=${aiUrgencyScore}`);
        }

        // ── Create AI draft response in communication_drafts ──
        if (orgId && aiSuggestedResponse) {
          await supabase.from("communication_drafts").insert({
            org_id: orgId,
            trigger_source: "inbound_reply",
            campaign_type: "pastoral_message",
            audience_scope: "individual",
            recipient_id: memberId,
            thread_id: threadId,
            subject_en: `Re: ${subject}`,
            subject_ja: `Re: ${subject}`,
            body_en: aiSuggestedResponse,
            body_ja: aiSuggestedResponse,
            original_ai_body_en: aiSuggestedResponse,
            original_ai_body_ja: aiSuggestedResponse,
            ai_reasoning: `Auto-drafted in response to inbound from ${fromName}. Category: ${aiCategory}`,
            ai_confidence: aiConfidence,
            ai_urgency_score: aiUrgencyScore,
            ai_tone: aiTone,
            ai_model_used: "models/gemini-2.5-flash",
            review_status: "pending_review",
            estimated_recipients: 1,
          });
        }

        processed++;
      } catch (itemErr: any) {
        console.error("[coce-inbound-router] Item processing error:", itemErr.message);
        failures++;
      }
    }

    return new Response(
      JSON.stringify({ processed, failures }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[coce-inbound-router] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, processed, failures }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
