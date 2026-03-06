import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * 🛰️ AI SHEPHERD: INTELLIGENCE ENGINE RUNNER
 * This route executes the Prophetic Intelligence Layer (PIL) logic.
 * It detects risks, calculates health scores, and generates AI insights.
 */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        // Basic security: Check for Service Role or secret key if needed
        // For now, we'll allow it but in production this should be protected by a CRON_SECRET

        console.log('🔍 Starting Intelligence Engine Execution...');

        // 1. Fetch Core Data
        const [statsRes, prayersRes, attendanceRes, profilesRes, rolesRes] = await Promise.all([
            supabaseAdmin.from('member_stats').select('user_id, last_devotion_date, current_streak'),
            supabaseAdmin.from('prayer_requests').select('user_id, urgency, status').eq('status', 'active'),
            supabaseAdmin.from('attendance_records').select('id, event_date').gt('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
            supabaseAdmin.from('profiles').select('id'),
            supabaseAdmin.from('ministry_members').select('id').eq('is_active', true)
        ]);

        const stats = statsRes.data || [];
        const prayers = prayersRes.data || [];
        const attendanceCount = attendanceRes.data?.length || 0;
        const memberCount = profilesRes.data?.length || 1;
        const activeRolesCount = rolesRes.data?.length || 0;

        const now = new Date();
        const alerts = [];

        // --- ENGINE 1: MEMBER RISK DETECTION ---
        for (const s of stats) {
            // Risk: Spiritual Inactivity (> 7 days)
            if (s.last_devotion_date) {
                const lastDate = new Date(s.last_devotion_date);
                const diffDays = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays > 7) {
                    alerts.push({
                        member_id: s.user_id,
                        alert_type: 'Inactivity',
                        severity: diffDays > 14 ? 'critical' : 'medium'
                    });
                }
            }

            // Risk: Crisis Prayer Surges
            const userPrayers = prayers.filter(p => p.user_id === s.user_id && p.urgency === 'crisis');
            if (userPrayers.length >= 1) {
                alerts.push({
                    member_id: s.user_id,
                    alert_type: 'Crisis Detection',
                    severity: 'critical'
                });
            }
        }

        if (alerts.length > 0) {
            await supabaseAdmin.from('member_alerts').upsert(alerts, { onConflict: 'member_id, alert_type' });
        }

        // --- ENGINE 2: CHURCH HEALTH SCORING ---
        const attendanceIndex = Math.min(100, Math.round((attendanceCount / (memberCount * 4)) * 100));
        const engagementIndex = stats.length ? Math.round((stats.filter(s => s.current_streak > 0).length / stats.length) * 100) : 0;
        const serviceIndex = Math.min(100, Math.round((activeRolesCount / memberCount) * 100));

        // Composite Health Score
        const totalScore = Math.round(
            (attendanceIndex * 0.3) +
            (engagementIndex * 0.4) +
            (serviceIndex * 0.3)
        );

        await supabaseAdmin.from('church_health_metrics').insert([{
            score: totalScore,
            attendance_index: attendanceIndex,
            engagement_index: engagementIndex,
            service_index: serviceIndex,
            prayer_index: 75, // Placeholder for now
            community_index: 68
        }]);

        return NextResponse.json({
            success: true,
            execution_time: new Date().toISOString(),
            processed_members: stats.length,
            alerts_generated: alerts.length,
            new_health_score: totalScore
        });

    } catch (error: any) {
        console.error('Intelligence Engine Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
