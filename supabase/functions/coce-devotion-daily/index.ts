import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  const body = await req.json().catch(() => ({}));
  const { org_id: targetOrgId, devotion_date } = body;

  // Default to today in JST (UTC+9)
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const dateStr = devotion_date ?? jstNow.toISOString().split("T")[0];

  const summary: any[] = [];
  const errors: any[] = [];

  try {
    // ── Determine orgs to process ──
    let orgs: any[] = [];
    if (targetOrgId) {
      orgs = [{ id: targetOrgId }];
    } else {
      const { data } = await supabase
        .from("communication_schedules")
        .select("org_id")
        .eq("stream_type", "devotion_daily")
        .eq("is_active", true);
      orgs = (data ?? []).map((r: any) => ({ id: r.org_id }));
    }

    for (const org of orgs) {
      try {
        const orgId = org.id;

        // ── Fetch today's devotion ──
        const { data: devotion } = await supabase
          .from("devotions")
          .select("*")
          .eq("org_id", orgId)
          .eq("date", dateStr)
          .single();

        if (!devotion) {
          console.warn(`[coce-devotion-daily] No devotion for org=${orgId} date=${dateStr}`);
          errors.push({ org_id: orgId, error: "No devotion found for today" });
          continue;
        }

        // ── Fetch email design & config ──
        const [
          { data: emailDesign },
          { data: emailConfig },
          { data: orgData },
        ] = await Promise.all([
          supabase.from("devotion_email_designs").select("*").eq("org_id", orgId).single(),
          supabase.from("church_email_config").select("*").eq("org_id", orgId).single(),
          supabase.from("organizations").select("name, logo_url, church_slug").eq("id", orgId).single(),
        ]);

        const churchSlug = orgData?.church_slug ?? "jkc";
        const senderName = emailConfig?.sender_display_name ?? orgData?.name ?? "Church OS";
        const senderEmail = emailConfig?.noreply_address ?? "noreply@churchos-ai.website";

        // ── Fetch member recipients ──
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("org_id", orgId);

        const memberIds = (memberProfiles ?? []).map((p: any) => p.id);

        const { data: commProfiles } = memberIds.length > 0
          ? await supabase
              .from("member_communication_profiles")
              .select("member_id, preferred_language, receive_devotion_email, fully_unsubscribed, unsubscribe_token, email")
              .in("member_id", memberIds)
              .eq("receive_devotion_email", true)
              .eq("fully_unsubscribed", false)
          : { data: [] };

        // ── Fetch subscriber recipients ──
        const { data: subscribers } = await supabase
          .from("devotion_subscribers")
          .select("id, email, name, preferred_language")
          .eq("org_id", orgId)
          .eq("is_active", true);

        const totalRecipients = (commProfiles?.length ?? 0) + (subscribers?.length ?? 0);
        if (totalRecipients === 0) {
          errors.push({ org_id: orgId, error: "No recipients configured" });
          continue;
        }

        // ── Build member context map ──
        const memberContextMap: Record<string, any> = {};
        for (const cp of commProfiles ?? []) {
          const [{ data: soapEntries }, { data: stats }] = await Promise.all([
            supabase.from("soap_entries").select("scripture_reference, observation, reflection, day_number").eq("user_id", cp.member_id).order("day_number", { ascending: false }).limit(3),
            supabase.from("member_stats").select("current_streak, total_devotions_completed").eq("user_id", cp.member_id).single(),
          ]);
          const profile = memberProfiles?.find((p: any) => p.id === cp.member_id);
          memberContextMap[cp.member_id] = {
            name: profile?.name ?? "Friend",
            email: cp.email ?? profile?.email,
            preferred_language: cp.preferred_language ?? "en",
            unsubscribe_token: cp.unsubscribe_token,
            streak: stats?.current_streak ?? 0,
            total_completed: stats?.total_devotions_completed ?? 0,
            recent_soap: soapEntries ?? [],
          };
        }

        // ── Call coce-ai-brain for master draft ──
        const brainRes = await fetch(`${SUPABASE_URL}/functions/v1/coce-ai-brain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            trigger_source: "cron_devotion",
            campaign_type: "devotion_reminder",
            audience_scope: "org_wide",
            context_data: {
              devotion_id: devotion.id,
              devotion_date: dateStr,
              scripture: devotion.scripture_reference,
              title: devotion.title,
              theme: devotion.theme ?? devotion.week_theme,
              declaration: devotion.declaration,
              reflection_question: devotion.reflection_question,
              member_contexts: Object.values(memberContextMap).slice(0, 5), // sample for AI
            },
            review_window_minutes: 0, // send immediately after draft
          }),
        });

        let masterDraft: any = {};
        if (brainRes.ok) {
          masterDraft = await brainRes.json();
        } else {
          const errText = await brainRes.text();
          errors.push({ org_id: orgId, error: `coce-ai-brain failed: ${errText}` });
          continue;
        }

        // ── Create ONE campaign ──
        const { data: campaign } = await supabase
          .from("communication_campaigns")
          .insert({
            org_id: orgId,
            title: `Daily Devotion — ${dateStr}`,
            campaign_type: "devotion_reminder",
            subject_en: masterDraft.subject_en ?? `Today's Devotion — ${devotion.title}`,
            subject_ja: masterDraft.subject_ja ?? `今日のデボーション — ${devotion.title}`,
            body_en: masterDraft.body_en ?? devotion.content_en ?? devotion.body ?? "",
            body_ja: masterDraft.body_ja ?? devotion.content_ja ?? "",
            channels: ["email"],
            audience_scope: "org_wide",
            status: "draft",
            trigger_type: "weekly_cron",
            ai_drafted: true,
          })
          .select("id")
          .single();

        if (!campaign) {
          errors.push({ org_id: orgId, error: "Campaign insert failed" });
          continue;
        }

        // ── Build per-member personalised HTML + log entries ──
        const perMemberBodies: Record<string, { body_en: string; body_ja: string }> = {};
        const devotionLogInserts: any[] = [];

        for (const cp of commProfiles ?? []) {
          const ctx = memberContextMap[cp.member_id];
          const isJa = ctx.preferred_language === "ja";
          const memberCtaUrl = `https://app.churchos-ai.website/${churchSlug}/member/devotions?date=${dateStr}`;

          let personalReflection = devotion.reflection_question ?? "";

          // Personalise reflection question with AI if member has SOAP history
          if (geminiKey && ctx.recent_soap.length > 0) {
            try {
              const personPrompt = `You are personalising a church devotion reflection question for ${ctx.name}.
Their recent SOAP entries: ${JSON.stringify(ctx.recent_soap)}
Today's devotion scripture: ${devotion.scripture_reference}
Default reflection question: ${devotion.reflection_question}

Write a 1-2 sentence reflection question that feels personal to their recent spiritual journey. Keep it warm and pastoral.
Return ONLY the question text, no JSON.`;

              const pRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: personPrompt }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
                  }),
                }
              );
              const pData = await pRes.json();
              personalReflection = pData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? personalReflection;
            } catch (_e) { /* use default */ }
          }

          const greeting = isJa
            ? `おはようございます、${ctx.name}。今日で${ctx.streak}日目のデボーションです。`
            : `Good morning, ${ctx.name}. Day ${ctx.streak} of your devotion journey.`;

          const unsubUrl = ctx.unsubscribe_token
            ? `https://app.churchos-ai.website/unsubscribe?token=${ctx.unsubscribe_token}`
            : `https://app.churchos-ai.website/${churchSlug}/member/settings`;

          const htmlBody = buildDevotionEmail({
            churchName: orgData?.name ?? "Church",
            logoUrl: orgData?.logo_url,
            greeting,
            weekTheme: devotion.week_theme ?? "",
            scripture: devotion.scripture_reference ?? "",
            pastoralContext: masterDraft.body_en ?? devotion.body ?? "",
            reflectionQuestion: personalReflection,
            declaration: devotion.declaration ?? "",
            ctaUrl: memberCtaUrl,
            ctaLabel: isJa ? "今日の振り返りを書く" : "Write Your Reflection",
            streak: ctx.streak,
            totalCompleted: ctx.total_completed,
            unsubUrl,
            isJa,
          });

          perMemberBodies[cp.member_id] = { body_en: htmlBody, body_ja: htmlBody };

          devotionLogInserts.push({
            org_id: orgId,
            campaign_id: campaign.id,
            devotion_id: devotion.id,
            devotion_date: dateStr,
            recipient_type: "member",
            recipient_type_resolved: "member",
            member_id: cp.member_id,
            email: ctx.email,
            preferred_language: ctx.preferred_language,
            cta_url_used: memberCtaUrl,
            personalisation_elements: {
              greeting_personalised: true,
              reflection_personalised: ctx.recent_soap.length > 0,
              streak: ctx.streak,
            },
          });
        }

        // ── Subscriber emails (master draft, no personalisation) ──
        for (const sub of subscribers ?? []) {
          const subCtaUrl = `https://devotion.churchos-ai.website/devotions/${dateStr}`;
          devotionLogInserts.push({
            org_id: orgId,
            campaign_id: campaign.id,
            devotion_id: devotion.id,
            devotion_date: dateStr,
            recipient_type: "subscriber",
            recipient_type_resolved: "subscriber",
            subscriber_id: sub.id,
            email: sub.email,
            preferred_language: sub.preferred_language ?? "en",
            cta_url_used: subCtaUrl,
            personalisation_elements: { greeting_personalised: false, reflection_personalised: false },
          });
        }

        // ── Insert devotion_email_log ──
        if (devotionLogInserts.length > 0) {
          await supabase.from("devotion_email_log").insert(devotionLogInserts);
        }

        // ── Call coce-dispatch ──
        await fetch(`${SUPABASE_URL}/functions/v1/coce-dispatch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            campaign_id: campaign.id,
            per_member_bodies: perMemberBodies,
          }),
        });

        summary.push({
          org_id: orgId,
          devotion_date: dateStr,
          campaign_id: campaign.id,
          members_queued: commProfiles?.length ?? 0,
          subscribers_queued: subscribers?.length ?? 0,
        });
      } catch (orgErr: any) {
        console.error(`[coce-devotion-daily] org=${org.id} error:`, orgErr.message);
        errors.push({ org_id: org.id, error: orgErr.message });
      }
    }

    return new Response(
      JSON.stringify({ summary, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[coce-devotion-daily] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/** Build the branded devotion email HTML */
function buildDevotionEmail(opts: {
  churchName: string;
  logoUrl?: string | null;
  greeting: string;
  weekTheme: string;
  scripture: string;
  pastoralContext: string;
  reflectionQuestion: string;
  declaration: string;
  ctaUrl: string;
  ctaLabel: string;
  streak: number;
  totalCompleted: number;
  unsubUrl: string;
  isJa: boolean;
}): string {
  const { churchName, logoUrl, greeting, weekTheme, scripture, pastoralContext,
    reflectionQuestion, declaration, ctaUrl, ctaLabel, streak, totalCompleted, unsubUrl, isJa } = opts;

  return `<!DOCTYPE html>
<html lang="${isJa ? "ja" : "en"}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${isJa ? "今日のデボーション" : "Today's Devotion"}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 24px;text-align:center;border-bottom:1px solid rgba(245,166,35,0.3);">
    ${logoUrl ? `<img src="${logoUrl}" alt="${churchName}" style="height:48px;margin-bottom:16px;">` : ""}
    <p style="color:#f5a623;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px;">${churchName}</p>
    <p style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0;">${isJa ? "今日のデボーション" : "DAILY DEVOTION"}</p>
  </div>

  <!-- Greeting -->
  <div style="padding:24px 24px 0;">
    <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 8px;">${greeting}</p>
    ${streak > 0 ? `<p style="color:#f5a623;font-size:12px;font-weight:700;margin:0;">🔥 ${streak}-${isJa ? "日連続" : "day streak"}</p>` : ""}
  </div>

  <!-- Week theme bar -->
  ${weekTheme ? `<div style="margin:20px 24px 0;padding:12px 16px;background:rgba(245,166,35,0.1);border-left:3px solid #f5a623;border-radius:0 8px 8px 0;">
    <p style="color:#f5a623;font-size:10px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 4px;">${isJa ? "今週のテーマ" : "THIS WEEK'S THEME"}</p>
    <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0;">${weekTheme}</p>
  </div>` : ""}

  <!-- Scripture -->
  <div style="padding:24px;text-align:center;">
    <p style="color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 12px;">${isJa ? "今日の聖書箇所" : "TODAY'S SCRIPTURE"}</p>
    <p style="color:#f5a623;font-size:20px;font-weight:700;margin:0;">${scripture}</p>
  </div>

  <!-- Pastoral context -->
  <div style="padding:0 24px 24px;">
    <div style="color:#cbd5e1;font-size:15px;line-height:1.8;">${pastoralContext}</div>
  </div>

  <!-- Reflection question -->
  <div style="margin:0 24px 24px;padding:20px;background:rgba(15,23,42,0.5);border-radius:12px;text-align:center;">
    <p style="color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 12px;">${isJa ? "振り返りの問い" : "REFLECTION QUESTION"}</p>
    <p style="color:#e2e8f0;font-size:16px;font-weight:700;line-height:1.6;margin:0;">${reflectionQuestion}</p>
  </div>

  <!-- Declaration -->
  ${declaration ? `<div style="margin:0 24px 24px;padding:16px 20px;border:1px solid rgba(245,166,35,0.3);border-radius:12px;">
    <p style="color:#f5a623;font-size:10px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">${isJa ? "今日の宣言" : "TODAY'S DECLARATION"}</p>
    <p style="color:#e2e8f0;font-size:14px;font-style:italic;line-height:1.6;margin:0;">${declaration}</p>
  </div>` : ""}

  <!-- CTA -->
  <div style="padding:0 24px 32px;text-align:center;">
    <a href="${ctaUrl}" style="display:inline-block;background:#f5a623;color:#0f172a;font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;padding:14px 32px;border-radius:50px;text-decoration:none;">${ctaLabel}</a>
  </div>

  <!-- Stats footer -->
  <div style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:center;gap:32px;text-align:center;">
    <div>
      <p style="color:#f5a623;font-size:18px;font-weight:800;margin:0;">${streak}</p>
      <p style="color:#64748b;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:4px 0 0;">${isJa ? "連続日数" : "STREAK"}</p>
    </div>
    <div>
      <p style="color:#f5a623;font-size:18px;font-weight:800;margin:0;">${totalCompleted}</p>
      <p style="color:#64748b;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:4px 0 0;">${isJa ? "完了数" : "COMPLETED"}</p>
    </div>
  </div>

  <!-- Unsubscribe -->
  <div style="padding:16px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="color:#475569;font-size:11px;margin:0;">${isJa ? "配信停止は" : "To unsubscribe, "}<a href="${unsubUrl}" style="color:#64748b;">${isJa ? "こちら" : "click here"}</a></p>
  </div>

</div>
</body>
</html>`;
}
