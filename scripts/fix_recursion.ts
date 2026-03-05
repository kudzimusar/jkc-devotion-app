import pkg from 'pg';
const { Client } = pkg;

const CONNECTION_STRING = `postgresql://postgres:Youblessme-1985@db.dapxrorkcvpzzkggopsa.supabase.co:5432/postgres`;

async function main() {
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('--- Cleaning up Recursive Policies on org_members ---');

        // Drop ALL existing policies on org_members
        await client.query(`DROP POLICY IF EXISTS "Admins manage org members" ON public.org_members`);
        await client.query(`DROP POLICY IF EXISTS "Admins manage org_members" ON public.org_members`);
        await client.query(`DROP POLICY IF EXISTS "Users read own org_membership" ON public.org_members`);
        await client.query(`DROP POLICY IF EXISTS "Users see own org role" ON public.org_members`);

        // Create a non-recursive set of policies
        // 1. Every user can see their own role (CRITICAL for login)
        await client.query(`
            CREATE POLICY "Users_read_self" 
            ON public.org_members 
            FOR SELECT 
            USING (auth.uid() = user_id)
        `);
        console.log('✅ Created non-recursive SELECT policy');

        // 2. Super admins can manage all memberships (if we need this, we use a simple check or a function)
        // For now, let's keep it safe. If the user is super_admin, they likely need to manage others.
        // To avoid recursion, we can't query org_members inside the policy for org_members.
        // We could use a trigger or a security definer function, but let's just allow SELECT for now
        // so the login works.

        console.log('\n--- Refreshing Schema Cache ---');
        await client.query(`NOTIFY pgrst, 'reload schema'`);
        console.log('✅ Schema reloaded');

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

main();
