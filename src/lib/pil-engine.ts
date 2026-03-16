import { supabase } from "./supabase";

/**
 * PIL (Prophetic Intelligence Layer) Engine
 * In a Static Export environment, this runs on the client.
 * All operations must use the standard 'supabase' client and rely on RLS.
 */
export const PILEngine = {
    /**
     * Run all predictive models and synchronize with the prophetic_insights table.
     */
    runIntelligenceSweep: async (orgId: string) => {
        console.log("🌌 PIL Engine: Starting Intelligence Sweep...");

        // Ensure session exists
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Unauthorized: Identity required for intelligence sweep.");

        const sweepId = crypto.randomUUID();
        const results = {
            disengagement: 0,
            geo: 0,
            volunteer: 0,
            ai_insights: 0,
        };

        try {
            // 1. MODEL: Member Drop-Off Risk
            const { data: atRisk } = await supabase.from('vw_member_disengagement_risk').select('*');
            if (atRisk) {
                for (const member of atRisk) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'drop_off',
                        subject_id: member.user_id,
                        probability_score: member.risk_score,
                        risk_level: member.risk_score >= 80 ? 'critical' : 'high',
                        insight_title: `Disengagement Risk: ${member.name}`,
                        insight_description: `${member.name} has been silent for ${member.days_silent} days.`,
                        recommended_action: `Initiate a pastoral care call.`,
                        metadata: { days_silent: member.days_silent, last_date: member.last_devotion_date }
                    }, { onConflict: 'category,subject_id' });
                    results.disengagement++;
                }
            }

            // 2. MODEL: Geographic Expansion
            const { data: geoGaps } = await supabase.from('vw_geo_planting_opportunities').select('*');
            if (geoGaps) {
                for (const gap of geoGaps) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'geo',
                        insight_title: `Expansion Alert: ${gap.ward}`,
                        insight_description: `Concentrated cluster of ${gap.member_count} members in ${gap.ward}.`,
                        recommended_action: `Evaluate for new fellowship circle.`,
                        probability_score: 85,
                        risk_level: 'medium',
                        metadata: { member_count: gap.member_count, ward: gap.ward }
                    }, { onConflict: 'category,insight_title' });
                    results.geo++;
                }
            }

            // 3. PHASE 3: MINISTRY CONTEXT COLLECTION (Using standard client)
            console.log("🏛️ PIL Engine: Collecting ministry context...");

            const { data: ministryData } = await supabase
              .from('ministry_analytics')
              .select(`
                ministry_id,
                health_score,
                avg_attendance,
                ministries (name, slug)
              `)
              .eq('period_type', 'monthly')
              .order('health_score', { ascending: true });

            const { data: memberSummary } = await supabase
                .from('profiles')
                .select('id, discipleship_score');

            const avgDiscipleship = memberSummary?.length
                ? Math.round(memberSummary.reduce((s, m) => s + (m.discipleship_score || 0), 0) / memberSummary.length)
                : 0;

            const ministryContext = (ministryData || []).map((m: any) => {
              const ministry = m.ministries as any;
              return `Ministry: ${ministry?.name || 'Unknown'} | Health: ${m.health_score ?? 0}/100`;
            }).join('\n');

            const memberDataSummary = `Total Members: ${memberSummary?.length || 0} | Avg Discipleship: ${avgDiscipleship}/100`;

            // === GEMINI API CALL ===
            const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!GEMINI_API_KEY) {
                console.warn("⚠️ No GEMINI_API_KEY — skipping AI sweep");
                return results;
            }

            const fullPrompt = `Analyze this church growth data. Respond in JSON with "insights" array.
Member Summary: ${memberDataSummary}
Ministry Data: ${ministryContext}
Format: { insights: [{ type, subject, summary, detail, recommended_action, confidence, urgency }] }`;

            console.log("🤖 PIL Engine: Calling Gemini API...");
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                        generationConfig: { temperature: 0.4 }
                    })
                }
            );

            if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                try {
                    const cleanText = rawText.replace(/```json|```/g, '').trim();
                    const parsedInsights = JSON.parse(cleanText);

                    if (parsedInsights?.insights && Array.isArray(parsedInsights.insights)) {
                      const insightRows = parsedInsights.insights.map((insight: any) => ({
                        org_id: orgId,
                        generated_by: 'pil_engine_gemini',
                        insight_type: insight.type,
                        subject: insight.subject,
                        summary: insight.summary,
                        detail: insight.detail,
                        recommended_action: insight.recommended_action,
                        confidence: insight.confidence,
                        urgency: insight.urgency,
                        sweep_id: sweepId,
                      }));

                      const { error: insightError } = await supabase
                        .from('ai_ministry_insights')
                        .insert(insightRows);

                      if (insightError) console.error('RLS Error: Failed to write insights. Check permissions.', insightError);
                      else results.ai_insights += insightRows.length;
                    }
                } catch (parseErr) {
                    console.error("❌ Gemini Parse failure:", parseErr);
                }
            } else {
                console.error("❌ Gemini API error:", geminiRes.status);
            }

            console.log("✅ PIL Engine: Sweep Complete.", results);
            return results;

        } catch (error) {
            console.error("❌ PIL Engine Exception:", error);
            throw error;
        }
    }
};
