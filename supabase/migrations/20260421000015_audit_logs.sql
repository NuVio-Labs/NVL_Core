create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  table_name   text not null,
  record_id    uuid not null,
  action       text not null check (action in ('insert', 'update', 'delete')),
  old_data     jsonb,
  new_data     jsonb,
  profile_id   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index audit_logs_company_id_idx on public.audit_logs (company_id);
create index audit_logs_record_idx    on public.audit_logs (table_name, record_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

-- Members can read audit logs for their company
create policy "audit_logs_select" on public.audit_logs
  for select using (
    exists (
      select 1 from public.memberships m
      where m.company_id = audit_logs.company_id
        and m.profile_id = auth.uid()
        and m.status in ('active', 'invited')
    )
  );

-- Only DB triggers insert into audit_logs (no direct client insert)
-- Admins/editors may read; no client-side insert/update/delete policy

-- Trigger function for contracts
create or replace function public.audit_contracts()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'contracts', new.id, 'insert', null, to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'contracts', new.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (old.company_id, 'contracts', old.id, 'delete', to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger contracts_audit
  after insert or update or delete on public.contracts
  for each row execute function public.audit_contracts();

-- Trigger function for bookings
create or replace function public.audit_bookings()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'bookings', new.id, 'insert', null, to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'bookings', new.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (old.company_id, 'bookings', old.id, 'delete', to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger bookings_audit
  after insert or update or delete on public.bookings
  for each row execute function public.audit_bookings();
