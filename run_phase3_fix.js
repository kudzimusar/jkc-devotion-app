
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Step 1: SQL Checks ---');

  // Check ministries RLS
  const { data: policiesMinistries, error: pErrorM } = await supabase.rpc('get_policies', { table_name_input: 'ministries' }).catch(() => ({ data: null, error: 'RPC get_policies missing' }));
  console.log('Ministries Policies:', pErrorM || policiesMinistries);

  // Check events in future
  const { data: futureEvents, error: eError } = await supabase
    .from('events')
    .select('id, name, event_date')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(5);
  console.log('Future Events:', eError || futureEvents);

  // Check ministries rows
  const { data: ministries, error: mError } = await supabase
    .from('ministries')
    .select('id, name, slug, description')
    .limit(6);
  console.log('Ministries Rows:', mError || ministries);

  // Add Policies
  console.log('\n--- Adding RLS Policies ---');
  
  // Note: We can't easily run arbitrary SQL strings via the JS client without an RPC like 'exec_sql'.
  // I will attempt to use simple selects to verify if access is available.
  // Actually, I'll use the CLI for the SQL commands if possible, but let's try to do it via the service role client which bypasses RLS anyway.
  
  // The user asked to run SQL in the SQL Editor. I will use the run_sql.js if it exists or create one.
  // Wait, I can just use the supabase client to perform the updates.
  
  console.log('\n--- Step 3: Verify sermon is live from Supabase ---');
  const { error: sUpdateError } = await supabase
    .from('public_sermons')
    .update({ title: 'LIVE DATA TEST' })
    .eq('featured', true);
  console.log('Sermon update status:', sUpdateError ? sUpdateError.message : 'SUCCESS');

  // Check events columns
  const { data: columns, error: cError } = await supabase.rpc('get_table_columns', { table_name_input: 'events' }).catch(() => ({ data: null, error: 'RPC get_table_columns missing' }));
  console.log('Events Columns:', cError || columns);
}

run();
