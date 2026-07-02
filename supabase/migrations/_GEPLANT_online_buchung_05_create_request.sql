-- GEPLANT (noch NICHT angewendet) — Teil 5 Online-Buchung: Anfrage anlegen.
-- Die EINZIGE Schreiboperation für anon. Kein direkter INSERT auf bookings —
-- alles über diese SECURITY DEFINER RPC mit vollständiger serverseitiger
-- Validierung. Schreibt eine Buchung mit status='pending' (Anfrage), die PLT
-- im Dashboard bestätigt/ablehnt (Etappe 6).
--
-- Spam-Schutz für den Pilot: Honeypot (leeres Feld muss leer bleiben) +
-- DB-Drossel — eine überlappende pending/confirmed-Buchung blockt das Auto
-- bereits (no_overlap-Constraint zählt pending mit). Echtes IP-Rate-Limit /
-- Turnstile später nachrüstbar.

create or replace function public.create_public_booking_request(
  p_company_slug text,
  p_station_slug text,
  p_resource_id  uuid,
  p_from         timestamptz,
  p_to           timestamptz,
  p_first_name   text,
  p_last_name    text,
  p_phone        text,
  p_email        text default null,
  p_notes        text default null,
  p_honeypot     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_lead_hours int;
  v_station_ok boolean;
  v_resource_ok boolean;
  v_booking_id uuid;
begin
  -- Honeypot: von Menschen nie ausgefüllt. Wenn befüllt → so tun als ob ok
  -- (Bot merkt nichts), aber NICHTS schreiben.
  if p_honeypot is not null and length(btrim(p_honeypot)) > 0 then
    return jsonb_build_object('status', 'ok');
  end if;

  -- Pflichtfelder.
  if coalesce(btrim(p_first_name), '') = ''
     or coalesce(btrim(p_last_name), '') = ''
     or coalesce(btrim(p_phone), '') = '' then
    return jsonb_build_object('status', 'error', 'reason', 'missing_fields');
  end if;

  -- Firma auflösen + Vorlauf.
  select c.id, coalesce((c.settings->>'online_booking_lead_hours')::int, 72)
    into v_company_id, v_lead_hours
  from public.companies c
  where c.slug = p_company_slug;

  if v_company_id is null then
    return jsonb_build_object('status', 'error', 'reason', 'unknown_company');
  end if;

  -- Zeitraum-Validierung + 72h-Vorlauf (serverseitig, nicht umgehbar).
  if p_from is null or p_to is null or p_to <= p_from then
    return jsonb_build_object('status', 'error', 'reason', 'invalid_range');
  end if;
  if p_from < now() + make_interval(hours => v_lead_hours) then
    return jsonb_build_object('status', 'error', 'reason', 'lead_time');
  end if;

  -- Pilot-Prüfung: Station freigeschaltet?
  select l.online_booking_enabled
    into v_station_ok
  from public.locations l
  where l.company_id = v_company_id
    and l.slug = p_station_slug
    and l.is_active;

  if v_station_ok is not true then
    return jsonb_build_object('status', 'error', 'reason', 'station_disabled');
  end if;

  -- Fahrzeug muss zur Firma gehören, aktiv sein UND an dieser Station
  -- beheimatet (homebase = station.name).
  select true
    into v_resource_ok
  from public.resources r
  join public.locations l
    on l.company_id = r.company_id
   and l.name = (r.metadata->>'homebase')
  where r.id = p_resource_id
    and r.company_id = v_company_id
    and r.is_active
    and l.slug = p_station_slug;

  if v_resource_ok is not true then
    return jsonb_build_object('status', 'error', 'reason', 'invalid_vehicle');
  end if;

  -- Zeitraum frei? Überlappende, nicht-stornierte Buchung (inkl. pending) blockt.
  if exists (
    select 1 from public.bookings b
    where b.resource_id = p_resource_id
      and b.status <> 'cancelled'
      and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_from, p_to, '[)')
  ) then
    return jsonb_build_object('status', 'error', 'reason', 'not_available');
  end if;

  -- Anfrage schreiben. status='pending', Quelle + Kontakt-E-Mail in metadata
  -- (bookings hat keine email-Spalte — etabliertes Muster). no_overlap-Constraint
  -- ist die letzte Absicherung gegen parallele Races.
  insert into public.bookings (
    company_id, resource_id, first_name, last_name, phone,
    starts_at, ends_at, notes, status, metadata
  ) values (
    v_company_id, p_resource_id, btrim(p_first_name), btrim(p_last_name), btrim(p_phone),
    p_from, p_to, nullif(btrim(coalesce(p_notes, '')), ''), 'pending',
    jsonb_strip_nulls(jsonb_build_object(
      'source', 'online',
      'contact_email', nullif(btrim(coalesce(p_email, '')), ''),
      'station_slug', p_station_slug
    ))
  )
  returning id into v_booking_id;

  return jsonb_build_object('status', 'ok', 'booking_id', v_booking_id);

exception
  -- Falls der no_overlap-Constraint bei parallelem Insert doch zuschlägt.
  when exclusion_violation then
    return jsonb_build_object('status', 'error', 'reason', 'not_available');
end;
$$;

revoke all on function public.create_public_booking_request(
  text, text, uuid, timestamptz, timestamptz, text, text, text, text, text, text
) from public;
grant execute on function public.create_public_booking_request(
  text, text, uuid, timestamptz, timestamptz, text, text, text, text, text, text
) to anon, authenticated;

-- Prüfen (Zeitraum >72h in Zukunft; resource_id aus public_available_vehicles):
--   select public.create_public_booking_request(
--     'plt-autovermietung', 'kranenburg', '<resource-uuid>',
--     now() + interval '5 days', now() + interval '6 days',
--     'Max', 'Mustermann', '0170 1234567', 'max@example.com', 'Testanfrage', '');
--   -> {"status":"ok","booking_id":"..."}
--   Danach dieselbe Anfrage erneut -> {"status":"error","reason":"not_available"}
