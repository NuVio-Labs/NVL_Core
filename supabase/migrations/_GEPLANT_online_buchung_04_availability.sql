-- GEPLANT (noch NICHT angewendet) — Teil 4 Online-Buchung: Verfügbarkeit.
-- Endkunde wählt einen Zeitraum; wir liefern NUR die an der Station verfügbaren
-- Fahrzeuge. Belegungen (bookings) werden anon NIEMALS direkt gezeigt — die
-- Überschneidungsprüfung läuft serverseitig in einer SECURITY DEFINER RPC.

-- ---------------------------------------------------------------
-- 1. public_companies um den Vorlauf erweitern (datengetrieben pro Mandant).
--    online_booking_lead_hours steuert den frühesten Startzeitpunkt. Default 72,
--    falls im settings-JSON nicht gesetzt.
-- ---------------------------------------------------------------
create or replace view public.public_companies
with (security_barrier = true) as
  select
    c.slug,
    c.name,
    coalesce((c.settings->>'online_booking_lead_hours')::int, 72) as lead_hours
  from public.companies c;

-- ---------------------------------------------------------------
-- 2. RPC: verfügbare Fahrzeuge einer Station im Zeitraum.
--    Erzwingt serverseitig: gültiger Zeitraum, 72h-Vorlauf (aus settings),
--    Pilot-Flag (online_booking_enabled). Liefert dieselben öffentlichen
--    Felder wie public_vehicles, aber nur die im Fenster freien.
--    Überschneidung = tstzrange-Overlap gegen nicht-stornierte bookings —
--    inkl. status='pending' (eine offene Anfrage blockt den Slot vorläufig).
-- ---------------------------------------------------------------
create or replace function public.public_available_vehicles(
  p_company_slug text,
  p_station_slug text,
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  id           uuid,
  name         text,
  preis_gruppe text,
  ahk          text,
  sitze        int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id  uuid;
  v_lead_hours  int;
  v_station_ok  boolean;
begin
  -- Firma auflösen + Vorlauf lesen.
  select c.id, coalesce((c.settings->>'online_booking_lead_hours')::int, 72)
    into v_company_id, v_lead_hours
  from public.companies c
  where c.slug = p_company_slug;

  if v_company_id is null then
    return; -- unbekannte Firma → leer
  end if;

  -- Zeitraum-Basisvalidierung.
  if p_from is null or p_to is null or p_to <= p_from then
    return;
  end if;

  -- 72h-Vorlauf serverseitig erzwingen (nicht nur im UI).
  if p_from < now() + make_interval(hours => v_lead_hours) then
    return;
  end if;

  -- Pilot-Prüfung: Station muss existieren, aktiv sein UND online_booking_enabled.
  select l.online_booking_enabled
    into v_station_ok
  from public.locations l
  where l.company_id = v_company_id
    and l.slug = p_station_slug
    and l.is_active;

  if v_station_ok is not true then
    return; -- Station nicht freigeschaltet → leer (Pilot-Regel, serverseitig)
  end if;

  -- Fahrzeuge der Station (homebase = station.name), die im Fenster frei sind.
  return query
    select
      r.id,
      r.name,
      r.metadata->>'preis_gruppe',
      r.metadata->>'ahk',
      (r.metadata->>'sitze')::int
    from public.resources r
    join public.locations l
      on l.company_id = r.company_id
     and l.name = (r.metadata->>'homebase')
    where r.company_id = v_company_id
      and l.slug = p_station_slug
      and r.is_active
      and not exists (
        select 1
        from public.bookings b
        where b.resource_id = r.id
          and b.status <> 'cancelled'
          and tstzrange(b.starts_at, b.ends_at, '[)')
              && tstzrange(p_from, p_to, '[)')
      )
    order by r.name;
end;
$$;

-- Nur die RPC ausführbar für anon; kein direkter Tabellenzugriff.
revoke all on function public.public_available_vehicles(text, text, timestamptz, timestamptz) from public;
grant execute on function public.public_available_vehicles(text, text, timestamptz, timestamptz) to anon, authenticated;

-- Prüfen (Zeitraum > 72h in der Zukunft wählen, sonst leer):
--   select * from public.public_available_vehicles(
--     'plt-autovermietung', 'kranenburg',
--     now() + interval '5 days', now() + interval '6 days');
