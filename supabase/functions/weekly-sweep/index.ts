import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts';

const ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';
const APP_URL = Deno.env.get('APP_URL') || 'https://kudzimusar.github.io/jkc-devotion-app';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

serve(async (req: Request) => {
    try {
        console.log('🌅 Weekly Ministry Sweep — Edge Function starting...');

        // Step 1: Run SQL health score sweep
        const sweepRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_weekly_ministry_sweep`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ p_org_id: ORG_ID }),
        });

        const sweepStatus = sweepRes.status;
        console.log(`✅ Health sweep completed — status ${sweepStatus}`);

        // Step 2: Call AI intelligence sweep
        const aiRes = await fetch(`${APP_URL}/api/intelligence/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': CRON_SECRET,
            },
            body: JSON.stringify({
                org_id: ORG_ID,
                triggered_by: 'weekly_cron',
            }),
        });

        const aiStatus = aiRes.status;
        console.log(`🤖 AI sweep completed — status ${aiStatus}`);

        return new Response(
            JSON.stringify({
                sweep: 'complete',
                health_sweep_status: sweepStatus,
                ai_status: aiStatus,
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err: any) {
        console.error('Weekly sweep error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
