-- Migration 007: Automation Layer & Analytics Aggregation
-- Objective: Transition from manual tool to self-running system.

-- 1. Metadata Schema for Analytics Insights
CREATE TABLE IF NOT EXISTS public.sermon_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    sermon_id UUID NOT NULL REFERENCES public.public_sermons(id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    avg_watch_time_seconds FLOAT DEFAULT 0,
    completion_rate FLOAT DEFAULT 0, -- % of users who hit 'complete'
    drop_off_data JSONB DEFAULT '[]'::jsonb, -- Array of [time, count]
    last_aggregated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sermon_id)
);

ALTER TABLE public.sermon_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation metrics" ON public.sermon_metrics
FOR SELECT USING (org_id::text IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
));

-- 2. Automated Live-to-Sermon Pipeline
CREATE OR REPLACE FUNCTION public.handle_live_end_automation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status moves from 'live' to 'ended'
    IF (OLD.status = 'live' AND NEW.status = 'ended') THEN
        -- Safely create a new sermon if one doesn't exist for this stream URL
        INSERT INTO public.public_sermons (
            org_id,
            title,
            speaker,
            date,
            is_featured,
            status,
            video_source_type,
            youtube_url,
            description
        )
        VALUES (
            NEW.org_id,
            COALESCE(NEW.metadata->>'title', 'Sunday Service Archive'),
            COALESCE(NEW.metadata->>'speaker', 'Church Admin'),
            CURRENT_DATE,
            true, -- Automatically feature the recording
            'published',
            'youtube',
            NEW.stream_url,
            'Automatically archived from live broadcast.'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_on_live_end
AFTER UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION handle_live_end_automation();

-- 3. Analytics Aggregation Logic (The "Insights" Layer)
CREATE OR REPLACE FUNCTION public.aggregate_sermon_stats(target_sermon_id UUID)
RETURNS VOID AS $$
DECLARE
    org_uuid UUID;
    total_v INTEGER;
    unique_v INTEGER;
    avg_wt FLOAT;
    comp_r FLOAT;
BEGIN
    -- Get Org ID
    SELECT org_id INTO org_uuid FROM public.public_sermons WHERE id = target_sermon_id;
    
    -- Total Views (Play events)
    SELECT COUNT(*) INTO total_v FROM public.member_analytics WHERE sermon_id = target_sermon_id AND event_type = 'play';
    
    -- Unique Viewers
    SELECT COUNT(DISTINCT user_id) INTO unique_v FROM public.member_analytics WHERE sermon_id = target_sermon_id;
    
    -- Avg Watch Time (Sum of retention pings * 30s) / total plays
    SELECT 
        CASE WHEN COUNT(id) FILTER (WHERE event_type = 'play') > 0 
        THEN (SUM(watch_time) / COUNT(id) FILTER (WHERE event_type = 'play'))
        ELSE 0 END
    INTO avg_wt 
    FROM public.member_analytics WHERE sermon_id = target_sermon_id;

    -- Completion Rate
    SELECT 
        CASE WHEN COUNT(id) FILTER (WHERE event_type = 'play') > 0 
        THEN (COUNT(id) FILTER (WHERE event_type = 'complete')::FLOAT / COUNT(id) FILTER (WHERE event_type = 'play')::FLOAT) * 100
        ELSE 0 END
    INTO comp_r 
    FROM public.member_analytics WHERE sermon_id = target_sermon_id;

    -- Upsert into metrics
    INSERT INTO public.sermon_metrics (
        org_id, 
        sermon_id, 
        total_views, 
        unique_viewers, 
        avg_watch_time_seconds, 
        completion_rate, 
        last_aggregated_at
    )
    VALUES (org_uuid, target_sermon_id, total_v, unique_v, avg_wt, comp_r, now())
    ON CONFLICT (sermon_id) DO UPDATE SET
        total_views = excluded.total_views,
        unique_viewers = excluded.unique_viewers,
        avg_watch_time_seconds = excluded.avg_watch_time_seconds,
        completion_rate = excluded.completion_rate,
        last_aggregated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
