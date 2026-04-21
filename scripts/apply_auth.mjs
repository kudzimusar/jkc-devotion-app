import pg from '/Users/shadreckmusarurwa/Project AI/church-os/node_modules/pg/lib/index.js';
import { readFileSync } from 'fs';

const { Client } = pg;
const CONNECTION = 'postgresql://postgres.dapxrorkcvpzzkggopsa:Youblessme-1985@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const MIGRATIONS = [
  { version: '20260421000001', file: '/Users/shadreckmusarurwa/Project AI/church-os/supabase/migrations/20260421000001_refined_auth_contexts.sql' }
];

const client = new Client({ connectionString: CONNECTION, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  for (const m of MIGRATIONS) {
    const sql = readFileSync(m.file, 'utf8');
    console.log(`[APPLY] ${m.version}...`);
    try {
      await client.query(sql);
      console.log(`[OK]    ${m.version} applied.`);
    } catch (err) {
      console.error(`[ERROR] ${m.version}: ${err.message}`);
    }
  }
  await client.end();
}
run();
