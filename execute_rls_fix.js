
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.SUPABASE_CONNECTION_STRING;

if (!connectionString) {
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  await client.connect();
  console.log('--- Step 1 & 3: SQL Execution ---');

  try {
    // Check Columns
    const resCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'events' ORDER BY ordinal_position;
    `);
    console.log('Events Columns:', resCols.rows.map(r => r.column_name).join(', '));

    // Apply Policies
    await client.query(`
      CREATE POLICY "public_read_ministries"
      ON ministries FOR SELECT
      USING (true);
    `).catch(e => console.log('Notice: public_read_ministries policy might already exist or error:', e.message));

    await client.query(`
      DROP POLICY IF EXISTS public_read_events ON events;
      CREATE POLICY "public_read_events"
      ON events FOR SELECT
      USING (true);
    `).catch(e => console.log('Error applying events policy:', e.message));

    // Additional RLS enablement if needed
    await client.query(`ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;`).catch(() => {});
    await client.query(`ALTER TABLE events ENABLE ROW LEVEL SECURITY;`).catch(() => {});

    console.log('SQL Execution Completed.');
  } catch (err) {
    console.error('SQL Execution Error:', err);
  } finally {
    await client.end();
  }
}

run();
