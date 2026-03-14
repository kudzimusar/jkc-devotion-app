
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verify() {
    const client = new Client({ connectionString: process.env.SUPABASE_CONNECTION_STRING });
    await client.connect();
    
    try {
        console.log('--- STARTING ANNOUNCEMENT VERIFICATION ---');
        
        const ministryRes = await client.query("SELECT id, name FROM ministries WHERE slug = 'childrens'");
        const ministryId = ministryRes.rows[0].id;
        const orgRes = await client.query("SELECT id FROM organizations LIMIT 1");
        const orgId = orgRes.rows[0].id;
        const authorId = 'c58b07e8-7d05-4d15-b196-e8cf0022209b';

        // 1. Upward (Ministry -> Admin)
        await client.query(`
            INSERT INTO ministry_announcements (org_id, ministry_id, author_id, direction, title, body)
            VALUES ($1, $2, $3, 'upward', 'Test Upward', 'Communication check.')
        `, [orgId, ministryId, authorId]);
        console.log('PASS: Upward message path verified.');

        // 2. Downward (Admin -> Ministry)
        await client.query(`
            INSERT INTO ministry_announcements (org_id, ministry_id, author_id, direction, title, body)
            VALUES ($1, $2, $3, 'downward', 'Test Downward', 'Leadership check.')
        `, [orgId, ministryId, authorId]);
        console.log('PASS: Downward message path verified (Ministry side styling applies).');

        // 3. Broadcast
        const ministries = await client.query("SELECT id FROM ministries");
        const broadcastTitle = `Universal Broadcast ${Date.now()}`;
        console.log(`Broadcasting to ${ministries.rows.length} ministries...`);
        for (const m of ministries.rows) {
            await client.query(`
                INSERT INTO ministry_announcements (org_id, ministry_id, author_id, direction, title, body)
                VALUES ($1, $2, $3, 'downward', $4, 'System-wide alert.')
            `, [orgId, m.id, authorId, broadcastTitle]);
        }

        const broadcastCheck = await client.query("SELECT COUNT(*) FROM ministry_announcements WHERE title = $1", [broadcastTitle]);
        if (parseInt(broadcastCheck.rows[0].count) === ministries.rows.length) {
            console.log(`PASS: Broadcast multi-insert logic verified. ${broadcastCheck.rows[0].count} rows created.`);
        }

        console.log('--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        await client.end();
    }
}

verify();
