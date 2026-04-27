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

    // 2. QUOTA GUARD (Phase 4.4)
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('ai_current_month_tokens, ai_monthly_token_quota')
      .eq('id', job.org_id)
      .single()

    if (orgError || !org) throw new Error(`Organization quota check failed: ${job.org_id}`)
    
    if (org.ai_current_month_tokens >= org.ai_monthly_token_quota) {
        throw new Error(`AI Quota Exceeded for this month. Please upgrade your plan.`)
    }

    // 3. Dispatch based on type
    if (job.type === 'ai_transcription') {
      const { sermon_id, youtube_url } = job.payload
      
      // Step A: LOG START
      console.log(`Transcribing sermon: ${sermon_id} (${youtube_url})`)
      
      // Step B: TRANSCRIPTION via Gemini 1.5 Flash (supports YouTube URLs natively)
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not set');

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                file_data: {
                  mime_type: 'video/mp4',
                  file_uri: youtube_url,
                }
              },
              {
                text: 'Transcribe this sermon audio verbatim. Return only the transcript text with speaker labels where identifiable. No commentary, no summary — just the raw transcript.'
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.1 }
        })
      });

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        throw new Error(`Gemini transcription failed: ${errText}`);
      }

      const geminiData = await geminiResponse.json();
      const transcriptText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!transcriptText) throw new Error('Empty transcript returned from Gemini');

      // Step C: UPDATE MEDIA ASSETS
      const { error: assetError } = await supabaseClient
        .from('media_assets')
        .update({
            url: 'https://transcripts.church.os/' + sermon_id + '.txt',
            metadata: { full_text: transcriptText },
            status: 'active'
        })
        .eq('sermon_id', sermon_id)
        .eq('type', 'transcript');

      if (assetError) throw assetError;

      // Step D: LOG USAGE & INCREMENT QUOTA
      const estimatedTokens = Math.round(transcriptText.split(' ').length * 1.5);
      await supabaseClient.from('ai_usage').insert({
          org_id: job.org_id,
          job_id: job_id,
          job_type: 'ai_transcription',
          tokens_used: estimatedTokens,
          cost_amount: (estimatedTokens / 1000) * 0.01 
      });

      await supabaseClient.rpc('increment_org_ai_tokens', { 
          org_id_param: job.org_id, 
          token_count: estimatedTokens 
      });

      // Step E: MARK JOB AS COMPLETED
      await supabaseClient.from('job_queue').update({ 
          status: 'completed', 
          finished_at: new Date().toISOString() 
      }).eq('id', job_id);

    } else if (job.type === 'ai_summary') {
        const { sermon_id } = job.payload;
        
        // Fetch Transcript first (Wait for Step 1)
        const { data: transcriptAsset } = await supabaseClient
            .from('media_assets')
            .select('metadata, status')
            .eq('sermon_id', sermon_id)
            .eq('type', 'transcript')
            .single();

        if (!transcriptAsset || transcriptAsset.status !== 'active') {
            // Re-queue or wait (Simple logic: wait for retry)
            throw new Error(`Transcript not ready for summary: ${sermon_id}`);
        }

        // AI SUMMARY via Gemini
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not set');

        const transcriptText = transcriptAsset.metadata?.full_text || '';
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const summaryResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a pastoral assistant. Given this sermon transcript, produce a JSON object with:
- "summary": a 2-3 sentence summary of the sermon
- "key_points": an array of 3-5 main takeaway phrases

Transcript:
${transcriptText.slice(0, 6000)}

Return only valid JSON.`
                    }]
                }],
                generationConfig: { maxOutputTokens: 1024, temperature: 0.3 }
            })
        });

        const summaryData = await summaryResponse.json();
        const rawSummary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        let parsedSummary = { summary: '', key_points: [] as string[] };
        try {
            const cleaned = rawSummary.replace(/```json|```/g, '').trim();
            parsedSummary = JSON.parse(cleaned);
        } catch (_) {
            parsedSummary = { summary: rawSummary.slice(0, 300), key_points: [] };
        }

        await supabaseClient.from('media_assets').update({
            url: 'https://notes.church.os/' + sermon_id + '.txt',
            metadata: parsedSummary,
            status: 'active'
        }).eq('sermon_id', sermon_id).eq('type', 'notes');

        // Step D: LOG USAGE
        const estimatedTokens = (transcriptText.split(' ').length + (parsedSummary.summary?.split(' ').length || 0)) * 2.0; 
        await supabaseClient.from('ai_usage').insert({
            org_id: job.org_id,
            job_id: job_id,
            job_type: 'ai_summary',
            tokens_used: Math.round(estimatedTokens),
            cost_amount: (estimatedTokens / 1000) * 0.03 // Summarization often costs more
        });

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
