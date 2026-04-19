-- Add price_list_id to price_list_item_field_definitions so fields are per-list, not company-wide
alter table public.price_list_item_field_definitions
  add column price_list_id uuid references public.price_lists(id) on delete cascade;

-- Migrate existing definitions: assign them to the PKW/9-Sitzer list per company
-- For PLT Autovermietung (4cf746a5-3397-4b9f-9b11-39aa16070929)
update public.price_list_item_field_definitions
set price_list_id = '34a8faea-0146-4cbe-8ad8-6c1bf6c036a1'
where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929';

-- For NuVioLabs (37ce36da-eb8b-4664-b10e-714c752de22b) — assign to their first price list if exists
update public.price_list_item_field_definitions d
set price_list_id = (
  select id from public.price_lists pl
  where pl.company_id = d.company_id
  order by pl.created_at
  limit 1
)
where company_id = '37ce36da-eb8b-4664-b10e-714c752de22b'
  and price_list_id is null;

-- Drop old unique constraint and add new one scoped to price_list_id
alter table public.price_list_item_field_definitions
  drop constraint if exists price_list_item_field_definitions_company_id_name_key;

alter table public.price_list_item_field_definitions
  add constraint price_list_item_field_definitions_price_list_id_name_key
  unique (price_list_id, name);

-- Update RLS policies to use price_list_id for permission check
drop policy if exists "members can read price_list_item_field_definitions" on public.price_list_item_field_definitions;
drop policy if exists "admins can insert price_list_item_field_definitions" on public.price_list_item_field_definitions;
drop policy if exists "admins can update price_list_item_field_definitions" on public.price_list_item_field_definitions;
drop policy if exists "admins can delete price_list_item_field_definitions" on public.price_list_item_field_definitions;

create policy "members can read price_list_item_field_definitions"
  on public.price_list_item_field_definitions for select
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_id
        and get_my_role(pl.company_id) is not null
    )
  );

create policy "admins can insert price_list_item_field_definitions"
  on public.price_list_item_field_definitions for insert
  with check (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_id
        and get_my_role(pl.company_id) in ('owner', 'admin')
    )
  );

create policy "admins can update price_list_item_field_definitions"
  on public.price_list_item_field_definitions for update
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_id
        and get_my_role(pl.company_id) in ('owner', 'admin')
    )
  );

create policy "admins can delete price_list_item_field_definitions"
  on public.price_list_item_field_definitions for delete
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_id
        and get_my_role(pl.company_id) in ('owner', 'admin')
    )
  );
