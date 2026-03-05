import pkg from 'pg';
const { Client } = pkg;

const password = 'Youblessme-1985';
const project = 'dapxrorkcvpzzkggopsa';
const pooler_host = 'aws-0-ap-northeast-1.pooler.supabase.com';

const variations = [
    `postgresql://postgres.${project}:${password}@${pooler_host}:6543/postgres`,
    `postgresql://postgres:${password}@${pooler_host}:6543/postgres`,
    `postgresql://postgres.${project}:${password}@${pooler_host}:5432/postgres`,
    `postgresql://postgres:${password}@${pooler_host}:5432/postgres`
];

async function test() {
    for (const conn of variations) {
        console.log(`Testing: ${conn.replace(password, '****')}`);
        const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
        try {
            await client.connect();
            console.log('✅ Connected!');
            await client.end();
            process.exit(0);
        } catch (e: any) {
            console.log(`❌ Failed: ${e.message}`);
        }
    }
}

test();
