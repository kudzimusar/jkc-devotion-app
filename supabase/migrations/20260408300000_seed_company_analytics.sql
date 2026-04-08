-- Seed company_analytics with today's real aggregated data from existing tables.
-- Safe to re-run: ON CONFLICT updates rather than duplicates.

INSERT INTO company_analytics (date, metrics)
VALUES (
  CURRENT_DATE,
  jsonb_build_object(
    'total_orgs',         (SELECT COUNT(*) FROM organizations),
    'total_members',      (SELECT COUNT(*) FROM profiles),
    'total_inquiries',    (SELECT COUNT(*) FROM public_inquiries),
    'total_soap_entries', (SELECT COUNT(*) FROM soap_entries),
    'total_insights',     0,
    'avg_helpfulness',    0,
    'mrr',                0,
    'churn_rate',         0,
    'open_rate',          0
  )
)
ON CONFLICT (date) DO UPDATE
  SET metrics = EXCLUDED.metrics;
