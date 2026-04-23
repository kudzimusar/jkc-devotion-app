-- Fix the broken RLS policy on ministry_metric_logs that caused inserts to fail
DROP POLICY IF EXISTS "Ministry leads log metrics" ON public.ministry_metric_logs;

CREATE POLICY "Ministry leads log metrics" ON public.ministry_metric_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('admin','pastor'))
    OR EXISTS (SELECT 1 FROM public.ministry_members WHERE user_id = auth.uid() AND role IN ('leader', 'admin', 'ministry_leader') AND ministry_id = public.ministry_metric_logs.ministry_id)
);

-- Additionally, check ministry_comms_outbox which might have the same error
DROP POLICY IF EXISTS "Ministry leads can broadcast" ON public.ministry_comms_outbox;

CREATE POLICY "Ministry leads can broadcast" ON public.ministry_comms_outbox FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('admin','pastor'))
    OR EXISTS (SELECT 1 FROM public.ministry_members WHERE user_id = auth.uid() AND role IN ('leader', 'admin', 'ministry_leader') AND ministry_id = public.ministry_comms_outbox.ministry_id)
);
