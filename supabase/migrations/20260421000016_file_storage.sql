-- company_files: metadata table for uploaded files
create table if not exists public.company_files (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  entity_type  text not null, -- 'resource' | 'contract' | 'customer' | 'company'
  entity_id    uuid not null,
  file_name    text not null,
  file_path    text not null, -- storage path: {company_id}/{entity_type}/{entity_id}/{filename}
  file_size    bigint,
  mime_type    text,
  label        text, -- optional user-facing label
  uploaded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index company_files_company_id_idx  on public.company_files (company_id);
create index company_files_entity_idx      on public.company_files (entity_type, entity_id);

alter table public.company_files enable row level security;

create policy "files_select" on public.company_files
  for select using (
    exists (
      select 1 from public.memberships m
      where m.company_id = company_files.company_id
        and m.profile_id = auth.uid()
        and m.status in ('active', 'invited')
    )
  );

create policy "files_insert" on public.company_files
  for insert with check (
    exists (
      select 1 from public.memberships m
      where m.company_id = company_files.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
        and m.role in ('admin', 'editor')
    )
  );

create policy "files_delete" on public.company_files
  for delete using (
    exists (
      select 1 from public.memberships m
      where m.company_id = company_files.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
        and m.role in ('admin', 'editor')
    )
  );
