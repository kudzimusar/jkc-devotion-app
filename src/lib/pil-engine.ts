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

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Unauthorized: Identity required for intelligence sweep.");

        const results = {
            disengagement: 0,
            geo: 0,
            volunteer: 0,
            ai_insights: 0,
        };

        try {
            // 1. MODEL: Member Drop-Off Risk
            const { data: atRisk } = await supabase
                .from('vw_member_disengagement_risk')
                .select('*')
                .eq('org_id', orgId);

            if (atRisk) {
                for (const member of atRisk) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'drop_off',
                        subject_id: member.user_id,
                        probability_score: member.risk_score,
                        risk_level: member.risk_score >= 80 ? 'critical' : 'high',
                        insight_title: `Disengagement Risk: ${member.name}`,
                        insight_description: `${member.name} has been silent for ${member.days_silent} days.`,
                        recommended_action: `Initiate a pastoral care call.`,
                        metadata: { days_silent: member.days_silent, last_date: member.last_devotion_date }
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.disengagement++;
                }
            }

            // 2. MODEL: Geographic Expansion
            const { data: geoGaps } = await supabase
                .from('vw_geo_planting_opportunities')
                .select('*')
                .eq('org_id', orgId);

            if (geoGaps) {
                for (const gap of geoGaps) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'geo',
                        insight_title: `Expansion Alert: ${gap.ward}`,
                        insight_description: `Concentrated cluster of ${gap.member_count} members in ${gap.ward}.`,
                        recommended_action: `Evaluate for new fellowship circle.`,
                        probability_score: 85,
                        risk_level: 'medium',
                        metadata: { member_count: gap.member_count, ward: gap.ward }
                    }, { onConflict: 'org_id,category,insight_title' });
                    results.geo++;
                }
            }

            // 3. PHASE 3: MINISTRY CONTEXT COLLECTION
            console.log("🏛️ PIL Engine: Collecting ministry context...");

            const { data: ministryData } = await supabase
              .from('vw_ministry_hub')
              .select(`id, name, health_score, avg_attendance`)
              .eq('org_id', orgId)
              .limit(10);

            const { data: memberSummary } = await supabase
                .from('profiles')
                .select('id, discipleship_score')
                .eq('org_id', orgId);

            const avgDiscipleship = memberSummary?.length
                ? Math.round(memberSummary.reduce((s, m) => s + (m.discipleship_score || 0), 0) / memberSummary.length)
                : 0;

            const ministryContext = (ministryData || []).map((m: any) => {
              return `Ministry: ${m.name || 'Unknown'} | Health: ${m.health_score ?? 0}/100`;
            }).join('\n');

            const memberDataSummary = `Total Members: ${memberSummary?.length || 0} | Avg Discipleship: ${avgDiscipleship}/100`;

            const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!GEMINI_API_KEY) {
                console.warn("⚠️ No GEMINI_API_KEY — skipping AI sweep");
                return results;
            }

            const fullPrompt = `Analyze this church growth data. Respond in JSON with "insights" array.
Member Summary: ${memberDataSummary}
Ministry Status:
${ministryContext}

Output JSON: { "insights": [{ "title": string, "summary": string, "priority": "high"|"low", "theme": "growth"|"risk" }] }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (aiText) {
                    try {
                        const cleaned = aiText.replace(/```json|```/g, '').trim();
                        const parsed = JSON.parse(cleaned);
                        
                        for (const insight of parsed.insights || []) {
                            await supabase.from('ai_ministry_insights').insert({
                                org_id: orgId,
                                title: insight.title,
                                description: insight.summary,
                                priority: insight.priority || 'medium',
                                category: insight.theme || 'growth',
                                is_approved: false
                            });
                            results.ai_insights++;
                        }
                    } catch (parseErr) {
                        console.error("❌ Gemini Parse failure:", parseErr);
                    }
                }
            } else {
                console.error("❌ Gemini API error:", response.status);
            }

            console.log("✅ PIL Engine: Sweep Complete.", results);
            return results;

        } catch (error) {
            console.error("❌ PIL Engine Exception:", error);
            throw error;
        }
    }
};
