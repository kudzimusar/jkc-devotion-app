import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { org_id, intent, campaign_type, audience_scope, target_id, audience_filter, channels, scheduled_at, created_by, subject_override } = await req.json();

    if (!org_id || !intent || !campaign_type) {
      return new Response(JSON.stringify({ error: "Missing required fields: org_id, intent, campaign_type" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const { data: org, error: orgErr } = await supabase.from("organizations").select("name, country").eq("id", org_id).single();
    if (orgErr) console.error(`[coce-compose] org error: ${orgErr.message}`);

    const { data: healthMetrics } = await supabase
      .from("church_health_metrics")
      .select("score, attendance_index, engagement_index, prayer_index, community_index")
      .eq("org_id", org_id)
      .order("created_at", { ascending: false })
      .limit(3);

    const { data: recentAttendance } = await supabase
      .from("attendance_logs")
      .select("service_date, status")
      .eq("org_id", org_id)
      .order("service_date", { ascending: false })
      .limit(10);

    const needsLine = Array.isArray(channels) && channels.includes("line");
    const needsSms = Array.isArray(channels) && channels.includes("sms");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const churchName = org?.name ?? "our church";

    console.log(`[coce-compose] org="${churchName}" | gemini=${!!geminiKey}`);

    const latestHealth = healthMetrics?.[0];
    const healthSummary = latestHealth
      ? `Overall score: ${latestHealth.score}, Attendance: ${latestHealth.attendance_index}, Engagement: ${latestHealth.engagement_index}, Prayer: ${latestHealth.prayer_index}`
      : "No health metrics available";

    const presentCount = recentAttendance?.filter((a: any) => a.status === "present").length ?? 0;
    const attendanceSummary = recentAttendance && recentAttendance.length > 0
      ? `${presentCount} present across ${recentAttendance.length} recent service records`
      : "No recent attendance data";

    let draft: Record<string, string> = {
      subject_en: `Update from ${churchName}`,
      subject_ja: `${churchName}からのお知らせ`,
      body_en: intent,
      body_ja: intent,
      send_time_suggestion: "Consider sending on Sunday morning or Wednesday evening for best engagement.",
    };

    if (geminiKey) {
      const channelInstructions = [
        `"subject_en": compelling email subject line (English)`,
        `"subject_ja": compelling email subject line (Japanese)`,
        `"body_en": warm pastoral email body (English, 3-5 paragraphs)`,
        `"body_ja": pastoral email body (Japanese, matching tone and length)`,
        needsLine ? `"line_message_en": punchy LINE message (English, max 3 sentences, casual and warm)` : "",
        needsLine ? `"line_message_ja": LINE message (Japanese, max 3 sentences)` : "",
        needsSms ? `"sms_message_en": SMS text (English, max 160 chars)` : "",
        needsSms ? `"sms_message_ja": SMS text (Japanese, max 70 chars)` : "",
        `"send_time_suggestion": one sentence on the best time to send this type of message`,
      ].filter(Boolean).join(", ");

      const prompt = `You are the Church OS Pastoral Communications Intelligence for ${churchName}.
Draft a ${campaign_type.replace(/_/g, " ")} message based on this pastoral intent: "${intent}"

Church context:
- Health: ${healthSummary}
- Attendance: ${attendanceSummary}
- Audience: ${(audience_scope || "org_wide").replace(/_/g, " ")}
- From: Church leadership team

Use real numbers from the context above. Be warm, pastoral, encouraging. No placeholder text.

Return ONLY valid JSON with these keys: ${channelInstructions}

NO markdown. NO code blocks.`;

      let rawText = "";
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } }),
          }
        );
        const geminiData = await geminiRes.json();
        rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (geminiData?.error) console.error(`[coce-compose] Gemini error: ${JSON.stringify(geminiData.error)}`);

        let cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        if (cleanJson) {
          if (!cleanJson.endsWith("}")) cleanJson += "\"}";
          const parsed = JSON.parse(cleanJson);
          draft = { ...draft, ...parsed };
          console.log(`[coce-compose] AI draft generated with gemini-2.5-flash ✓`);
        }
      } catch (gemErr: any) {
        console.error("[coce-compose] Gemini error:", gemErr.message, rawText.substring(0, 100));
      }
    } else {
      console.warn("[coce-compose] No GEMINI_API_KEY — using intent as fallback draft");
      draft = {
        subject_en: `Message from ${churchName}`,
        subject_ja: `${churchName}からのメッセージ`,
        body_en: intent,
        body_ja: `(Japanese translation pending)\n\n${intent}`,
        send_time_suggestion: "Consider sending on Sunday morning or Wednesday evening.",
      };
      if (needsLine) { draft.line_message_en = intent.substring(0, 200); draft.line_message_ja = `(翻訳保留) ${intent.substring(0, 150)}`; }
      if (needsSms) { draft.sms_message_en = intent.substring(0, 160); draft.sms_message_ja = intent.substring(0, 70); }
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("communication_campaigns")
      .insert({
        org_id,
        title: subject_override || draft.subject_en || `Draft: ${campaign_type}`,
        campaign_type,
        subject_en: subject_override || draft.subject_en,
        subject_ja: draft.subject_ja,
        body_en: draft.body_en,
        body_ja: draft.body_ja,
        ai_drafted: !!geminiKey,
        ai_prompt_used: intent,
        ai_model_used: geminiKey ? "gemini-2.5-flash-preview-04-17" : null,
        ai_context_used: { health_metrics: healthMetrics, recent_attendance: recentAttendance },
        audience_scope: audience_scope ?? "org_wide",
        audience_filter: audience_filter || (target_id ? { target_id } : null),
        channels: channels ?? ["email"],
        status: "draft",
        scheduled_at: scheduled_at ?? null,
        trigger_type: "manual",
        created_by: created_by ?? null,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("[coce-compose] Campaign insert error:", campaignError);
      return new Response(JSON.stringify({ error: campaignError.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    return new Response(JSON.stringify({ success: true, campaign_id: campaign.id, draft }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (err: any) {
    console.error("[coce-compose] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal server error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
