-- customers table
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  email           text,
  phone           text,
  street          text,
  city            text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index customers_company_id_idx on public.customers(company_id);

-- updated_at trigger
create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- RLS
alter table public.customers enable row level security;

create policy customers_select on public.customers
  for select using (
    company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid()
        and status in ('active', 'invited')
    )
  );

create policy customers_insert on public.customers
  for insert with check (
    company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid()
        and status = 'active'
        and role in ('admin', 'editor')
    )
  );

create policy customers_update on public.customers
  for update using (
    company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid()
        and status = 'active'
        and role in ('admin', 'editor')
    )
  );

create policy customers_delete on public.customers
  for delete using (
    company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid()
        and status = 'active'
        and role = 'admin'
    )
  );

-- optional FK on bookings and contracts
alter table public.bookings add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.contracts add column if not exists customer_id uuid references public.customers(id) on delete set null;
