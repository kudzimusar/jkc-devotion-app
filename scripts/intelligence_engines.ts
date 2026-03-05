import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
try {
    const envFile = readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1]] = match[2];
    });
} catch (e) { }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function runMemberRiskEngine() {
    console.log('🔍 Running Member Risk Detection Engine...');

    // 1. Get all members and their stats
    const { data: stats } = await supabase.from('member_stats').select('user_id, last_devotion_date, current_streak');
    const { data: attendance } = await supabase.from('service_attendance').select('user_id, service_date');
    const { data: prayers } = await supabase.from('prayer_requests').select('user_id, urgency, status').eq('status', 'Pending');

    if (!stats) return;

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
                    alert_type: 'Spiritual Inactivity',
                    severity: diffDays > 14 ? 'critical' : 'medium'
                });
            }
        }

        // Rule: Multiple urgent prayers
        const userPrayers = prayers?.filter(p => p.user_id === s.user_id && p.urgency === 'urgent') || [];
        if (userPrayers.length >= 2) {
            alerts.push({
                member_id: s.user_id,
                alert_type: 'Prayer Distress',
                severity: 'critical'
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

    const { data: profiles } = await supabase.from('profiles').select('id');
    const { data: stats } = await supabase.from('member_stats').select('current_streak');
    const { data: attendance } = await supabase.from('service_attendance').select('id').gt('service_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    const { data: roles } = await supabase.from('member_roles').select('id').eq('active_status', true);

    const memberCount = profiles?.length || 1;

    // Simple Calculation
    const attendanceIndex = Math.min(100, Math.round(((attendance?.length || 0) / (memberCount * 4)) * 100)); // Avg 4 Sundays
    const engagementIndex = stats?.length ? Math.round((stats.reduce((a, b) => a + (b.current_streak > 0 ? 1 : 0), 0) / stats.length) * 100) : 50;
    const serviceIndex = Math.min(100, Math.round(((roles?.length || 0) / memberCount) * 100));
    const prayerIndex = 70; // Hardcoded for now until we have better prayer activity metrics
    const communityIndex = 65;

    const totalScore = Math.round(
        (attendanceIndex * 0.25) +
        (engagementIndex * 0.25) +
        (serviceIndex * 0.20) +
        (prayerIndex * 0.15) +
        (communityIndex * 0.15)
    );

    const { error } = await supabase.from('church_health_metrics').insert([{
        score: totalScore,
        attendance_index: attendanceIndex,
        engagement_index: engagementIndex,
        service_index: serviceIndex,
        prayer_index: prayerIndex,
        community_index: communityIndex
    }]);

    if (error) console.error('  ⚠️ Health Score Error:', error.message);
    else console.log(`  ✅ Church Health Score updated: ${totalScore}/100`);
}

async function main() {
    await runMemberRiskEngine();
    await runChurchHealthEngine();
    console.log('\n✅ Intelligence Update Complete.');
}

main().catch(console.error);
