-- Extend audit logging to customers and resources

create or replace function public.audit_customers()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'customers', new.id, 'insert', null, to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'customers', new.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (old.company_id, 'customers', old.id, 'delete', to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger customers_audit
  after insert or update or delete on public.customers
  for each row execute function public.audit_customers();

create or replace function public.audit_resources()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'resources', new.id, 'insert', null, to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (new.company_id, 'resources', new.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_logs (company_id, table_name, record_id, action, old_data, new_data)
    values (old.company_id, 'resources', old.id, 'delete', to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger resources_audit
  after insert or update or delete on public.resources
  for each row execute function public.audit_resources();
