-- Add org_id to public_testimonies for multi-tenant isolation

ALTER TABLE public_testimonies
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Backfill existing rows to JKC org
UPDATE public_testimonies
  SET org_id = 'fa547adf-f820-412f-9458-d6bade11517d'
  WHERE org_id IS NULL;

-- Index for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_public_testimonies_org_id ON public_testimonies(org_id);
