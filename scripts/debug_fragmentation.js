import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(url, key);

async function main() {
    const email = 'kudzimusar@gmail.com';
    console.log(`Checking state for ${email}...`);

    // 1. Profile
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
    console.log("Profile:", JSON.stringify(profile, null, 2));

    // 2. Org Members
    const { data: org_member } = await supabaseAdmin
        .from('org_members')
        .select('*')
        .eq('user_id', profile?.id)
        .single();
    console.log("Org Member:", JSON.stringify(org_member, null, 2));

    // 3. User Roles
    const { data: user_roles } = await supabaseAdmin
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', profile?.id);
    console.log("User Roles:", JSON.stringify(user_roles, null, 2));

    // 4. Milestones
    const { data: milestones } = await supabaseAdmin
        .from('member_milestones')
        .select('*')
        .eq('user_id', profile?.id)
        .single();
    console.log("Milestones:", JSON.stringify(milestones, null, 2));
}

main().catch(console.error);
