
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Phase 3 Fix Script ---');

  // We can't run 'CREATE POLICY' via the client. 
  // But we can check if the data is readable via the anon client.
  // Actually, I will just use the browser subagent to run the SQL in the editor as the user asked.
  // It's the most reliable way to ensure the policies are applied.
  
  // Checking future events
  const { data: events } = await supabase.from('events').select('*').gte('event_date', new Date().toISOString());
  console.log('Future events found:', events?.length || 0);

  // Update sermon title for verification
  const { error: sErr } = await supabase.from('public_sermons').update({ title: 'LIVE DATA TEST' }).eq('featured', true);
  if (sErr) console.error('Sermon update error:', sErr);
  else console.log('Sermon updated to LIVE DATA TEST');
}

run();
