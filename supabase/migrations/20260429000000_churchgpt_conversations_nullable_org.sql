-- ChurchGPT subscribers who sign up directly (not via a church org) have no org_id.
-- Make org_id nullable so their conversations can still be saved and loaded by user_id alone.
-- RLS policy already scopes by user_id = auth.uid(), so no policy changes needed.

ALTER TABLE churchgpt_conversations ALTER COLUMN org_id DROP NOT NULL;
