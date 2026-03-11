import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

export const PILEngine = {
    /**
     * Run all predictive models and synchronize with the prophetic_insights table.
     * Extended in Phase 3 to include ministry context and write to ai_ministry_insights.
     */
    runIntelligenceSweep: async (orgId: string = 'fa547adf-f820-412f-9458-d6bade11517d') => {
        console.log("🌌 PIL Engine: Starting Intelligence Sweep...");

        // Generate a sweep_id to group all insights from this run
        const sweepId = crypto.randomUUID();

        const results = {
            disengagement: 0,
            geo: 0,
            volunteer: 0,
            ai_insights: 0,
        };

        try {
            // 1. MODEL: Member Drop-Off Risk (7-day silence)
            const { data: atRisk } = await supabase.from('vw_member_disengagement_risk').select('*');
            if (atRisk) {
                for (const member of atRisk) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'drop_off',
                        subject_id: member.user_id,
                        probability_score: member.risk_score,
                        risk_level: member.risk_score >= 80 ? 'critical' : 'high',
                        insight_title: `Disengagement Risk: ${member.name}`,
                        insight_description: `${member.name} has been silent for ${member.days_silent} days. No devotional activity logged since ${member.last_devotion_date}.`,
                        recommended_action: `Initiate a pastoral care call to check on their wellbeing.`,
                        metadata: { days_silent: member.days_silent, last_date: member.last_devotion_date }
                    }, { onConflict: 'category,subject_id' });
                    results.disengagement++;
                }
            }

            // 2. MODEL: Geographic Expansion (Underserved Wards)
            const { data: geoGaps } = await supabase.from('vw_geo_planting_opportunities').select('*');
            if (geoGaps) {
                for (const gap of geoGaps) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'geo',
                        insight_title: `Expansion Alert: ${gap.ward}`,
                        insight_description: `Concentrated cluster of ${gap.member_count} members detected in ${gap.ward} with 0 fellowship groups.`,
                        recommended_action: `Identify a potential leader in this ward to plant a new fellowship circle.`,
                        probability_score: 85,
                        risk_level: 'medium',
                        metadata: { member_count: gap.member_count, ward: gap.ward }
                    }, { onConflict: 'category,insight_title' });
                    results.geo++;
                }
            }

            // 3. MODEL: Volunteer Forecast (Shortage in Missions/Counseling)
            const { data: roles } = await supabase.from('ministry_members').select('ministry_name');
            const totalMembers = roles?.length || 0;
            const minMap: Record<string, number> = {};
            roles?.forEach(r => minMap[r.ministry_name] = (minMap[r.ministry_name] || 0) + 1);

            const criticalMinistries = ['Missions', 'Childrens Ministry', 'Counseling'];
            for (const min of criticalMinistries) {
                const count = minMap[min] || 0;
                const ratio = (count / (totalMembers || 1)) * 100;
                if (ratio < 10) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'volunteer',
                        insight_title: `Volunteer Shortage: ${min}`,
                        insight_description: `${min} currently only has ${count} volunteers (${ratio.toFixed(1)}% of base). Demand is outstripping supply.`,
                        recommended_action: `Review 'Candidate Matching' in Ministries dashboard to recruit matched members.`,
                        probability_score: 95,
                        risk_level: 'high',
                        metadata: { ministry: min, count, ratio }
                    }, { onConflict: 'category,insight_title' });
                    results.volunteer++;
                }
            }

            // 4. MODEL: Attendance Reach Gap (Manual vs Digital)
            const { data: attendanceGaps } = await supabase.from('vw_ministry_performance_alerts').select('*');
            if (attendanceGaps) {
                for (const gap of attendanceGaps) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'ministry_performance',
                        insight_title: `Attendance Reach Gap: ${gap.report_date}`,
                        insight_description: `${gap.gap_percentage?.toFixed(1)}% of attendees did not check-in digitally (${gap.unregistered_count} people).`,
                        recommended_action: `Deploy welcome team at key entrances with QR codes to foster digital engagement.`,
                        probability_score: 80,
                        risk_level: 'medium',
                        metadata: { date: gap.report_date, unregistered_count: gap.unregistered_count }
                    }, { onConflict: 'category,insight_title' });
                }
            }

            // 5. MODEL: Soul Harvest Momentum (Evangelism success)
            const { data: momentum } = await supabase.from('vw_evangelism_momentum').select('*');
            if (momentum) {
                for (const m of momentum) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'conversion',
                        insight_title: `Evangelism Breakthrough: ${m.report_date}`,
                        insight_description: `${m.total_salvations} souls recorded in today's outreach!`,
                        recommended_action: `Ensure immediate discipleship follow-up for all new converts.`,
                        probability_score: 100,
                        risk_level: 'low',
                        metadata: { date: m.report_date, count: m.total_salvations }
                    }, { onConflict: 'category,insight_title' });
                }
            }

            // === PHASE 3: MINISTRY CONTEXT DATA COLLECTION ===
            console.log("🏛️ PIL Engine: Collecting ministry context for Gemini...");

            const { data: ministryData } = await supabaseAdmin
              .from('ministry_analytics')
              .select(`
                ministry_id,
                avg_attendance,
                total_reports,
                salvations,
                visitor_count,
                health_score,
                period_start,
                ministries (
                  name,
                  slug
                )
              `)
              .eq('period_type', 'monthly')
              .order('health_score', { ascending: true });

            const { data: overdueMinistries } = await supabaseAdmin
              .from('ministries')
              .select('id, name, slug')
              .eq('org_id', orgId)
              .eq('is_active', true);

            // Also pull aggregated member summary for Gemini
            const { data: memberSummary } = await supabaseAdmin
                .from('profiles')
                .select('id, discipleship_score')
                .eq('org_id', orgId);

            const avgDiscipleship = memberSummary?.length
                ? Math.round(memberSummary.reduce((s, m) => s + (m.discipleship_score || 0), 0) / memberSummary.length)
                : 0;

            const ministryContext = (ministryData || []).map((m: any) => {
              const ministry = m.ministries as any;
              return `Ministry: ${ministry?.name || 'Unknown'}
Health Score: ${m.health_score ?? 0}/100
Avg Attendance: ${m.avg_attendance ?? 0}
Total Reports This Month: ${m.total_reports ?? 0}
Salvations: ${m.salvations ?? 0}
Visitors: ${m.visitor_count ?? 0}`;
            }).join('\n\n');

            const memberDataSummary = `
Total Members: ${memberSummary?.length || 0}
Average Discipleship Score: ${avgDiscipleship}/100
`;

            // === GEMINI API CALL ===
            const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!GEMINI_API_KEY) {
                console.warn("⚠️  No GEMINI_API_KEY — skipping Gemini sweep");
                console.log("✅ PIL Engine: Sweep Complete (no AI).", results);
                return results;
            }

            const promptSuffix = `

IMPORTANT INSTRUCTIONS:
You must respond with ONLY a valid JSON object.
Do not include any text before or after the JSON.
Do not wrap the JSON in markdown code fences.
Do not include explanations or commentary.
The response must start with { and end with }

Required JSON format:
{
  "insights": [
    {
      "type": "growth",
      "subject": "name of ministry or member group",
      "summary": "one sentence headline under 20 words",
      "detail": "two to three sentences of analysis",
      "recommended_action": "one specific action for leadership",
      "confidence": "high",
      "urgency": "this_month"
    }
  ]
}

Generate between 3 and 5 insights. Valid type values are: growth, risk, opportunity, commendation, correlation.
Valid confidence values are: high, medium, low.
Valid urgency values are: immediate, this_week, this_month, monitor.`;

            const extendedSystemPrompt = `You are the Church OS Ministry Intelligence Engine for Japan Kingdom Church.
Your role is to analyse both individual member data and collective ministry operational data, identify patterns and risks, and generate actionable pastoral insights for church leadership.

MEMBER DATA SUMMARY:
${memberDataSummary}

MINISTRY OPERATIONS DATA (current month):
${ministryContext}`;

            const fullPrompt = extendedSystemPrompt + promptSuffix;

            console.log("🤖 PIL Engine: Calling Gemini API...");

            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: fullPrompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.4,
                            maxOutputTokens: 2048,
                        }
                    })
                }
            );

            if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                console.log("🧠 Gemini response received, parsing...");

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
                        is_approved: false,
                        visible_to_members: false,
                        visible_to_ministry_leaders: true,
                        sweep_id: sweepId,
                      }));

                      const { error: insightError } = await supabaseAdmin
                        .from('ai_ministry_insights')
                        .insert(insightRows);

                      if (insightError) {
                        console.error('Failed to write ministry insights:', insightError);
                      } else {
                        results.ai_insights += insightRows.length;
                      }

                      // Keep existing prophetic_insights write to ensure previous features do not break
                      for (const insight of parsedInsights.insights) {
                         await supabaseAdmin.from('prophetic_insights').insert({
                             category: 'AI Summary',
                             insight_title: `Insight: ${insight.subject}`,
                             insight_description: insight.summary,
                             recommended_action: insight.recommended_action,
                             risk_level: insight.urgency === 'immediate' ? 'critical' : 'medium',
                             is_acknowledged: false
                         });
                      }
                    }
                    console.log(`✅ ${results.ai_insights} AI insights written to ai_ministry_insights and prophetic_insights`);
                } catch (parseErr) {
                    console.error("❌ Gemini JSON parse failure:", parseErr, "Raw:", rawText.slice(0, 500));
                }
            } else {
                const errTxt = await geminiRes.text();
                console.error("❌ Gemini API error:", geminiRes.status, errTxt.slice(0, 300));
            }

            console.log("✅ PIL Engine: Sweep Complete.", results);
            return results;

        } catch (error) {
            console.error("❌ PIL Engine Error:", error);
            throw error;
        }
    }
};
