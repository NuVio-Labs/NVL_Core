create table public.price_list_item_field_definitions (
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

alter table public.price_list_item_field_definitions enable row level security;

create policy "members can read price_list_item_field_definitions"
  on public.price_list_item_field_definitions for select
  using (get_my_role(company_id) is not null);

create policy "admins can insert price_list_item_field_definitions"
  on public.price_list_item_field_definitions for insert
  with check (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can update price_list_item_field_definitions"
  on public.price_list_item_field_definitions for update
  using (get_my_role(company_id) in ('owner', 'admin'));

create policy "admins can delete price_list_item_field_definitions"
  on public.price_list_item_field_definitions for delete
  using (get_my_role(company_id) in ('owner', 'admin'));

-- metadata column on price_list_items for dynamic field values
alter table public.price_list_items add column metadata jsonb not null default '{}';
