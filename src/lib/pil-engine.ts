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


        const results = {
            disengagement: 0,
            geo: 0,
            volunteer: 0,
            crisis: 0,
            retention: 0,
            isolation: 0,
            spiritual_climate: 0,
            pastoral_load: 0,
            stewardship: 0,
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
            
            // 3. MODEL: Crisis Early Warning
            const { data: crisisAlerts } = await supabase
                .from('vw_crisis_early_warning')
                .select('*')
                .eq('org_id', orgId);

            if (crisisAlerts) {
                for (const crisis of crisisAlerts) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'crisis',
                        subject_id: crisis.user_id,
                        probability_score: crisis.crisis_score,
                        risk_level: crisis.crisis_score >= 85 ? 'critical' : 'high',
                        insight_title: `Crisis Alert: ${crisis.name}`,
                        insight_description: `${crisis.name} flagged for crisis: ${crisis.days_silent}d silence, ${crisis.active_crisis_prayers} active crisis prayers, ${crisis.negative_soap_sentiment_count} negative SOAP entries.`,
                        recommended_action: `Immediate pastoral intervention required.`,
                        metadata: { score: crisis.crisis_score, prayers: crisis.active_crisis_prayers, soap: crisis.negative_soap_sentiment_count }
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.crisis++;
                }
            }

            // 4. MODEL: New Member 90-Day Health
            const { data: retentionAlerts } = await supabase
                .from('vw_new_member_90day_health')
                .select('*')
                .eq('org_id', orgId)
                .eq('health_status', 'At Risk');

            if (retentionAlerts) {
                for (const member of retentionAlerts) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'retention',
                        subject_id: member.user_id,
                        probability_score: member.attrition_risk_score,
                        risk_level: 'high',
                        insight_title: `Onboarding Risk: ${member.name}`,
                        insight_description: `${member.name} joined < 90 days ago but has zero group/ministry connections and low attendance.`,
                        recommended_action: `Assign a dedicated welcome buddy for connection.`,
                        metadata: { joined_at: member.joined_at, attendance: member.recent_attendance }
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.retention++;
                }
            }

            // 5. MODEL: Community Isolation Risk
            const { data: isolatedMembers } = await supabase
                .from('vw_community_isolation_risk')
                .select('*')
                .eq('org_id', orgId)
                .limit(10);

            if (isolatedMembers) {
                for (const member of isolatedMembers) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'isolation',
                        subject_id: member.user_id,
                        probability_score: 100,
                        risk_level: 'medium',
                        insight_title: `Isolation Risk: ${member.name}`,
                        insight_description: `${member.name} has zero ministry or small group connections. Isolated members are high risk for attrition.`,
                        recommended_action: `Invite to a Bible Study group matching their interests.`,
                        metadata: { joined_at: member.joined_at }
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.isolation++;
                }
            }

            // 6. MODEL: Spiritual Climate Forecast
            const { data: climateData } = await supabase
                .from('vw_spiritual_climate_forecast')
                .select('*')
                .eq('org_id', orgId)
                .single();

            if (climateData) {
                if (climateData.critical_sentiment_count > 0) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'spiritual_climate',
                        subject_id: orgId, // Org-level insight
                        probability_score: Math.min(100, (climateData.critical_sentiment_count / climateData.total_entries) * 200),
                        risk_level: climateData.critical_sentiment_count > 5 ? 'high' : 'medium',
                        insight_title: `Spiritual Climate: Shift Detected`,
                        insight_description: `Congregational sentiment shows ${climateData.critical_sentiment_count} negative entries (anxiety/despair) this week out of ${climateData.total_entries} journals.`,
                        recommended_action: `Speak on peace/provision in upcoming teaching.`,
                        metadata: { distribution: climateData.sentiment_distribution, totals: climateData.total_entries }
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.spiritual_climate++;
                }
            }

            // 7. MODEL: Pastoral Care Load
            const { data: careLoad } = await supabase
                .from('vw_pastoral_care_load')
                .select('*')
                .eq('org_id', orgId)
                .single();

            if (careLoad) {
                if (careLoad.overdue_follow_ups > 0 || careLoad.total_active_cases > 10) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'pastoral_load',
                        subject_id: orgId,
                        probability_score: 90,
                        risk_level: careLoad.overdue_follow_ups > 5 ? 'critical' : 'high',
                        insight_title: `Pastoral Load: Burnout Risk`,
                        insight_description: `There are ${careLoad.total_active_cases} active counseling cases and ${careLoad.overdue_follow_ups} overdue follow-ups. System capacity is reaching limits.`,
                        recommended_action: `Delegate ${Math.ceil(careLoad.total_active_cases * 0.3)} cases to ministry leads.`,
                        metadata: careLoad
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.pastoral_load++;
                }
            }

            // 8. MODEL: Stewardship Health
            const { data: givingHealth } = await supabase
                .from('vw_giving_health_index')
                .select('*')
                .eq('org_id', orgId)
                .single();

            if (givingHealth) {
                if (givingHealth.lapsed_givers_30d > 0) {
                    await supabase.from('prophetic_insights').upsert({
                        org_id: orgId,
                        category: 'stewardship',
                        subject_id: orgId,
                        probability_score: Math.min(100, (givingHealth.lapsed_givers_30d / (givingHealth.active_givers || 1)) * 100),
                        risk_level: 'medium',
                        insight_title: `Stewardship: Giving Consistency Drop`,
                        insight_description: `${givingHealth.lapsed_givers_30d} regular givers have not given in the last 30 days.`,
                        recommended_action: `Send a "Thinking of You" message to regular donors who missed a month.`,
                        metadata: givingHealth
                    }, { onConflict: 'org_id,category,subject_id' });
                    results.stewardship++;
                }
            }

            // 9. PHASE 3: MINISTRY CONTEXT COLLECTION
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

            const crisisContext = (crisisAlerts || []).map(c => 
                `CRITICAL: ${c.name} (Score: ${c.crisis_score}) | Silent: ${c.days_silent}d | Prayers: ${c.active_crisis_prayers}`
            ).join('\n');

            const onboardingContext = (retentionAlerts || []).map(r => 
                `RETENTION: ${r.name} (Status: ${r.health_status}) | Joined: ${r.joined_at}`
            ).join('\n');

            const climateContext = climateData ? 
                `CLIMATE: ${JSON.stringify(climateData.sentiment_distribution)} | Critical: ${climateData.critical_sentiment_count}` : 'N/A';
            
            const careContext = careLoad ? 
                `LOAD: Active: ${careLoad.total_active_cases} | Overdue: ${careLoad.overdue_follow_ups} | Prayers: ${careLoad.active_crisis_prayers}` : 'N/A';
            
            const stewardContext = givingHealth ?
                `STEWARDSHIP: Active: ${givingHealth.active_givers} | Lapsed: ${givingHealth.lapsed_givers_30d}` : 'N/A';

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

Crisis Early Warnings:
${crisisContext}

New Member Onboarding Risks:
${onboardingContext}

Spiritual Climate & Sentiment:
${climateContext}

Pastoral Care Burden:
${careContext}

Financial Stewardship Consistency:
${stewardContext}

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
