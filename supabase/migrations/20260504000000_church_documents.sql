-- church_documents: stores AI-generated documents from ChurchGPT session modes
create table if not exists public.church_documents (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references public.organizations(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  mode            text not null,        -- sermon-outline | event-brief | etc.
  title           text not null,
  document_data   jsonb,               -- structured content used to generate the PDF
  pdf_url         text,                -- Supabase Storage public URL
  conversation_id uuid,                -- optional link back to ChurchGPT conversation
  created_at      timestamptz not null default now()
);

-- Index for fast org-scoped listing
create index if not exists church_documents_org_id_idx on public.church_documents(org_id, created_at desc);

-- RLS: org members can read their org's documents; only the creator (or admin) can insert
alter table public.church_documents enable row level security;

create policy "org members can read church_documents"
  on public.church_documents for select
  using (
    org_id in (
      select org_id from public.profiles where id = auth.uid()
    )
  );

create policy "org members can insert church_documents"
  on public.church_documents for insert
  with check (
    org_id in (
      select org_id from public.profiles where id = auth.uid()
    )
  );

create policy "creator can delete church_documents"
  on public.church_documents for delete
  using (created_by = auth.uid());

-- NOTE: Create a Supabase Storage bucket named 'church-documents' with public read access.
-- In the Supabase dashboard: Storage → New Bucket → name: church-documents → Public: true
-- Storage RLS policies for that bucket should allow authenticated users to upload to their org folder.
