import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const {
        churchName,
        contactEmail,
        domain,
        logoUrl,
        theologicalTradition,
        ministryEmphasis,
        worshipStyle,
        congregationSize,
        primaryLanguage,
        tier,
        selectedMinistries,
    } = await req.json()

    if (!churchName || !contactEmail || !domain || !tier) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    console.log(`🚀 Starting registration for: ${churchName} (${contactEmail})`)

    // 1. Create organization
    const { data: org, error: orgErr } = await supabaseAdmin
        .from('organizations')
        .insert({ 
            name: churchName, 
            domain, 
            subscription_status: tier,
            logo_url: logoUrl
        })
        .select('*')
        .single();

    if (orgErr || !org) {
        throw new Error(orgErr?.message || 'Failed to create organization')
    }

    // 2. Provision Intelligence DNA
    const { error: intelErr } = await supabaseAdmin
        .from('organization_intelligence')
        .insert({
            org_id: org.id,
            theological_tradition: theologicalTradition || 'Non-Denominational',
            ministry_emphasis: ministryEmphasis || 'Discipleship-focused',
            worship_style: worshipStyle || 'Blended',
            congregation_size: congregationSize || '100-500',
            primary_language: primaryLanguage || 'Bilingual',
            ai_provisioning_status: 'pending'
        });

    if (intelErr) {
        console.error('Failed to provision intelligence DNA:', intelErr);
    }

    // 3. Link user (we expect the user to be the one making the request)
    // Note: Since this is an admin client, we might need a userId passed in if the user is authenticated. 
    // Usually, the Edge Function can get the user from the authorization header.
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: userErr } = await createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader || '' } } }
    ).auth.getUser()

    if (userErr || !user) {
        throw new Error('Unauthorized or session expired')
    }

    const { error: linkErr } = await supabaseAdmin
        .from('org_members')
        .insert({ org_id: org.id, user_id: user.id, role: 'owner' });

    if (linkErr) {
        throw new Error(`Failed to link user to organization: ${linkErr.message}`)
    }

    // 4. Generate API Key
    const apiKey = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const preview = apiKey.slice(0, 4);

    // 5. Store API key hash
    const { error: keyErr } = await supabaseAdmin
        .from('api_keys')
        .insert({ org_id: org.id, key_hash: hash, key_preview: preview, is_active: true });

    if (keyErr) {
        console.error('Failed to store API key:', keyErr);
    }

    // 5.5. Provision selected ministries
    const MINISTRY_DATA = [
        { name: 'Worship Ministry',     slug: 'worship',     category: 'worship',  icon: 'music',        color: '#7C3AED' },
        { name: 'Prayer Ministry',      slug: 'prayer',      category: 'worship',  icon: 'activity',     color: '#8B5CF6' },
        { name: "Children's Ministry",  slug: 'childrens',   category: 'care',     icon: 'heart',        color: '#F59E0B' },
        { name: 'Youth Ministry',       slug: 'youth',       category: 'care',     icon: 'star',         color: '#10B981' },
        { name: 'Media Ministry',       slug: 'media',       category: 'media',    icon: 'video',        color: '#06B6D4' },
        { name: 'Evangelism Ministry',  slug: 'evangelism',  category: 'outreach', icon: 'send',         color: '#EF4444' },
        { name: 'Missions Ministry',    slug: 'missions',    category: 'outreach', icon: 'globe',        color: '#F43F5E' },
        { name: 'Fellowship Circles',   slug: 'fellowship',  category: 'care',     icon: 'users',        color: '#84CC16' },
        { name: 'Finance Ministry',     slug: 'finance',     category: 'admin',    icon: 'dollar-sign',  color: '#14B8A6' },
        { name: 'Hospitality Ministry', slug: 'hospitality', category: 'care',     icon: 'coffee',       color: '#F97316' },
        { name: 'Pastoral Care',        slug: 'pastoral',    category: 'care',     icon: 'shield',       color: '#A855F7' },
        { name: 'Ushering Ministry',    slug: 'ushers',      category: 'admin',    icon: 'door-open',    color: '#0EA5E9' },
        { name: 'The Food Pantry',      slug: 'food-pantry', category: 'outreach', icon: 'apple',        color: '#F59E0B' },
        { name: 'Akiramenai Outreach',  slug: 'akiramenai',  category: 'outreach', icon: 'heart',        color: '#EF4444' },
    ];

    const ministriesToCreate = Array.isArray(selectedMinistries)
        ? MINISTRY_DATA.filter(m => selectedMinistries.includes(m.name))
        : [];

    if (ministriesToCreate.length > 0) {
        const { error: minErr } = await supabaseAdmin
            .from('ministries')
            .insert(ministriesToCreate.map(m => ({ ...m, org_id: org.id, is_active: true })));
        if (minErr) console.error('Ministry provisioning failed:', minErr);
    }

    // 6. Trigger AI Provisioning (Fire and forget style in Deno)
    const intelligenceData = {
        org_id: org.id,
        theological_tradition: theologicalTradition,
        ministry_emphasis: ministryEmphasis,
        worship_style: worshipStyle,
        congregation_size: congregationSize,
        primary_language: primaryLanguage
    };

    // We call our other Edge Function
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/provision-church-intelligence`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ record: intelligenceData })
    }).catch(err => console.error('Background AI Provisioning Trigger Failed:', err));
    
    // 7. Mark invitation as completed if it exists
    await supabaseAdmin
        .from('onboarding_invitations')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('email', contactEmail)
        .eq('status', 'pending');

    return new Response(JSON.stringify({ success: true, apiKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })

  } catch (error) {
    console.error('Registration Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
    })
  }
})
