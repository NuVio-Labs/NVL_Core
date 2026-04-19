-- =============================================================
-- NuVio Core: Konfigurierbare Ressourcenfelder pro Mandant
-- =============================================================

create type public.resource_field_type as enum (
  'text',
  'number',
  'boolean',
  'date'
);

create table public.resource_field_definitions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  name        text not null,
  label       text not null,
  field_type  public.resource_field_type not null default 'text',
  is_required boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (company_id, name)
);

comment on table public.resource_field_definitions is 'Vom Admin konfigurierbare Felder für Ressourcen eines Mandanten';

create trigger set_updated_at_resource_field_definitions
  before update on public.resource_field_definitions
  for each row execute function public.set_updated_at();

create index resource_field_definitions_company_id_idx
  on public.resource_field_definitions (company_id, sort_order);

-- RLS
alter table public.resource_field_definitions enable row level security;

-- Alle aktiven Mitglieder dürfen Felddefinitionen lesen
create policy "resource_field_definitions: member read"
  on public.resource_field_definitions for select
  using (
    exists (
      select 1 from public.memberships m
      where m.company_id = resource_field_definitions.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Nur owner/admin dürfen anlegen, bearbeiten, löschen
create policy "resource_field_definitions: admin insert"
  on public.resource_field_definitions for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

create policy "resource_field_definitions: admin update"
  on public.resource_field_definitions for update
  using (get_my_role(company_id) in ('owner', 'admin'));

create policy "resource_field_definitions: admin delete"
  on public.resource_field_definitions for delete
  using (get_my_role(company_id) in ('owner', 'admin'));
