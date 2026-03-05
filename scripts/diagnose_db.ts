import pkg from 'pg';
const { Client } = pkg;

const CONNECTION_STRING = `postgresql://postgres.dapxrorkcvpzzkggopsa:Youblessme-1985@52.68.3.1:6543/postgres`;

async function main() {
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('--- Table: org_members ---');
        const tableInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'org_members'
        `);
        console.table(tableInfo.rows);

        console.log('\n--- RLS Status ---');
        const rlsInfo = await client.query(`
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'org_members'
        `);
        console.table(rlsInfo.rows);

        console.log('\n--- Policies ---');
        const policyInfo = await client.query(`
            SELECT policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'org_members'
        `);
        console.table(policyInfo.rows);

        console.log('\n--- Users in org_members ---');
        const members = await client.query(`
            SELECT user_id, role, org_id 
            FROM public.org_members
        `);
        console.table(members.rows);

        console.log('\n--- Searching for specific user in auth.users ---');
        const targetUserId = 'ef9761e7-265b-44ee-8855-1608ccacc79c';
        const userInfo = await client.query(`
            SELECT id, email FROM auth.users WHERE id = $1
        `, [targetUserId]);
        console.table(userInfo.rows);

        console.log('\n--- Searching for admin@jkc.church in auth.users ---');
        const adminInfo = await client.query(`
            SELECT id, email FROM auth.users WHERE email = 'admin@jkc.church'
        `);
        console.table(adminInfo.rows);

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

main();
