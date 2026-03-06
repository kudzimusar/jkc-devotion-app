import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../.env.local');
try {
    const envFile = readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1]] = match[2];
    });
} catch (e: any) { }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function seedMockData() {
    console.log('🌱 Seeding mock data for Church OS...\n');

    // Seed AI insights
    console.log('📡 Seeding ai_insights...');
    const { error: insightsErr } = await supabase.from('ai_insights').upsert([
        { insight_type: 'daily', title: '12 Members Inactive 7+ Days', description: '12 members who had active streaks 2 weeks ago have gone silent. Devotional engagement dropped sharply.', suggested_action: 'Assign 3 pastoral leaders to make personal check-in calls this week.', priority: 'critical' },
        { insight_type: 'daily', title: 'Financial Stress Prayers +40%', description: 'Prayer requests mentioning financial difficulty surged 40% vs last week across all fellowship groups.', suggested_action: 'Prepare a sermon on biblical financial stewardship within 2 weeks.', priority: 'warning' },
        { insight_type: 'weekly', title: 'Youth Attendance Up 24%', description: 'Youth ministry attendance has increased 24% month-over-month. Small group participation is at an all-time high.', suggested_action: 'Expand youth leadership team. Consider a second youth service slot.', priority: 'info' },
        { insight_type: 'weekly', title: 'SOAP Anxiety Theme Rising', description: 'AI analysis shows anxiety-themed language in 31% of entries, up from 18% last week.', suggested_action: 'Schedule a church-wide prayer and fasting day focused on peace and trust.', priority: 'warning' },
        { insight_type: 'monthly', title: '3 New Families Registered', description: 'Three new household units joined through the app and attended at least one Sunday service.', suggested_action: 'Assign a welcome deacon to each new family within 72 hours.', priority: 'info' },
    ]);
    if (insightsErr) console.log('  ⚠️ ' + insightsErr.message);
    else console.log('  ✅ ai_insights seeded');

    // Seed fellowship groups
    console.log('📡 Seeding fellowship_groups...');
    const { error: fgErr } = await supabase.from('fellowship_groups').upsert([
        { name: 'Nerima Circle', location: 'Nerima-ku, Tokyo', meeting_frequency: 'weekly', member_count: 12, is_active: true },
        { name: 'Hachioji Life Group', location: 'Hachioji-shi', meeting_frequency: 'weekly', member_count: 9, is_active: true },
        { name: 'Ikebukuro Connect', location: 'Ikebukuro Station Area', meeting_frequency: 'biweekly', member_count: 15, is_active: true },
    ]);
    if (fgErr) console.log('  ⚠️ ' + fgErr.message);
    else console.log('  ✅ fellowship_groups seeded');

    // Seed events
    console.log('📡 Seeding events...');
    const { error: evErr } = await supabase.from('events').upsert([
        { name: 'Sunday Service', event_type: 'service', event_date: '2026-03-01T10:00:00+09:00', location: 'TE昭島ビル3F', expected_attendees: 200, actual_attendees: 189 },
        { name: 'Youth Night', event_type: 'event', event_date: '2026-02-28T18:00:00+09:00', location: 'Akihabara Hall', expected_attendees: 60, actual_attendees: 74, volunteer_count: 12 },
        { name: 'Prayer & Fasting', event_type: 'service', event_date: '2026-03-07T06:00:00+09:00', expected_attendees: 80 },
    ]);
    if (evErr) console.log('  ⚠️ ' + evErr.message);
    else console.log('  ✅ events seeded');

    // Migrate devotions
    console.log('📖 Migrating devotions...');
    try {
        const devotions = JSON.parse(readFileSync(resolve(__dirname, '../src/data/devotions.json'), 'utf8'));
        const rows = devotions.map((d: any) => ({
            date: d.date, week: d.week, theme: d.theme,
            title: d.title, scripture: d.scripture,
            declaration: d.declaration, week_theme: d.week_theme
        }));
        const { error } = await supabase.from('devotions').upsert(rows, { onConflict: 'date' });
        if (error) console.log('  ⚠️ Devotions: ' + error.message);
        else console.log(`  ✅ ${rows.length} devotions migrated`);
    } catch (e: any) { console.log('  ⚠️ Devotions: ' + e.message); }

    console.log('\n✅ Church OS data seeding complete!');
}

seedMockData().catch(console.error);
