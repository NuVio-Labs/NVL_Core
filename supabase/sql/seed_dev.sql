-- Dev Seed: NuVioLabs Company + Axel als Owner
-- Anpassen: profile_id auf die echte ID des Users setzen

do $$
declare
  v_company_id uuid := gen_random_uuid();
  v_profile_id uuid;
begin
  -- Profile ID des Users anhand der E-Mail holen
  select id into v_profile_id
  from auth.users
  where email = 'contact@nuviolabs.de'
  limit 1;

  if v_profile_id is null then
    raise exception 'User nicht gefunden. Bitte zuerst registrieren.';
  end if;

  -- Company anlegen
  insert into public.companies (id, name, slug, settings)
  values (v_company_id, 'NuVioLabs', 'nuviolabs', '{}')
  on conflict (slug) do nothing;

  -- Company ID holen falls bereits vorhanden
  select id into v_company_id
  from public.companies
  where slug = 'nuviolabs';

  -- Membership anlegen
  insert into public.memberships (company_id, profile_id, role, status)
  values (v_company_id, v_profile_id, 'owner', 'active')
  on conflict (company_id, profile_id) do nothing;

  raise notice 'Seed erfolgreich: % → % (owner)', v_profile_id, v_company_id;
end;
$$;
