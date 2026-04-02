import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local or .env
config({ path: resolve(__dirname, '../.env.local'), override: true });
config({ path: resolve(__dirname, '../.env'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Error: Missing Supabase configuration.');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL is not defined.');
    if (!serviceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY is not defined.');
    console.error('   Current environment info:');
    Object.keys(process.env).filter(k => k.includes('SUPABASE')).forEach(k => {
        console.error(`     ${k}: ${process.env[k] ? `Defined (len: ${process.env[k]?.length})` : 'EMPTY/UNDEFINED'}`);
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});


const DEFAULT_ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d'; // JKC Org

async function runMemberRiskEngine() {
    console.log('🔍 Running Member Risk Detection Engine...');

    // 1. Get all members and their stats
    const [statsRes, prayersRes] = await Promise.all([
        supabase.from('member_stats').select('user_id, last_devotion_date, current_streak, org_id'),
        supabase.from('prayer_requests').select('user_id, urgency, status, org_id').eq('status', 'active')
    ]);

    const stats = statsRes.data || [];
    const prayers = prayersRes.data || [];

    const now = new Date();
    const alerts = [];

    for (const s of stats) {
        // Rule: Inactive for more than 7 days
        if (s.last_devotion_date) {
            const lastDate = new Date(s.last_devotion_date);
            const diffDays = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 7) {
                alerts.push({
                    member_id: s.user_id,
                    org_id: s.org_id || DEFAULT_ORG_ID,
                    alert_type: 'Spiritual Inactivity',
                    severity: diffDays > 14 ? 'critical' : 'medium',
                    message: `${s.user_id} has been inactive for ${diffDays} days.`
                });
            }
        }

        // Rule: Crisis prayers
        const crisisPrayers = prayers.filter(p => p.user_id === s.user_id && p.urgency === 'crisis');
        if (crisisPrayers.length >= 1) {
            alerts.push({
                member_id: s.user_id,
                org_id: s.org_id || DEFAULT_ORG_ID,
                alert_type: 'Crisis Detection',
                severity: 'critical',
                message: `Active crisis prayer request detected.`
            });
        }
    }

    if (alerts.length > 0) {
        const { error } = await supabase.from('member_alerts').upsert(alerts, { onConflict: 'member_id, alert_type' });
        if (error) console.error('  ⚠️ Alert Upsert Error:', error.message);
        else console.log(`  ✅ ${alerts.length} risk alerts processed.`);
    } else {
        console.log('  ✅ No new risks detected.');
    }
}

async function runChurchHealthEngine() {
    console.log('\n📊 Running Church Health Score Engine...');

    const [profilesRes, statsRes, attendanceRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('member_stats').select('current_streak'),
        supabase.from('attendance_records').select('id').gt('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('ministry_members').select('id').eq('is_active', true)
    ]);

    const memberCount = profilesRes.data?.length || 1;
    const stats = statsRes.data || [];
    const activeRoles = rolesRes.data?.length || 0;

    // Simple Calculation
    const attendanceIndex = Math.min(100, Math.round(((attendanceRes.data?.length || 0) / (memberCount * 4)) * 100)); // Avg 4 Sundays
    const engagementIndex = stats.length ? Math.round((stats.reduce((a, b) => a + (b.current_streak > 0 ? 1 : 0), 0) / stats.length) * 100) : 50;
    const serviceIndex = Math.min(100, Math.round((activeRoles / memberCount) * 100));

    const totalScore = Math.round(
        (attendanceIndex * 0.3) +
        (engagementIndex * 0.4) +
        (serviceIndex * 0.3)
    );

    const { error } = await supabase.from('church_health_metrics').insert([{
        org_id: DEFAULT_ORG_ID,
        score: totalScore,
        attendance_index: attendanceIndex,
        engagement_index: engagementIndex,
        service_index: serviceIndex,
        prayer_index: 75,
        community_index: 68
    }]);

    if (error) console.error('  ⚠️ Health Score Error:', error.message);
    else console.log(`  ✅ Church Health Score updated: ${totalScore}/100`);
}

async function generatePropheticInsights() {
    console.log('\n✨ Generating Prophetic Insights...');

    // logic to detect trends (simplified for script)
    const { data: metrics } = await supabase.from('attendance_records').select('id');
    if (!metrics) return;

    // Detect attendance surge (lowered threshold to 5 for demonstration)
    if (metrics.length > 5) {
        const { error } = await supabase.from('prophetic_insights').upsert({
            org_id: DEFAULT_ORG_ID,
            category: 'growth',
            insight_title: 'Congregational Momentum Detected',
            insight_description: 'Attendance patterns show consistency. Momentum is building.',
            recommended_action: 'Increase capacity for fellowship circles.',
            risk_level: 'low',
            probability_score: 92
        }, { onConflict: 'org_id,insight_title' });

        if (error) console.error('  ⚠️ Prophetic Insight Error:', error.message);
        else console.log('  ✅ Prophetic insights updated.');
    } else {
        console.log('  ✅ Insufficient data for prophetic insights.');
    }
}

async function main() {
    await runMemberRiskEngine();
    await runChurchHealthEngine();
    await generatePropheticInsights();
    console.log('\n✅ Mission Control Intelligence Sync Complete.');
}

main().catch((e: any) => console.error(e));


