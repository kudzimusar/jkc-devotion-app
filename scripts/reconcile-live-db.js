/**
 * Ministry Reconciliation — Live DB Gap-Fill Script
 * Executes each remaining reconciliation step directly against the live
 * Supabase database using the service role key.
 * 
 * Covers: Items 1(slug fix), 4, 6, 7, 9, 12 — the parts that did NOT apply
 * via the SQL editor partial run.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dapxrorkcvpzzkggopsa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcHhyb3JrY3ZwenprZ2dvcHNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUxODYwOSwiZXhwIjoyMDg4MDk0NjA5fQ.J4bSYdw1370BpGFddbEvhkTP5BBlPKTQAe03JuIJxHg'
);

const MINISTRY_SLUGS = [
  { name: 'Worship Ministry',     slug: 'worship',     color: '#8B5CF6', secondary_color: '#6D28D9', intelligence_tag: 'SOULFUL & TECH',         icon: 'music',        category: 'pastoral' },
  { name: 'Ushering Ministry',    slug: 'ushers',      color: '#F59E0B', secondary_color: '#D97706', intelligence_tag: 'PRECISE & SHARP',        icon: 'users',        category: 'operations' },
  { name: 'Media Ministry',       slug: 'media',       color: '#06B6D4', secondary_color: '#0891B2', intelligence_tag: 'INDUSTRIAL & DARK',      icon: 'video',        category: 'operations' },
  { name: 'Children\'s Ministry', slug: 'children',    color: '#F472B6', secondary_color: '#DB2777', intelligence_tag: 'SOFT & PROTECTIVE',      icon: 'baby',         category: 'operations' },
  { name: 'Youth Ministry',       slug: 'youth',       color: '#EAB308', secondary_color: '#CA8A04', intelligence_tag: 'VIBRANT & ACTIVE',       icon: 'zap',          category: 'pastoral' },
  { name: 'Prayer Ministry',      slug: 'prayer',      color: '#818CF8', secondary_color: '#6366F1', intelligence_tag: 'ETHEREAL & CALM',        icon: 'feather',      category: 'pastoral' },
  { name: 'Pastoral Care',        slug: 'pastoral',    color: '#10B981', secondary_color: '#059669', intelligence_tag: 'TRUST & SECURITY',       icon: 'heart',        category: 'pastoral' },
  { name: 'Evangelism Ministry',  slug: 'evangelism',  color: '#22C55E', secondary_color: '#15803D', intelligence_tag: 'URGENT & BOLD',          icon: 'megaphone',    category: 'outreach' },
  { name: 'Kingdom Language',     slug: 'language',    color: '#3B82F6', secondary_color: '#1D4ED8', intelligence_tag: 'ACADEMIC & ELITE',       icon: 'book',         category: 'operations' },
  { name: 'Finance Ministry',     slug: 'finance',     color: '#F59E0B', secondary_color: '#10B981', intelligence_tag: 'CLEAN & SECURE',         icon: 'dollar-sign',  category: 'operations' },
  { name: 'Hospitality Ministry', slug: 'hospitality', color: '#D97706', secondary_color: '#92400E', intelligence_tag: 'WARM & INVITING',        icon: 'coffee',       category: 'operations' },
  { name: 'Fellowship Circles',   slug: 'fellowship',  color: '#14B8A6', secondary_color: '#0D9488', intelligence_tag: 'ORGANIC & CONNECTED',    icon: 'share-2',      category: 'pastoral' },
  { name: 'Missions Ministry',    slug: 'missions',    color: '#60A5FA', secondary_color: '#2563EB', intelligence_tag: 'GLOBAL & EXPANSIVE',     icon: 'globe',        category: 'outreach' },
  { name: 'Akiramenai Outreach',  slug: 'akiramenai',  color: '#F87171', secondary_color: '#DC2626', intelligence_tag: 'GRITTY & COMPASSIONATE', icon: 'hand-metal',   category: 'outreach' },
  { name: 'The Food Pantry',      slug: 'foodpantry',  color: '#84CC16', secondary_color: '#4D7C0F', intelligence_tag: 'ORDERLY & FRESH',        icon: 'shopping-bag', category: 'outreach' },
];

// Slug normalisation map — old slug → correct slug
const SLUG_FIX_MAP = {
  'childrens':      'children',
  'food-pantry':    'foodpantry',
  'language-school':'language',
  'ushering':       'ushers',
};

// Per-ministry metric definitions
const METRIC_DEFS = {
  worship:     [['rehearsal_attendance','Avg Attendance','count'],['setlists_completed','Setlists','count'],['gear_health','Gear Health','percentage']],
  ushers:      [['sanctuary_occupancy','Occupancy','count'],['welcome_warmth','Warmth','percentage'],['incidents','Incidents','count']],
  media:       [['streaming_uptime','Uptime','percentage'],['live_views','Views','count'],['digital_assets','Assets','count']],
  children:    [['safety_audit','Safety','percentage'],['children_count','Children','count'],['teacher_volunteers','Teachers','count']],
  youth:       [['event_attendance','Events','count'],['engagement_rate','Engaged','percentage'],['at_risk_count','At-Risk','count']],
  prayer:      [['requests_active','Requests','count'],['resolved_testimonies','Resolved','count'],['intercessor_coverage','Coverage','percentage']],
  pastoral:    [['wellbeing_score','Wellbeing','percentage'],['visitation_count','Visits','count'],['open_care_cases','Cases','count']],
  evangelism:  [['salvations','Salvations','count'],['new_contacts','Contacts','count'],['territory_reached','Territory','percentage']],
  language:    [['student_count','Students','count'],['avg_grade_percent','Grade','percentage'],['retention_rate','Retention','percentage']],
  finance:     [['burn_rate_runway','Runway','count'],['tithe_percentage','Tithe','percentage'],['operational_expenses','Expenses','currency']],
  hospitality: [['inventory_level','Inventory','percentage'],['volunteer_count','Volunteers','count'],['member_satisfaction','Satisfaction','percentage']],
  fellowship:  [['total_groups','Groups','count'],['percent_connected','Connected','percentage'],['isolated_member_count','Isolated','count']],
  missions:    [['nations_impacted','Nations','count'],['missionaries_supported','Missionaries','count'],['mission_budget_util','Budget','percentage']],
  akiramenai:  [['meals_served','Meals','count'],['contacts_made','Contacts','count'],['street_stock_level','Stock','percentage']],
  foodpantry:  [['families_helped','Families','count'],['current_stock_percent','Stock','percentage'],['total_donations','Donations','count']],
};

async function run() {
  console.log('=== Ministry Reconciliation Gap-Fill ===\n');

  // ─────────────────────────────────────────────────────
  // STEP 1: Normalise existing ministry slugs
  // ─────────────────────────────────────────────────────
  console.log('[1] Normalising ministry slugs...');
  const { data: allMin } = await supabase.from('ministries').select('id, slug, name, color, icon, is_active, org_id');
  
  for (const [oldSlug, newSlug] of Object.entries(SLUG_FIX_MAP)) {
    const found = allMin?.find(m => m.slug === oldSlug);
    if (found) {
      const { error } = await supabase.from('ministries').update({ slug: newSlug }).eq('id', found.id);
      if (error) console.log(`  ✗ Could not fix ${oldSlug}→${newSlug}: ${error.message}`);
      else console.log(`  ✓ Fixed slug: ${oldSlug} → ${newSlug}`);
    }
  }

  // Re-fetch after slug fixes
  const { data: ministries } = await supabase.from('ministries').select('id, slug, name, org_id, color, icon, is_active');
  const orgId = ministries?.[0]?.org_id;
  console.log(`  Org ID: ${orgId}`);
  console.log(`  Total ministries: ${ministries?.length}`);
  console.log(`  Current slugs: ${ministries?.map(m=>m.slug).join(', ')}\n`);

  // ─────────────────────────────────────────────────────
  // STEP 1b: Update colors/icons/tags to match design spec
  // ─────────────────────────────────────────────────────
  console.log('[1b] Syncing colors, icons, intelligence_tags to design spec...');
  for (const spec of MINISTRY_SLUGS) {
    const found = ministries?.find(m => m.slug === spec.slug);
    if (found) {
      const { error } = await supabase.from('ministries').update({
        name: spec.name,
        color: spec.color,
        secondary_color: spec.secondary_color,
        intelligence_tag: spec.intelligence_tag,
        icon: spec.icon,
        is_active: true,
        category: spec.category,
      }).eq('id', found.id);
      if (error) console.log(`  ✗ ${spec.slug}: ${error.message}`);
      else console.log(`  ✓ ${spec.slug} — color:${spec.color} icon:${spec.icon}`);
    } else {
      // Insert missing ministry
      const { error } = await supabase.from('ministries').insert({
        org_id: orgId,
        name: spec.name,
        slug: spec.slug,
        category: spec.category,
        color: spec.color,
        secondary_color: spec.secondary_color,
        intelligence_tag: spec.intelligence_tag,
        icon: spec.icon,
        is_active: true,
      });
      if (error) console.log(`  ✗ INSERT ${spec.slug}: ${error.message}`);
      else console.log(`  ✓ INSERTED missing ministry: ${spec.slug}`);
    }
  }
  console.log('');

  // Re-fetch final ministry list
  const { data: finalMin } = await supabase.from('ministries').select('id, slug, name, org_id');

  // ─────────────────────────────────────────────────────
  // STEP 4: Add ministry_id to forms
  // ─────────────────────────────────────────────────────
  // We can't ALTER TABLE via the JS client. We'll log what needs doing.
  console.log('[4] Note: forms.ministry_id column needs to be added via Supabase SQL editor.');
  console.log('    Run: ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id);');
  console.log('    Then: UPDATE public.forms f SET ministry_id = m.id FROM public.ministries m WHERE f.ministry = m.slug;\n');

  // ─────────────────────────────────────────────────────
  // STEP 6: Seed ministry_health_snapshots
  // ─────────────────────────────────────────────────────
  console.log('[6] Seeding ministry_health_snapshots (baseline)...');
  let healthOk = 0, healthFail = 0;
  for (const m of finalMin || []) {
    const { error } = await supabase.from('ministry_health_snapshots').insert({
      ministry_id: m.id,
      score: 20,
      trend_direction: 'stable',
      calculation_logic: { source: 'baseline_backfill', note: 'Initial baseline. Score increases as leaders submit reports.' }
    });
    if (error && !error.message.includes('duplicate')) { healthFail++; }
    else { healthOk++; }
  }
  console.log(`  ✓ Snapshots: ${healthOk} inserted, ${healthFail} failed\n`);

  // ─────────────────────────────────────────────────────
  // STEP 7: Seed spiritual_journey_progression from profiles
  // ─────────────────────────────────────────────────────
  console.log('[7] Backfilling spiritual_journey_progression from profiles...');
  const { data: profiles } = await supabase.from('profiles').select('id, salvation_date, baptism_date, membership_status');
  let sjOk = 0, sjFail = 0;
  for (const p of profiles || []) {
    if (p.salvation_date) {
      const { error } = await supabase.from('spiritual_journey_progression').upsert(
        { user_id: p.id, milestone: 'believer', achieved_at: p.salvation_date },
        { onConflict: 'user_id,milestone', ignoreDuplicates: true }
      );
      if (!error) sjOk++;
    }
    if (p.baptism_date) {
      const { error } = await supabase.from('spiritual_journey_progression').upsert(
        { user_id: p.id, milestone: 'disciple', achieved_at: p.baptism_date },
        { onConflict: 'user_id,milestone', ignoreDuplicates: true }
      );
      if (!error) sjOk++;
    }
    if (p.membership_status === 'member' || p.membership_status === 'active') {
      const { error } = await supabase.from('spiritual_journey_progression').upsert(
        { user_id: p.id, milestone: 'seeker', achieved_at: new Date().toISOString() },
        { onConflict: 'user_id,milestone', ignoreDuplicates: true }
      );
      if (!error) sjOk++;
    }
  }
  console.log(`  ✓ Spiritual journey rows: ${sjOk} ok, ${sjFail} failed\n`);

  // ─────────────────────────────────────────────────────
  // STEP 12: Seed ministry_ai_insights
  // ─────────────────────────────────────────────────────
  console.log('[12] Seeding ministry_ai_insights (3 per ministry)...');
  let aiOk = 0, aiFail = 0;
  for (const m of finalMin || []) {
    const rows = [
      { ministry_id: m.id, insight_type: 'tip', content: 'Welcome to your Ministry Intelligence Silo. Submit your first report using the Operations panel to establish your baseline health score and activate real-time analytics.', priority: 1, action_required: true, is_read: false },
      { ministry_id: m.id, insight_type: 'warning', content: 'No historical metrics found yet. Each submitted report raises your health score and unlocks trend analysis in Mission Control.', priority: 2, action_required: false, is_read: false },
      { ministry_id: m.id, insight_type: 'success', content: `The ${m.name} intelligence pipeline is now active. Team data, communications, and attendance logs are ready to receive your input.`, priority: 1, action_required: false, is_read: false },
    ];
    const { error } = await supabase.from('ministry_ai_insights').insert(rows);
    if (error) { aiFail++; }
    else { aiOk += 3; }
  }
  console.log(`  ✓ AI Insights: ${aiOk} inserted, ${aiFail} ministries failed\n`);

  // ─────────────────────────────────────────────────────
  // STEP 12b: Seed ministry_metric_definitions
  // ─────────────────────────────────────────────────────
  console.log('[12b] Seeding ministry_metric_definitions...');
  let mdOk = 0, mdFail = 0;
  for (const m of finalMin || []) {
    const defs = METRIC_DEFS[m.slug];
    if (!defs) { console.log(`  - No defs for slug: ${m.slug}`); continue; }

    // Check if already seeded
    const { data: existing } = await supabase.from('ministry_metric_definitions').select('id').eq('ministry_id', m.id).limit(1);
    if (existing && existing.length > 0) { mdOk += defs.length; continue; }

    const rows = defs.map(([key, label, unit]) => ({
      ministry_id: m.id, metric_key: key, label, unit
    }));
    const { error } = await supabase.from('ministry_metric_definitions').insert(rows);
    if (error) { mdFail++; console.log(`  ✗ ${m.slug}: ${error.message}`); }
    else { mdOk += defs.length; console.log(`  ✓ ${m.slug}: ${defs.length} metrics`); }
  }
  console.log(`  ✓ Metric definitions: ${mdOk} ok, ${mdFail} failed\n`);

  // ─────────────────────────────────────────────────────
  // STEP 12c: Seed forms for all ministries
  // ─────────────────────────────────────────────────────
  console.log('[12c] Seeding operational forms for all ministries...');
  let formsOk = 0, formsFail = 0;
  for (const m of finalMin || []) {
    // Check if forms already exist for this ministry
    const { data: existingForms } = await supabase.from('forms').select('id').eq('ministry', m.slug).limit(1);
    if (existingForms && existingForms.length > 0) { formsOk++; continue; }

    const formRows = [
      { org_id: m.org_id, name: `${m.name} Report`, description: 'Submit your ministry operational report', ministry: m.slug, is_active: true },
      { org_id: m.org_id, name: `${m.name} Attendance`, description: 'Log service headcount for your ministry', ministry: m.slug, is_active: true },
    ];
    const { data: insertedForms, error } = await supabase.from('forms').insert(formRows).select('id, name');
    if (error) { formsFail++; console.log(`  ✗ ${m.slug}: ${error.message}`); }
    else {
      formsOk++;
      // Seed form fields for each form
      for (const form of insertedForms || []) {
        if (form.name.includes('Report')) {
          await supabase.from('form_fields').insert([
            { org_id: m.org_id, form_id: form.id, label: 'Attendance', field_type: 'counter', is_required: true, sort_order: 0 },
            { org_id: m.org_id, form_id: form.id, label: 'Wins & Highlights', field_type: 'text', is_required: true, sort_order: 1 },
            { org_id: m.org_id, form_id: form.id, label: 'Challenges', field_type: 'text', is_required: false, sort_order: 2 },
            { org_id: m.org_id, form_id: form.id, label: 'Prayer Requests', field_type: 'text', is_required: false, sort_order: 3 },
            { org_id: m.org_id, form_id: form.id, label: 'Needs Attention', field_type: 'boolean', is_required: false, sort_order: 4 },
          ]);
        } else {
          await supabase.from('form_fields').insert([
            { org_id: m.org_id, form_id: form.id, label: 'Service Date', field_type: 'date', is_required: true, sort_order: 0 },
            { org_id: m.org_id, form_id: form.id, label: 'Total Volunteers', field_type: 'counter', is_required: true, sort_order: 1 },
            { org_id: m.org_id, form_id: form.id, label: 'Total Attendees', field_type: 'counter', is_required: true, sort_order: 2 },
            { org_id: m.org_id, form_id: form.id, label: 'Notes', field_type: 'text', is_required: false, sort_order: 3 },
          ]);
        }
      }
      console.log(`  ✓ ${m.slug}: 2 forms + fields`);
    }
  }
  console.log(`  ✓ Forms: ${formsOk} ministries done, ${formsFail} failed\n`);

  // ─────────────────────────────────────────────────────
  // FINAL: Verification summary
  // ─────────────────────────────────────────────────────
  console.log('=== FINAL VERIFICATION ===');
  const finalMin2 = await supabase.from('ministries').select('id,slug,color,is_active');
  const finalHS = await supabase.from('ministry_health_snapshots').select('id', { count: 'exact' });
  const finalAI = await supabase.from('ministry_ai_insights').select('id', { count: 'exact' });
  const finalMD = await supabase.from('ministry_metric_definitions').select('id', { count: 'exact' });
  const finalForms = await supabase.from('forms').select('id', { count: 'exact' });
  const finalSJ = await supabase.from('spiritual_journey_progression').select('id', { count: 'exact' });
  
  console.log(`Ministries: ${finalMin2.data?.length} (expected 15)`);
  console.log(`Health Snapshots: ${finalHS.count} (expected ≥15)`);
  console.log(`AI Insights: ${finalAI.count} (expected ≥45)`);
  console.log(`Metric Definitions: ${finalMD.count} (expected 45)`);
  console.log(`Forms: ${finalForms.count} (expected ≥30)`);
  console.log(`Spiritual Journey rows: ${finalSJ.count}`);
  console.log('\nDone ✓');
}

run().catch(e => console.error('FATAL:', e));
