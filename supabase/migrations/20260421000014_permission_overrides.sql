create table public.company_permission_overrides (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  subject_type text not null check (subject_type in ('role', 'membership')),
  subject_id   text not null,  -- role name or membership.id
  module       text not null,
  action       text not null,
  granted      boolean not null,
  created_at   timestamptz not null default now(),
  unique (company_id, subject_type, subject_id, module, action)
);

create index company_permission_overrides_company_id_idx on public.company_permission_overrides(company_id);

alter table public.company_permission_overrides enable row level security;

create policy perm_overrides_select on public.company_permission_overrides
  for select using (
    company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid()
        and status in ('active', 'invited')
    )
  );

create policy perm_overrides_manage on public.company_permission_overrides
  for all using (
    company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid()
        and status = 'active'
        and role = 'admin'
    )
  );
