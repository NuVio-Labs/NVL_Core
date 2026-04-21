create table if not exists public.locations (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  name         text not null,
  address      text,
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index locations_company_id_idx on public.locations (company_id);

create trigger set_locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;

create policy "locations_select" on public.locations
  for select using (
    exists (
      select 1 from public.memberships m
      where m.company_id = locations.company_id
        and m.profile_id = auth.uid()
        and m.status in ('active', 'invited')
    )
  );

create policy "locations_insert" on public.locations
  for insert with check (
    exists (
      select 1 from public.memberships m
      where m.company_id = locations.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
        and m.role in ('admin', 'editor')
    )
  );

create policy "locations_update" on public.locations
  for update using (
    exists (
      select 1 from public.memberships m
      where m.company_id = locations.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
        and m.role in ('admin', 'editor')
    )
  );

create policy "locations_delete" on public.locations
  for delete using (
    exists (
      select 1 from public.memberships m
      where m.company_id = locations.company_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
        and m.role = 'admin'
    )
  );
