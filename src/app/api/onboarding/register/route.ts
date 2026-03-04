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

    const { churchName, contactEmail, domain, tier } = await request.json();
    if (!churchName || !contactEmail || !domain || !tier) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create organization
    const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: churchName, domain, subscription_status: tier })
        .select('*')
        .single();

    if (orgErr || !org) {
        return NextResponse.json({ error: orgErr?.message || 'Failed to create organization' }, { status: 500 });
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

    // Return plain key for one-time display
    return NextResponse.json({ apiKey }, { status: 200 });
}
