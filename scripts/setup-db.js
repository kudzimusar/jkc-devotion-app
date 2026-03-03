const { Client } = require('pg');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ips = ['52.77.146.31', '54.255.219.82', '52.74.252.201'];
const sqlPath = '/Users/shadreckmusarurwa/.gemini/antigravity/brain/8d8838ef-edc1-4906-a546-3a325b2667a9/supabase_schema.sql.md';

async function run() {
    let sql = fs.readFileSync(sqlPath, 'utf8');
    if (sql.includes('```sql')) {
        sql = sql.split('```sql')[1].split('```')[0];
    } else if (sql.includes('```')) {
        sql = sql.split('```')[1].split('```')[0];
    }

    for (const ip of ips) {
        for (const port of [6543, 5432]) {
            console.log(`Trying IP: ${ip} Port: ${port}...`);
            const client = new Client({
                host: ip,
                port: port,
                user: 'postgres.dapxrorkcvpzzkggopsa',
                password: 'Youblessme-1985',
                database: 'postgres',
                ssl: { rejectUnauthorized: false }
            });

            try {
                await client.connect();
                console.log(`SUCCESS: Connected to ${ip}:${port}`);
                console.log('Executing migration...');
                await client.query(sql);
                console.log('Migration completed successfully!');
                await client.end();
                return;
            } catch (err) {
                console.log(`FAILED: ${ip}:${port} - ${err.message}`);
                if (client) await client.end().catch(() => { });
            }
        }
    }
}

run();
