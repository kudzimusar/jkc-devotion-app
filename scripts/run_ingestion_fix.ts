import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
});

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();
    console.log('🚀 Updating Backend Ingestion Engine...');

    const SQL = `
        -- UPDATED FINALIZE FUNCTION
        -- This function now distributes form data into the unified ministry_reports table
        CREATE OR REPLACE FUNCTION public.finalize_form_submission(p_submission_id uuid)
        RETURNS void AS $$
        DECLARE
            v_form_id uuid;
            v_ministry text;
            v_form_name text;
            v_metrics jsonb;
            v_report_date date;
            v_user_id uuid;
        BEGIN
            -- 1. Get Form Context
            SELECT f.id, f.ministry, f.name, s.submitted_at::date, s.user_id
            INTO v_form_id, v_ministry, v_form_name, v_report_date, v_user_id
            FROM public.form_submissions s
            JOIN public.forms f ON s.form_id = f.id
            WHERE s.id = p_submission_id;

            -- 2. Aggregate Metrics from values
            -- We map field labels/slugs to a flat JSON object
            SELECT jsonb_object_agg(COALESCE(ff.label, 'field_' || fv.field_id), fv.field_value)
            INTO v_metrics
            FROM public.form_submission_values fv
            LEFT JOIN public.form_fields ff ON fv.field_id = ff.id
            WHERE fv.submission_id = p_submission_id;

            -- 3. Route to Ministry Reports if it's an operational form
            IF v_ministry IS NOT NULL THEN
                INSERT INTO public.ministry_reports (
                    ministry_name,
                    report_date,
                    metrics,
                    summary,
                    reported_by
                ) VALUES (
                    v_ministry,
                    v_report_date,
                    v_metrics,
                    v_form_name || ' submitted',
                    v_user_id
                )
                ON CONFLICT (ministry_name, report_date) 
                DO UPDATE SET 
                    metrics = public.ministry_reports.metrics || v_metrics,
                    updated_at = now();
            END IF;

            -- 4. Mark submission as processed
            UPDATE public.form_submissions SET processed = true WHERE id = p_submission_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    try {
        await client.query(SQL);
        console.log('✅ Ingestion engine updated.');
    } catch (e) {
        console.error('❌ Error updating ingestion engine:');
        console.error(e.message);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
