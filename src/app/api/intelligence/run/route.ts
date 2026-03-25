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
        const body = await req.json().catch(() => ({}));
        const orgId = body.org_id || 'fa547adf-f820-412f-9458-d6bade11517d';
        const eventId = crypto.randomUUID();

        // Log initiation of the sweep
        await supabaseAdmin.from('system_activity_logs').insert({
            id: eventId,
            org_id: orgId,
            action: 'INTELLIGENCE_SWEEP',
            details: 'Started Intelligence Engine Sweep',
            metadata: { status: 'started', timestamp: new Date().toISOString() }
        });

        // 1. Fetch Core Data
        const [statsRes, prayersRes, attendanceRes, profilesRes, rolesRes] = await Promise.all([
            supabaseAdmin.from('member_stats').select('user_id, last_devotion_date, current_streak').eq('org_id', orgId),
            supabaseAdmin.from('prayer_requests').select('user_id, urgency, status').eq('status', 'active').eq('org_id', orgId),
            supabaseAdmin.from('attendance_records').select('id, event_date').gt('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).eq('org_id', orgId),
            supabaseAdmin.from('profiles').select('id').eq('org_id', orgId),
            supabaseAdmin.from('ministry_members').select('id').eq('is_active', true).eq('org_id', orgId)
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
                        org_id: orgId,
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
                    org_id: orgId,
                    member_id: s.user_id,
                    alert_type: 'Crisis Detection',
                    severity: 'critical'
                });
            }
        }

        if (alerts.length > 0) {
            await supabaseAdmin.from('member_alerts').upsert(alerts, { onConflict: 'org_id,member_id,alert_type' });
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

        // 4. Save to dashboard history table
        await supabaseAdmin.from('church_health_metrics').insert([{
            org_id: orgId,
            score: totalScore,
            attendance_index: attendanceIndex,
            engagement_index: engagementIndex,
            service_index: serviceIndex,
            prayer_index: 75,
            community_index: 68
        }]);

        // 3. Run PIL Engine Sweep (Predictive Models)
        const { PILEngine } = await import('@/lib/pil-engine');
        // 5. Trigger PIL specific rule generators
        const sweepResults = await PILEngine.runIntelligenceSweep(orgId);

        // Map successful run summary
        const summary = {
            processed_members: stats.length,
            alerts_generated: alerts.length,
            new_health_score: totalScore,
            pil_status: 'Completed'
        };

        // Complete the audit log
        await supabaseAdmin.from('system_activity_logs').insert({
            id: crypto.randomUUID(),
            org_id: orgId,
            action: 'INTELLIGENCE_SWEEP',
            details: 'Completed Intelligence Engine Sweep',
            metadata: { status: 'completed', timestamp: new Date().toISOString(), ...summary }
        });

        return NextResponse.json({
            status: "success",
            execution_time: new Date().toISOString(),
            processed_members: stats.length,
            alerts_generated: alerts.length,
            new_health_score: totalScore,
            sweep_results: sweepResults
        });

    } catch (error: any) {
        console.error('Intelligence Engine Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
