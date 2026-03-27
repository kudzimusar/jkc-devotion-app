import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, churchName, invitedBy } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Create magic link with extended expiry (48 hours)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?invited=true&church=${encodeURIComponent(churchName || '')}`,
        data: {
          onboarding_invite: true,
          invited_church: churchName,
          invited_by: invitedBy,
          expires_in: 172800 // 48 hours
        }
      }
    });
    
    if (error) {
      console.error('Magic link creation failed:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Log invitation for analytics
    await supabase.from('onboarding_invitations').insert({
      email,
      church_name: churchName,
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      status: 'pending'
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent. Check your email for the magic link.' 
    });
    
  } catch (error) {
    console.error('Invite API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
