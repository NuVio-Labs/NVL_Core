-- Add location and metadata to memberships for staff management
alter table public.memberships
  add column if not exists location  text,
  add column if not exists metadata  jsonb not null default '{}';

-- staff_field_definitions: admin-defined extra fields per company for staff/memberships
create table public.staff_field_definitions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  label       text not null,
  name        text not null,
  field_type  resource_field_type not null default 'text',
  is_required boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.staff_field_definitions enable row level security;

create policy "members can read staff_field_definitions"
  on public.staff_field_definitions for select
  using (get_my_role(company_id) is not null);

create policy "admins can insert staff_field_definitions"
  on public.staff_field_definitions for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can update staff_field_definitions"
  on public.staff_field_definitions for update
  using (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can delete staff_field_definitions"
  on public.staff_field_definitions for delete
  using (get_my_role(company_id) in ('owner', 'admin'));

-- Allow admins to update membership location/metadata/role
create policy "admins can update memberships"
  on public.memberships for update
  using (get_my_role(company_id) in ('owner', 'admin'));

-- Allow admins to insert memberships (invite staff)
create policy "admins can insert memberships"
  on public.memberships for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

-- Allow admins to delete memberships
create policy "admins can delete memberships"
  on public.memberships for delete
  using (get_my_role(company_id) in ('owner', 'admin'));
