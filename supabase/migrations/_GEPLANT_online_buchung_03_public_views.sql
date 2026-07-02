-- GEPLANT (noch NICHT angewendet) — Teil 3 Online-Buchung.
-- Öffentliche Lese-Views für die anonyme Endkunden-Buchung. Nur freigegebene
-- Felder, NIEMALS Kennzeichen/interne Daten. anon schreibt nie direkt — Lesen
-- läuft ausschließlich über diese Views.
--
-- Sicherheitsmodell:
--   * Views laufen mit den Rechten des Owners (security_invoker bleibt aus) und
--     umgehen so kontrolliert die RLS der Basistabellen. Deshalb selektieren die
--     Views AKTIV nur freigegebene Felder + filtern hart (is_active etc.).
--   * security_barrier = true verhindert, dass anon per eigener WHERE-Funktion
--     an ausgefilterte Zeilen kommt.
--   * grant select ... to anon, authenticated — nur SELECT, nur diese Views.
--
-- Preis: Der Richtpreis wird NICHT in SQL berechnet (sonst doppelte Preislogik).
-- public_price_items liefert nur die Roh-Tarife; das Frontend matcht mit der
-- vorhandenen pricing.ts-Logik (Kategorie → Privat-Liste → Item → tarif_24std).

-- ---------------------------------------------------------------
-- 1. public_companies — validiert den companySlug, ohne Firmendaten zu leaken.
-- ---------------------------------------------------------------
create or replace view public.public_companies
with (security_barrier = true) as
  select c.slug, c.name
  from public.companies c;

-- ---------------------------------------------------------------
-- 2. public_stations — aktive Stationen einer Firma (join über company slug).
--    online_booking_enabled steuert die Pilot-Weiche im Frontend (und wird in
--    der RPC in Teil 5 serverseitig erneut geprüft).
-- ---------------------------------------------------------------
create or replace view public.public_stations
with (security_barrier = true) as
  select
    c.slug            as company_slug,
    l.name            as name,
    l.slug            as slug,
    l.address         as address,
    l.phone           as phone,
    l.online_booking_enabled as online_booking_enabled
  from public.locations l
  join public.companies c on c.id = l.company_id
  where l.is_active
    and l.slug is not null;

-- ---------------------------------------------------------------
-- 3. public_vehicles — aktive Fahrzeuge einer Station. Zuordnung über
--    metadata->>'homebase' == locations.name (verifiziert deckungsgleich).
--    Öffentlich: name, preis_gruppe (für Typ + Preis-Match), ahk, sitze.
--    NIEMALS: kennzeichen, standort, hauptuntersuchung, interne id-Nutzung.
-- ---------------------------------------------------------------
create or replace view public.public_vehicles
with (security_barrier = true) as
  select
    c.slug                          as company_slug,
    l.slug                          as station_slug,
    r.id                            as id,
    r.name                          as name,
    r.metadata->>'preis_gruppe'     as preis_gruppe,
    r.metadata->>'ahk'              as ahk,
    (r.metadata->>'sitze')::int     as sitze
  from public.resources r
  join public.companies c on c.id = r.company_id
  join public.locations l
    on l.company_id = r.company_id
   and l.name = (r.metadata->>'homebase')
  where r.is_active
    and l.is_active
    and l.slug is not null;

-- ---------------------------------------------------------------
-- 4. public_price_items — nur die PRIVAT-Preislisten-Items einer Firma, reduziert
--    auf das, was der Richtpreis braucht: item-Name (= Preisgruppen-Kern) +
--    24h-Tarif. Gewerbe-Listen bleiben außen vor (Endkunde = privat).
-- ---------------------------------------------------------------
create or replace view public.public_price_items
with (security_barrier = true) as
  select
    c.slug                          as company_slug,
    pl.name                         as price_list_name,
    pli.name                        as item_name,
    pli.metadata->>'tarif_24std'    as tarif_24std
  from public.price_list_items pli
  join public.price_lists pl on pl.id = pli.price_list_id
  join public.companies c on c.id = pl.company_id
  where pl.is_active
    and lower(pl.name) like '%privat%';

-- ---------------------------------------------------------------
-- Rechte: nur SELECT, nur diese Views, für anon + authenticated.
-- ---------------------------------------------------------------
grant select on public.public_companies  to anon, authenticated;
grant select on public.public_stations   to anon, authenticated;
grant select on public.public_vehicles    to anon, authenticated;
grant select on public.public_price_items to anon, authenticated;

-- Prüfen:
--   select * from public.public_stations where company_slug = 'plt-autovermietung' order by name;
--   select * from public.public_vehicles where company_slug = 'plt-autovermietung' and station_slug = 'kranenburg';
--   select * from public.public_price_items where company_slug = 'plt-autovermietung';
