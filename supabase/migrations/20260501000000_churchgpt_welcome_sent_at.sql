-- Add welcome_sent_at to track which ChurchGPT users have received a welcome email.
-- NULL = not yet sent. Allows bulk backfill and prevents duplicate sends.

ALTER TABLE public.churchgpt_users
  ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz DEFAULT NULL;
