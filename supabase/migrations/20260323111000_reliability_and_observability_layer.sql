-- Migration 008: Reliability & Observability Layer
-- Objective: Transition from automated workflow to production-grade system.

-- 1. System Observability (Logging)
CREATE TYPE public.log_level AS ENUM ('info', 'warning', 'error', 'critical');

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level public.log_level NOT NULL DEFAULT 'info',
    component TEXT NOT NULL, -- e.g. 'automation', 'cron', 'live-pipeline'
    event_type TEXT NOT NULL, -- e.g. 'live_end', 'aggregation'
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Async Job Queue (Preparation for AI & Workers)
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    type TEXT NOT NULL, -- e.g. 'ai_transcription', 'ai_summary', 'video_process'
    status public.job_status DEFAULT 'pending',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    retries INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ
);

-- RBAC for System Logs (Admin only)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin check logs" ON public.system_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'pastor', 'owner', 'admin')
    )
);

-- RBAC for Job Queue (Org Isolation)
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation job queue" ON public.job_queue
FOR ALL USING (
    org_id::text IN (
        SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
);

-- 3. Hardened Automation Functions with Logging & Error Handling

-- Updated Live End Handler
CREATE OR REPLACE FUNCTION public.handle_live_end_automation()
RETURNS TRIGGER AS $$
DECLARE
    new_sermon_id UUID;
BEGIN
    IF (OLD.status = 'live' AND NEW.status = 'ended') THEN
        BEGIN
            INSERT INTO public.public_sermons (
                org_id, title, speaker, date, is_featured, status, 
                video_source_type, youtube_url, description
            )
            VALUES (
                NEW.org_id,
                COALESCE(NEW.metadata->>'title', 'Sunday Service Archive'),
                COALESCE(NEW.metadata->>'speaker', 'Church Admin'),
                CURRENT_DATE, true, 'published', 'youtube', NEW.stream_url,
                'Automatically archived from live broadcast.'
            )
            RETURNING id INTO new_sermon_id;

            INSERT INTO public.system_logs (level, component, event_type, message, metadata)
            VALUES ('info', 'live-pipeline', 'automation_success', 
                   format('Automated sermon creation successful for stream: %s', NEW.id), 
                   jsonb_build_object('sermon_id', new_sermon_id, 'org_id', NEW.org_id));

        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.system_logs (level, component, event_type, message, metadata)
            VALUES ('error', 'live-pipeline', 'automation_failure', 
                   format('Failed to automate sermon creation for stream: %s', NEW.id), 
                   jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE));
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated Analytics Aggregation with Logging
CREATE OR REPLACE FUNCTION public.aggregate_sermon_stats(target_sermon_id UUID)
RETURNS VOID AS $$
DECLARE
    org_uuid UUID;
    total_v INTEGER;
    unique_v INTEGER;
    avg_wt FLOAT;
    comp_r FLOAT;
BEGIN
    BEGIN
        SELECT org_id INTO org_uuid FROM public.public_sermons WHERE id = target_sermon_id;
        
        -- Aggregation logic ...
        SELECT COUNT(*) INTO total_v FROM public.member_analytics WHERE sermon_id = target_sermon_id AND event_type = 'play';
        SELECT COUNT(DISTINCT user_id) INTO unique_v FROM public.member_analytics WHERE sermon_id = target_sermon_id;
        
        SELECT CASE WHEN COUNT(id) FILTER (WHERE event_type = 'play') > 0 
               THEN (SUM(watch_time) / COUNT(id) FILTER (WHERE event_type = 'play'))
               ELSE 0 END INTO avg_wt 
        FROM public.member_analytics WHERE sermon_id = target_sermon_id;

        SELECT CASE WHEN COUNT(id) FILTER (WHERE event_type = 'play') > 0 
               THEN (COUNT(id) FILTER (WHERE event_type = 'complete')::FLOAT / COUNT(id) FILTER (WHERE event_type = 'play')::FLOAT) * 100
               ELSE 0 END INTO comp_r 
        FROM public.member_analytics WHERE sermon_id = target_sermon_id;

        INSERT INTO public.sermon_metrics (org_id, sermon_id, total_views, unique_viewers, avg_watch_time_seconds, completion_rate, last_aggregated_at)
        VALUES (org_uuid, target_sermon_id, total_v, unique_v, avg_wt, comp_r, now())
        ON CONFLICT (sermon_id) DO UPDATE SET
            total_views = excluded.total_views,
            unique_viewers = excluded.unique_viewers,
            avg_watch_time_seconds = excluded.avg_watch_time_seconds,
            completion_rate = excluded.completion_rate,
            last_aggregated_at = now();

    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.system_logs (level, component, event_type, message, metadata)
        VALUES ('warning', 'analytics', 'aggregation_failure', 
               format('Failed to aggregate stats for sermon: %s', target_sermon_id), 
               jsonb_build_object('error', SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
