import { supabaseAdmin as supabase } from "./supabase-admin";

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
                        recommended_action: `Evaluate for new Bible study group.`,
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

            // NEW: Fetch Skill Gaps and Talent Pool for AI matching
            const { data: skillGaps } = await supabase
                .from('vw_ministry_skill_gaps')
                .select('*')
                .eq('org_id', orgId);

            const { data: talentPool } = await supabase
                .from('vw_member_talent_pool')
                .select('name, email, skills, current_ministries')
                .eq('org_id', orgId)
                .limit(15);

            const avgDiscipleship = memberSummary?.length
                ? Math.round(memberSummary.reduce((s, m) => s + (m.discipleship_score || 0), 0) / memberSummary.length)
                : 0;

            const ministryContext = (ministryData || []).map((m: any) => {
              return `Ministry: ${m.name || 'Unknown'} | Health: ${m.health_score ?? 0}/100`;
            }).join('\n');

            const skillGapContext = (skillGaps || []).map(g => 
                `Ministry: ${g.ministry_name} | Volunteers: ${g.volunteer_count} | Skilled: ${g.skilled_volunteers_count}`
            ).join('\n');

            const talentContext = (talentPool || []).map(t => 
                `Member: ${t.name} | Skills: ${JSON.stringify(t.skills)} | In: ${JSON.stringify(t.current_ministries)}`
            ).join('\n');

            const memberDataSummary = `Total Members: ${memberSummary?.length || 0} | Avg Discipleship: ${avgDiscipleship}/100`;

            const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!GEMINI_API_KEY) {
                console.warn("⚠️ No GEMINI_API_KEY — skipping AI sweep");
                return results;
            }

            const fullPrompt = `Analyze church growth data. Generate 3-5 high-impact insights for the Pastor.
Member Summary: ${memberDataSummary}
Ministry Status:
${ministryContext}

Ministry Skill Gaps (Low 'Skilled' count means recruitment need):
${skillGapContext}

Available Talent Pool (Members with skills not in matching ministries):
${talentContext}

Output JSON: { "insights": [{ "subject": "e.g., Media Ministry", "summary": "Short title", "detail": "Description", "recommended_action": "Action to take", "insight_type": "opportunity", "urgency": "this_week" }] }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
                        
                        for (const insight of parsed.insights) {
                            const { error: insertErr } = await supabase.from('prophetic_insights').insert({
                                org_id: orgId,
                                category: insight.insight_type || 'growth',
                                insight_title: `${insight.subject}: ${insight.summary}`,
                                insight_description: insight.detail || '',
                                recommended_action: insight.recommended_action || '',
                                risk_level: insight.urgency === 'this_week' || insight.urgency === 'immediate' ? 'critical' : 'medium',
                                is_acknowledged: false,
                                metadata: { 
                                    is_ai_generated: true, 
                                    subject: insight.subject, 
                                    summary: insight.summary,
                                    urgency: insight.urgency
                                }
                            });
                            if (insertErr) {
                                console.error("❌ PI Engine: Insert failure on insight:", insertErr);
                            } else {
                                results.ai_insights++;
                                console.log("✨ PI Engine: Saved new insight:", insight.summary);
                            }
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
