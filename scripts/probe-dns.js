const dns = require('dns');

const hosts = [
    'db.dapxrorkcvpzzkggopsa.supabase.co',
    'postgres.dapxrorkcvpzzkggopsa.supabase.co',
    'aws-0-ap-northeast-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com'
];

async function probe() {
    for (const host of hosts) {
        try {
            const addresses = await dns.promises.resolve4(host);
            console.log(`FOUND: ${host} -> ${addresses}`);
        } catch (err) {
            console.log(`NOT FOUND: ${host}`);
        }
    }
}

probe();
