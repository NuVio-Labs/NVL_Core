-- =============================================================
-- NuVio Core: editor Rolle + resources Tabelle
-- =============================================================

-- ---------------------------------------------------------------
-- ENUM: editor zur membership_role hinzufügen
-- ---------------------------------------------------------------

alter type public.membership_role add value if not exists 'editor';

-- ---------------------------------------------------------------
-- RESOURCES
-- ---------------------------------------------------------------

create table public.resources (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  name          text not null,
  description   text,
  is_active     boolean not null default true,
  metadata      jsonb not null default '{}',
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.resources is 'Ressourcen eines Mandanten (z.B. Fahrzeuge, Räume, Geräte)';

create trigger set_updated_at_resources
  before update on public.resources
  for each row execute function public.set_updated_at();

create index resources_company_id_idx on public.resources (company_id);

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------

alter table public.resources enable row level security;

-- Hilfsfunktion: aktive Rolle des aktuellen Users in einer Company
create or replace function public.get_my_role(p_company_id uuid)
returns text language sql security definer stable as $$
  select role::text
  from public.memberships
  where company_id = p_company_id
    and profile_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- Alle aktiven Mitglieder dürfen Ressourcen lesen
create policy "resources: member read"
  on public.resources for select
  using (
    exists (
      select 1 from public.memberships m
      where m.company_id = resources.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Nur owner und admin dürfen anlegen
create policy "resources: admin insert"
  on public.resources for insert
  with check (
    get_my_role(company_id) in ('owner', 'admin')
  );

-- Nur owner und admin dürfen bearbeiten
create policy "resources: admin update"
  on public.resources for update
  using (
    get_my_role(company_id) in ('owner', 'admin')
  );

-- Nur owner und admin dürfen löschen
create policy "resources: admin delete"
  on public.resources for delete
  using (
    get_my_role(company_id) in ('owner', 'admin')
  );
