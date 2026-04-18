import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_TRIGGER_SOURCES = [
  "manual", "cron_devotion", "cron_newsletter", "inquiry_reply",
  "inbound_reply", "drift_detection", "celebration", "reengagement",
  "event_reminder", "broadcast",
];

const VALID_AUDIENCE_SCOPES = [
  "individual", "segment", "ministry", "small_group", "role",
  "org_wide", "subscribers", "mixed",
];

const AUTO_SEND_ELIGIBLE_TYPES = [
  "devotion_reminder", "newsletter_weekly_digest",
  "newsletter_prayer_bulletin", "newsletter_visitor_welcome",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const {
      org_id,
      trigger_source,
      campaign_type,
      audience_scope,
      audience_filter,
      context_data = {},
      recipient_id,
      human_requested_by,
      review_window_minutes = 60,
    } = body;

    // ── Validate input ──
    if (!org_id) return err400("Missing required field: org_id");
    if (!trigger_source || !VALID_TRIGGER_SOURCES.includes(trigger_source))
      return err400(`Invalid trigger_source. Must be one of: ${VALID_TRIGGER_SOURCES.join(", ")}`);
    if (!campaign_type) return err400("Missing required field: campaign_type");
    if (!audience_scope || !VALID_AUDIENCE_SCOPES.includes(audience_scope))
      return err400(`Invalid audience_scope. Must be one of: ${VALID_AUDIENCE_SCOPES.join(", ")}`);

    // ── Fetch church context ──
    const [{ data: org }, { data: emailConfig }] = await Promise.all([
      supabase.from("organizations").select("name").eq("id", org_id).single(),
      supabase.from("church_email_config").select("sender_display_name, pastor_display_name").eq("org_id", org_id).single(),
    ]);

    const churchName = org?.name ?? "Our Church";
    const senderName = emailConfig?.sender_display_name ?? churchName;
    const pastorName = emailConfig?.pastor_display_name ?? "Pastor";

    // ── Newsletter template lookup ──
    let templateData: any = null;
    if (campaign_type.startsWith("newsletter_")) {
      const { data: tmpl } = await supabase
        .from("newsletter_templates")
        .select("ai_prompt_template, ai_tone, ai_target_length, auto_send_eligible")
        .eq("template_key", campaign_type)
        .single();
      templateData = tmpl;
    }

    // ── Build Gemini prompt ──
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    let aiResult = {
      subject_en: `Update from ${churchName}`,
      subject_ja: `${churchName}からのお知らせ`,
      body_en: "",
      body_ja: "",
      preview_text: "",
      cta_label: "Read More",
      reasoning: "AI generation skipped — no API key configured.",
      confidence: 0,
      urgency_score: 10,
      tone: "warm_narrative",
    };

    if (geminiKey) {
      let basePrompt = templateData?.ai_prompt_template ?? `Draft a ${campaign_type.replace(/_/g, " ")} pastoral communication for ${churchName}.`;

      // Substitute template variables
      basePrompt = basePrompt
        .replace(/\{church_name\}/g, churchName)
        .replace(/\{pastor_name\}/g, pastorName)
        .replace(/\{theme\}/g, context_data.theme ?? "")
        .replace(/\{soap_themes\}/g, context_data.soap_themes ?? "")
        .replace(/\{event_name\}/g, context_data.event_name ?? "")
        .replace(/\{snapshot_data\}/g, JSON.stringify(context_data.snapshot_data ?? {}));

      const toneGuidance = templateData?.ai_tone ?? "warm, pastoral, encouraging";
      const lengthGuidance = templateData?.ai_target_length ?? 400;

      const prompt = `You are the Church OS Pastoral Communications Intelligence for ${churchName}.

${basePrompt}

Additional context: ${JSON.stringify(context_data)}

Guidelines:
- Tone: ${toneGuidance}
- Target length: ~${lengthGuidance} words for body
- Church name: ${churchName}
- Pastor: ${pastorName}
- Audience: ${audience_scope.replace(/_/g, " ")}

Return ONLY valid JSON (no markdown, no code blocks) with exactly these keys:
{
  "subject_en": "compelling email subject line (English)",
  "subject_ja": "compelling email subject line (Japanese)",
  "body_en": "full email body in English (HTML paragraphs allowed)",
  "body_ja": "full email body in Japanese (HTML paragraphs allowed)",
  "preview_text": "email preview snippet, 90 chars max",
  "cta_label": "call-to-action button label",
  "reasoning": "one sentence: why you drafted it this way",
  "confidence": 0.85,
  "urgency_score": 20,
  "tone": "label describing the emotional tone used"
}`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
            }),
          }
        );
        const geminiData = await geminiRes.json();
        let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (geminiData?.error) {
          console.error("[coce-ai-brain] Gemini error:", JSON.stringify(geminiData.error));
          aiResult.reasoning = `Gemini API error: ${geminiData.error?.message ?? JSON.stringify(geminiData.error)}`;
          aiResult.confidence = 0;
        } else if (rawText) {
          const cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          aiResult = { ...aiResult, ...parsed };
          console.log(`[coce-ai-brain] AI draft generated. confidence=${aiResult.confidence}`);
        }
      } catch (gemErr: any) {
        console.error("[coce-ai-brain] Gemini call failed:", gemErr.message);
        aiResult.reasoning = `AI generation failed: ${gemErr.message}`;
        aiResult.body_en = `[AI draft failed — please compose manually. Error: ${gemErr.message}]`;
        aiResult.body_ja = `[AI下書き失敗 — 手動で作成してください]`;
      }
    }

    // ── Estimate recipients ──
    let estimatedRecipients = 1;
    if (audience_scope === "org_wide") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org_id);
      estimatedRecipients = count ?? 1;
    } else if (audience_scope === "ministry" && audience_filter?.target_id) {
      const { count } = await supabase
        .from("ministry_members")
        .select("id", { count: "exact", head: true })
        .eq("ministry_id", audience_filter.target_id);
      estimatedRecipients = count ?? 1;
    } else if (audience_scope === "subscribers") {
      const { count } = await supabase
        .from("devotion_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org_id)
        .eq("is_active", true);
      estimatedRecipients = count ?? 0;
    }

    // ── Determine auto_send_at ──
    let autoSendAt: string | null = null;
    const isAutoEligible = AUTO_SEND_ELIGIBLE_TYPES.includes(campaign_type);
    const templateEligible = templateData?.auto_send_eligible ?? false;
    if (isAutoEligible && (templateEligible || !campaign_type.startsWith("newsletter_"))) {
      const sendAt = new Date(Date.now() + review_window_minutes * 60 * 1000);
      autoSendAt = sendAt.toISOString();
    }

    // ── Insert communication_drafts ──
    const { data: draft, error: draftError } = await supabase
      .from("communication_drafts")
      .insert({
        org_id,
        trigger_source,
        campaign_type,
        audience_scope,
        audience_filter: audience_filter ?? null,
        recipient_id: recipient_id ?? null,
        human_requested_by: human_requested_by ?? null,
        subject_en: aiResult.subject_en,
        subject_ja: aiResult.subject_ja,
        body_en: aiResult.body_en,
        body_ja: aiResult.body_ja,
        preview_text: aiResult.preview_text,
        cta_label: aiResult.cta_label,
        // Original copies for edit tracking
        original_ai_subject_en: aiResult.subject_en,
        original_ai_subject_ja: aiResult.subject_ja,
        original_ai_body_en: aiResult.body_en,
        original_ai_body_ja: aiResult.body_ja,
        ai_reasoning: aiResult.reasoning,
        ai_confidence: aiResult.confidence,
        ai_urgency_score: aiResult.urgency_score,
        ai_tone: aiResult.tone,
        ai_model_used: geminiKey ? "gemini-2.5-flash-preview-04-17" : null,
        ai_context_used: context_data,
        estimated_recipients: estimatedRecipients,
        auto_send_at: autoSendAt,
        review_status: geminiKey ? "pending_review" : "pending_review",
      })
      .select("id")
      .single();

    if (draftError) {
      console.error("[coce-ai-brain] Draft insert error:", draftError);
      return new Response(
        JSON.stringify({ error: `Draft insert failed: ${draftError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        draft_id: draft.id,
        subject_en: aiResult.subject_en,
        subject_ja: aiResult.subject_ja,
        body_en: aiResult.body_en,
        body_ja: aiResult.body_ja,
        reasoning: aiResult.reasoning,
        confidence: aiResult.confidence,
        auto_send_at: autoSendAt,
        estimated_recipients: estimatedRecipients,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[coce-ai-brain] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function err400(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      status: 400,
    }
  );
}
