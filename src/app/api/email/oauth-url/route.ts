import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

const SCOPES: Record<string, string[]> = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
  outlook: [
    'offline_access',
    'https://graph.microsoft.com/mail.read',
    'https://graph.microsoft.com/mail.send',
    'https://graph.microsoft.com/user.read',
  ],
};

const CLIENT_IDS: Record<string, string> = {
  gmail: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
  outlook: process.env.MICROSOFT_OAUTH_CLIENT_ID ?? '',
};

const REDIRECT_URI = 'https://www.churchos-ai.website/api/email/oauth-callback';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const provider = searchParams.get('provider'); // 'gmail' or 'outlook'
  const orgId = searchParams.get('org_id');
  const userId = searchParams.get('user_id');
  const redirectUrl = searchParams.get('redirect_url');

  if (!provider || !orgId || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (!CLIENT_IDS[provider]) {
    return NextResponse.json({ error: `OAuth Client ID for ${provider} is not configured.` }, { status: 500 });
  }

  // 1. Generate secure state token
  const stateToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  // 2. Store state in Supabase
  const { error: stateErr } = await supabaseAdmin
    .from('oauth_states')
    .insert({
      state_token: stateToken,
      member_id: userId,
      org_id: orgId,
      provider,
      redirect_url: redirectUrl || null,
      expires_at: expiresAt,
    });

  if (stateErr) {
    console.error('Failed to store OAuth state:', stateErr);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }

  // 3. Build Auth URL
  let authUrl = '';
  if (provider === 'gmail') {
    const params = new URLSearchParams({
      client_id: CLIENT_IDS.gmail,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.gmail.join(' '),
      state: stateToken,
      access_type: 'offline',
      prompt: 'consent',
    });
    authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  } else if (provider === 'outlook') {
    const params = new URLSearchParams({
      client_id: CLIENT_IDS.outlook,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.outlook.join(' '),
      state: stateToken,
      response_mode: 'query',
    });
    authUrl = `${MICROSOFT_AUTH_URL}?${params.toString()}`;
  }

  return NextResponse.redirect(authUrl);
}
