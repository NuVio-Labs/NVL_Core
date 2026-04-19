-- =============================================================
-- NuVio Core: Foundation Schema
-- companies, profiles, memberships
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------

create type public.membership_role as enum (
  'owner',
  'admin',
  'member',
  'viewer'
);

create type public.membership_status as enum (
  'active',
  'invited',
  'suspended'
);

-- ---------------------------------------------------------------
-- COMPANIES (Mandanten)
-- ---------------------------------------------------------------

create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.companies is 'Mandanten der Plattform';

-- ---------------------------------------------------------------
-- PROFILES (Erweiterung von auth.users)
-- ---------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Öffentliche Profildaten pro auth.user';

-- ---------------------------------------------------------------
-- MEMBERSHIPS (Zuordnung User ↔ Company mit Rolle)
-- ---------------------------------------------------------------

create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  role        public.membership_role not null default 'member',
  status      public.membership_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (company_id, profile_id)
);

comment on table public.memberships is 'Zuordnung zwischen Profilen und Mandanten';

-- ---------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ---------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_companies
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_memberships
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- AUTO-PROFILE BEI NEUEM USER
-- ---------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

-- Profiles: eigenes Profil lesen und bearbeiten
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid());

-- Memberships: nur eigene sehen
create policy "memberships: own read"
  on public.memberships for select
  using (profile_id = auth.uid());

-- Companies: sehen wenn Membership vorhanden
create policy "companies: member read"
  on public.companies for select
  using (
    exists (
      select 1 from public.memberships m
      where m.company_id = companies.id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ---------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------

create index memberships_profile_id_idx on public.memberships (profile_id);
create index memberships_company_id_idx on public.memberships (company_id);
create index companies_slug_idx on public.companies (slug);
