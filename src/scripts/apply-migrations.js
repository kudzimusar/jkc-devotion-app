
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationsDir = 'supabase/migrations';
    const migrationFiles = [
      '20260420000001_public_inquiries_schema_fix.sql',
      '20260420000002_kingdom_class_table.sql',
      '20260420000003_kingdom_class_surface.sql'
    ];

    for (const fileName of migrationFiles) {
      console.log(`Applying migration: ${fileName}`);
      const filePath = path.join(migrationsDir, fileName);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`Successfully applied ${fileName}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`Skipping ${fileName}: Some components already exist.`);
        } else {
          console.error(`Error in ${fileName}:`, err.message);
        }
      }
    }

    // Backfill data: Move Language Class inquiries to the new table
    console.log('Backfilling data from public_inquiries...');
    const backfillSql = `
      INSERT INTO kingdom_class_applications (
        org_id, full_name, email, phone, track, learning_level, heard_via, wants_online, notes, status, created_at
      )
      SELECT 
        org_id, 
        first_name || ' ' || COALESCE(last_name, ''), 
        email, 
        phone,
        COALESCE(substring(message from 'TRACK: (.*)\n'), 'Unknown'),
        COALESCE(substring(message from 'LEVEL: (.*)\n'), 'Beginner'),
        COALESCE(how_heard, 'Friend'),
        CASE WHEN message ILIKE '%WANTS ONLINE: Yes%' THEN true ELSE false END,
        message,
        'pending',
        created_at
      FROM public_inquiries
      WHERE visitor_intent = 'language_class'
      ON CONFLICT DO NOTHING;
    `;
    
    await client.query(backfillSql);
    console.log('Data backfilled successfully');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

applyMigrations();
