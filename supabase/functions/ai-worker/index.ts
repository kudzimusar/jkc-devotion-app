import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { job_id } = await req.json()

    // 1. Fetch Job Info
    const { data: job, error: jobError } = await supabaseClient
      .from('job_queue')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) throw new Error(`Job not found: ${job_id}`)

    // 2. Dispatch based on type
    if (job.type === 'ai_transcription') {
      const { sermon_id, youtube_url } = job.payload
      
      // Step A: LOG START
      console.log(`Transcribing sermon: ${sermon_id} (${youtube_url})`)
      
      // Step B: TRANSCRIPTION (Mocking external API call)
      // In a real production system, this would call OpenAI Whisper or Google Cloud Speech-to-Text
      const transcriptMock = `This is an AI-generated transcript for sermon ${sermon_id}. 
      The speaker discussed faith, resilience, and the community of believers today.`
      
      // Step C: UPDATE MEDIA ASSETS
      const { error: assetError } = await supabaseClient
        .from('media_assets')
        .update({ 
            url: 'https://transcripts.church.os/' + sermon_id + '.txt', 
            metadata: { full_text: transcriptMock }, 
            status: 'active' 
        })
        .eq('sermon_id', sermon_id)
        .eq('type', 'transcript');

      if (assetError) throw assetError;

      // Step D: MARK JOB AS COMPLETED
      await supabaseClient.from('job_queue').update({ 
          status: 'completed', 
          finished_at: new Date().toISOString() 
      }).eq('id', job_id);

    } else if (job.type === 'ai_summary') {
        const { sermon_id } = job.payload;
        
        // Fetch Transcript first (Wait for Step 1)
        const { data: transcriptAsset } = await supabaseClient
            .from('media_assets')
            .select('metadata')
            .eq('sermon_id', sermon_id)
            .eq('type', 'transcript')
            .single();

        if (!transcriptAsset || transcriptAsset.status !== 'active') {
            // Re-queue or wait (Simple logic: wait for retry)
            throw new Error(`Transcript not ready for summary: ${sermon_id}`);
        }

        // AI SUMMARY (Mocking GPT-4/Bison call)
        const summaryMock = `A deep dive into faith and community resilience. Key lessons include prayer, support, and hope.`;
        
        await supabaseClient.from('media_assets').update({
            url: 'https://notes.church.os/' + sermon_id + '.txt',
            metadata: { summary: summaryMock, key_points: ['Faith', 'Community', 'Resilience'] },
            status: 'active'
        }).eq('sermon_id', sermon_id).eq('type', 'notes');

        await supabaseClient.from('job_queue').update({ 
            status: 'completed', 
            finished_at: new Date().toISOString() 
        }).eq('id', job_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
