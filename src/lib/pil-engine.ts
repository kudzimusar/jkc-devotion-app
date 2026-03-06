import { supabase } from "./supabase";

export const PILEngine = {
    /**
     * Run all predictive models and synchronize with the prophetic_insights table.
     * This is the "Heart" of the Prophetic Intelligence Layer.
     */
    runIntelligenceSweep: async () => {
        console.log("🌌 PIL Engine: Starting Intelligence Sweep...");

        const results = {
            disengagement: 0,
            geo: 0,
            volunteer: 0
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
                    }, { onConflict: 'category,insight_title' }); // Using title as unique for general insights
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
                if (ratio < 10) { // Less than 10% participation
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

            // 4. [NEW] MODEL: Attendance Reach Gap (Manual vs Digital)
            const { data: attendanceGaps } = await supabase.from('vw_ministry_performance_alerts').select('*');
            if (attendanceGaps) {
                for (const gap of attendanceGaps) {
                    await supabase.from('prophetic_insights').upsert({
                        category: 'ministry_performance',
                        insight_title: `Attendance Reach Gap: ${gap.report_date}`,
                        insight_description: `${gap.gap_percentage.toFixed(1)}% of attendees did not check-in digitally (${gap.unregistered_count} people).`,
                        recommended_action: `Deploy welcome team at key entrances with QR codes to foster digital engagement.`,
                        probability_score: 80,
                        risk_level: 'medium',
                        metadata: { date: gap.report_date, unregistered_count: gap.unregistered_count }
                    }, { onConflict: 'category,insight_title' });
                }
            }

            // 5. [NEW] MODEL: Soul Harvest Momentum (Evangelism success)
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

            console.log("✅ PIL Engine: Sweep Complete.", results);
            return results;

        } catch (error) {
            console.error("❌ PIL Engine Error:", error);
            throw error;
        }
    }
};
