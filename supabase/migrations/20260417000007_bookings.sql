-- required for the exclusion constraint on uuid + tstzrange
create extension if not exists btree_gist;

-- bookings
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  resource_id     uuid not null references public.resources(id) on delete restrict,
  price_list_id   uuid references public.price_lists(id) on delete set null,
  price_list_item_id uuid references public.price_list_items(id) on delete set null,

  -- customer fields
  first_name      text not null,
  last_name       text not null,
  phone           text not null,

  -- time
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,

  -- duration key (e.g. "tarif_24std") — the field that was used for pricing
  duration_field  text,

  -- calculated price snapshot at time of booking
  price_snapshot  numeric(12, 4),

  -- free text
  notes           text,

  -- dynamic fields
  metadata        jsonb not null default '{}',

  -- status
  status          text not null default 'confirmed'
                    check (status in ('confirmed', 'cancelled', 'completed')),

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- prevent overlapping bookings for the same resource
  constraint no_overlap exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status != 'cancelled')
);

create index bookings_company_id_idx on public.bookings (company_id);
create index bookings_resource_id_idx on public.bookings (resource_id);
create index bookings_starts_at_idx on public.bookings (starts_at);

alter table public.bookings enable row level security;

create policy "members can read bookings"
  on public.bookings for select
  using (get_my_role(company_id) is not null);

create policy "members can insert bookings"
  on public.bookings for insert
  with check (get_my_role(company_id) is not null);

create policy "admins can update bookings"
  on public.bookings for update
  using (get_my_role(company_id) in ('owner', 'admin', 'editor'));

create policy "admins can delete bookings"
  on public.bookings for delete
  using (get_my_role(company_id) in ('owner', 'admin'));

-- booking_field_definitions (modular extra fields, analog to resource_field_definitions)
create table public.booking_field_definitions (
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

alter table public.booking_field_definitions enable row level security;

create policy "members can read booking_field_definitions"
  on public.booking_field_definitions for select
  using (get_my_role(company_id) is not null);

create policy "admins can insert booking_field_definitions"
  on public.booking_field_definitions for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can update booking_field_definitions"
  on public.booking_field_definitions for update
  using (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can delete booking_field_definitions"
  on public.booking_field_definitions for delete
  using (get_my_role(company_id) in ('owner', 'admin'));

-- duration_tariff_mappings: maps a display label + duration in minutes to a price field name
-- e.g. label="24 Stunden", duration_minutes=1440, field_name="tarif_24std"
create table public.duration_tariff_mappings (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  label            text not null,
  duration_minutes integer not null,
  field_name       text not null,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  unique (company_id, field_name)
);

alter table public.duration_tariff_mappings enable row level security;

create policy "members can read duration_tariff_mappings"
  on public.duration_tariff_mappings for select
  using (get_my_role(company_id) is not null);

create policy "admins can insert duration_tariff_mappings"
  on public.duration_tariff_mappings for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can update duration_tariff_mappings"
  on public.duration_tariff_mappings for update
  using (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can delete duration_tariff_mappings"
  on public.duration_tariff_mappings for delete
  using (get_my_role(company_id) in ('owner', 'admin'));

