import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ORG_ID = Deno.env.get('DEFAULT_ORG_ID') ?? 'fa547adf-f820-412f-9458-d6bade11517d';
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000/jkc-devotion-app';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

Deno.serve(async (req: Request) => {
  try {
    console.log('🌅 Weekly Ministry Sweep — Edge Function starting...');

    // Check for authorization header if needed, or rely on Supabase edge function JWT verification

    const body = await req.json().catch(() => ({}));
    const orgId = body.org_id || ORG_ID;

    // Step 1: Run SQL health score sweep
    const sweepRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_weekly_ministry_sweep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_org_id: orgId }),
    });

    const sweepStatus = sweepRes.status;
    const sweepResult = await sweepRes.text().catch(() => '');
    console.log(`✅ Health sweep completed — status ${sweepStatus}`, sweepResult);

    // Step 2: Call AI intelligence sweep
    // In production, APP_URL should be the public URL of the Next.js app
    const aiRes = await fetch(`${APP_URL}/api/intelligence/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET,
      },
      body: JSON.stringify({
        org_id: orgId,
        triggered_by: 'weekly_cron',
      }),
    });

    const aiStatus = aiRes.status;
    const aiResult = await aiRes.text().catch(() => '');
    console.log(`🤖 AI sweep completed — status ${aiStatus}`, aiResult);

    return new Response(
      JSON.stringify({
        sweep: 'complete',
        health_sweep_status: sweepStatus,
        ai_status: aiStatus,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );
  } catch (err: any) {
    console.error('Weekly sweep error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
