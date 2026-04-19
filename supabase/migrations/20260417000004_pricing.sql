-- price_lists
create table public.price_lists (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.price_lists enable row level security;

create policy "members can read price_lists"
  on public.price_lists for select
  using (get_my_role(company_id) is not null);

create policy "admins can insert price_lists"
  on public.price_lists for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can update price_lists"
  on public.price_lists for update
  using (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can delete price_lists"
  on public.price_lists for delete
  using (get_my_role(company_id) in ('owner', 'admin'));

-- price_list_items
create table public.price_list_items (
  id             uuid primary key default gen_random_uuid(),
  price_list_id  uuid not null references public.price_lists(id) on delete cascade,
  name           text not null,
  unit           text not null,
  price_per_unit numeric(12, 4) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.price_list_items enable row level security;

create policy "members can read price_list_items"
  on public.price_list_items for select
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and get_my_role(pl.company_id) is not null
    )
  );

create policy "admins can insert price_list_items"
  on public.price_list_items for insert
  with check (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and get_my_role(pl.company_id) in ('owner', 'admin')
    )
  );

create policy "admins can update price_list_items"
  on public.price_list_items for update
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and get_my_role(pl.company_id) in ('owner', 'admin')
    )
  );

create policy "admins can delete price_list_items"
  on public.price_list_items for delete
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and get_my_role(pl.company_id) in ('owner', 'admin')
    )
  );
