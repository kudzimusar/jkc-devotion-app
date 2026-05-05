-- Fix 3 broken DB objects causing Mission Control dashboard to fail
-- 1. vw_geo_planting_opportunities missing org_id column
-- 2. get_morning_briefing missing from migrations (GROUP BY error)
-- 3. fn_preview_context_count missing (login email-blur hint hangs)

-- ── 1. Fix vw_geo_planting_opportunities (add org_id to SELECT + GROUP BY) ──
CREATE OR REPLACE VIEW public.vw_geo_planting_opportunities AS
SELECT
    p.org_id,
    p.ward,
    count(*)::int                                                            AS member_count,
    (SELECT count(*) FROM public.fellowship_groups fg
     WHERE lower(fg.ward) = lower(p.ward))::int                             AS group_count
FROM public.profiles p
WHERE p.ward IS NOT NULL AND p.ward != ''
GROUP BY p.org_id, p.ward
HAVING count(*) >= 5
   AND (SELECT count(*) FROM public.fellowship_groups fg
        WHERE lower(fg.ward) = lower(p.ward)) = 0;

GRANT SELECT ON public.vw_geo_planting_opportunities TO authenticated;

-- ── 2. Recreate get_morning_briefing with correct GROUP BY ──
-- The previous version selected d.auto_send_at outside an aggregate without GROUP BY.
-- Fix: use MIN(auto_send_at) so campaign_type is the only group key.
CREATE OR REPLACE FUNCTION public.get_morning_briefing(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending_drafts jsonb;
    v_urgent_inbound jsonb;
    v_sent_24h       int := 0;
    v_opened_24h     int := 0;
    v_replies_24h    int := 0;
BEGIN
    -- Pending drafts by campaign_type
    SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
    INTO v_pending_drafts
    FROM (
        SELECT
            campaign_type,
            count(*)::int                    AS count,
            MIN(auto_send_at)                AS next_auto_send_at
        FROM public.communication_drafts
        WHERE org_id     = p_org_id
          AND review_status = 'pending_review'
        GROUP BY campaign_type
        ORDER BY count(*) DESC
    ) sub;

    -- Urgent inbound (graceful — table/column may evolve)
    BEGIN
        SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
        INTO v_urgent_inbound
        FROM (
            SELECT
                id,
                COALESCE(ai_summary, preview, '')     AS ai_summary,
                COALESCE(ai_urgency_score, 0)::int    AS ai_urgency_score,
                COALESCE(from_name, sender_name, '')  AS from_name,
                occurred_at
            FROM public.communication_events
            WHERE org_id    = p_org_id
              AND direction  = 'inbound'
              AND occurred_at >= now() - interval '48 hours'
              AND COALESCE(ai_urgency_score, 0) >= 60
            ORDER BY ai_urgency_score DESC NULLS LAST
            LIMIT 10
        ) sub;
    EXCEPTION WHEN others THEN
        v_urgent_inbound := '[]'::jsonb;
    END;

    -- 24 h sent count
    BEGIN
        SELECT count(*)::int INTO v_sent_24h
        FROM public.communication_deliveries
        WHERE org_id  = p_org_id
          AND sent_at >= now() - interval '24 hours';
    EXCEPTION WHEN others THEN NULL;
    END;

    -- 24 h opened count
    BEGIN
        SELECT count(*)::int INTO v_opened_24h
        FROM public.communication_deliveries
        WHERE org_id    = p_org_id
          AND opened_at >= now() - interval '24 hours';
    EXCEPTION WHEN others THEN NULL;
    END;

    -- 24 h replies (inbound events)
    BEGIN
        SELECT count(*)::int INTO v_replies_24h
        FROM public.communication_events
        WHERE org_id     = p_org_id
          AND direction   = 'inbound'
          AND occurred_at >= now() - interval '24 hours';
    EXCEPTION WHEN others THEN NULL;
    END;

    RETURN jsonb_build_object(
        'pending_drafts',    v_pending_drafts,
        'urgent_inbound',    COALESCE(v_urgent_inbound, '[]'::jsonb),
        'recent_engagement', jsonb_build_object(
            'last_24h_sent',    v_sent_24h,
            'last_24h_opened',  v_opened_24h,
            'last_24h_replies', v_replies_24h
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_morning_briefing(uuid) TO authenticated;

-- ── 3. Create fn_preview_context_count (missing — causes login email-blur to hang) ──
CREATE OR REPLACE FUNCTION public.fn_preview_context_count(p_email text, p_domain text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_count   int;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = lower(trim(p_email))
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('count', 0, 'has_multiple', false);
    END IF;

    SELECT count(*)::int INTO v_count
    FROM public.v_user_auth_contexts
    WHERE identity_id = v_user_id
      AND auth_domain = p_domain;

    RETURN jsonb_build_object('count', v_count, 'has_multiple', v_count > 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_preview_context_count(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
