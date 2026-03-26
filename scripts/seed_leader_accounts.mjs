import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';

const ACCOUNTS = [
  {
    email: 'pastor@jkc.church',
    password: 'JKC-PastorHQ-2026!',
    name: 'Kudzanai Shadreck Musarurwa',
    role: 'pastor',
    ministry_slug: 'pastoral'
  },
  {
    email: 'media@jkc.church',
    password: 'JKC-MediaLead-2026!',
    name: 'Media Ministry Lead',
    role: 'ministry_lead',
    ministry_slug: 'media'
  },
  {
    email: 'finance@jkc.church',
    password: 'JKC-FinanceLead-2026!',
    name: 'Finance Team Lead',
    role: 'ministry_lead',
    ministry_slug: 'finance'
  },
  {
    email: 'shepherd@jkc.church',
    password: 'JKC-ShepherdLead-2026!',
    name: 'Pastoral Shepherd',
    role: 'shepherd',
    ministry_slug: 'pastoral'
  }
];

async function seed() {
  console.log("🚀 Starting Mission Control Account Provisioning...");

  // Get Ministry IDs
  const { data: ministries } = await supabaseAdmin.from('ministries').select('id, slug');
  const ministriesMap = Object.fromEntries(ministries?.map(m => [m.slug, m.id]) || []);

  for (const acc of ACCOUNTS) {
    console.log(`\nCreating ${acc.role}: ${acc.email}...`);
    
    try {
      // 1. Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.name }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`   User already exists in Auth.`);
        } else {
          throw authError;
        }
      }

      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const user = usersData.users.find(u => u.email === acc.email);

      if (!user) throw new Error(`User not found for ${acc.email}`);

      // 2. Profile
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        name: acc.name,
        email: acc.email,
        org_id: ORG_ID,
        role: acc.role === 'pastor' ? 'pastor' : 'member'
      });
      console.log(`   Profile upserted.`);

      // 3. Org Membership
      await supabaseAdmin.from('org_members').upsert({
        user_id: user.id,
        org_id: ORG_ID,
        role: acc.role
      });
      console.log(`   Org role set to ${acc.role}.`);

      // 4. Ministry Membership (if applicable)
      const ministryId = ministriesMap[acc.ministry_slug];
      if (ministryId) {
        await supabaseAdmin.from('ministry_members').upsert({
          user_id: user.id,
          ministry_id: ministryId,
          org_id: ORG_ID,
          ministry_role: acc.role === 'pastor' ? 'pastor' : 'lead',
          status: 'active'
        });
        console.log(`   Linked to ${acc.ministry_slug} ministry.`);
      }

    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
    }
  }

  console.log("\n✅ Account Provisioning Complete!");
}

seed();
