import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
    // Verify session
    const { data: { session }, error: sessErr } = await supabase.auth.getSession();
    if (sessErr || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

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
        tier 
    } = await request.json();

    if (!churchName || !contactEmail || !domain || !tier) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create organization
    const { data: org, error: orgErr } = await supabase
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
        return NextResponse.json({ error: orgErr?.message || 'Failed to create organization' }, { status: 500 });
    }

    // Provision Intelligence DNA
    const { error: intelErr } = await supabase
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
        // Note: We continue even if this fails to avoid blocking the main registration, 
        // but it will need to be fixed in the database manually if it occurs.
    }

    // Link user as owner in org_members
    const { error: linkErr } = await supabase
        .from('org_members')
        .insert({ org_id: org.id, user_id: userId, role: 'owner' });

    if (linkErr) {
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
    }

    // Generate API Key
    const apiKey = crypto.randomUUID();
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const preview = apiKey.slice(0, 4);

    // Store API key hash
    const { error: keyErr } = await supabase
        .from('api_keys')
        .insert({ org_id: org.id, key_hash: hash, key_preview: preview, is_active: true });

    if (keyErr) {
        return NextResponse.json({ error: keyErr.message }, { status: 500 });
    }

    // Trigger AI Provisioning asynchronously
    try {
        const intelligenceData = {
            org_id: org.id,
            theological_tradition: theologicalTradition,
            ministry_emphasis: ministryEmphasis,
            worship_style: worshipStyle,
            congregation_size: congregationSize,
            primary_language: primaryLanguage
        };

        // Note: Using dynamic fetch to trigger the Edge Function
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/provision-church-intelligence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ record: intelligenceData })
        }).catch(err => console.error('Background AI Provisioning Trigger Failed:', err));

    } catch (triggerErr) {
        console.error('AI Provisioning trigger error:', triggerErr);
    }

    // Return plain key for one-time display
    return NextResponse.json({ apiKey }, { status: 200 });
}
