-- GEPLANT (noch NICHT angewendet) — Teil 2 Online-Buchung.
-- locations bekommt slug (für die öffentliche URL/Stationswahl) + phone
-- (für den "telefonisch buchen"-Fall, pro Station eigene Nummer) +
-- online_booking_enabled (Pilot-Flag: nur freigeschaltete Stationen zeigen den
-- vollen Online-Flow; alle anderen zeigen Beta-Hinweis + Anruf-Button).

alter table public.locations
  add column if not exists slug  text,
  add column if not exists phone text,
  add column if not exists online_booking_enabled boolean not null default false;

comment on column public.locations.slug  is 'URL-Slug der Station für die öffentliche Online-Buchung (z.B. kranenburg).';
comment on column public.locations.phone is 'Telefonnummer der Station für den "telefonisch buchen"-Fall.';
comment on column public.locations.online_booking_enabled is 'Pilot-Flag: true = voller Online-Buchungs-Flow; false = Beta-Hinweis + Anruf-Button. Weitere Stationen per einfachem Update freischalten.';

-- Slug eindeutig pro company (zwei Mandanten könnten je eine Station "weeze" haben).
create unique index if not exists locations_company_slug_uidx
  on public.locations (company_id, slug) where slug is not null;

-- Fehlende Stationen ergänzen: Geldern, Rheinberg, Sonsbeck stehen auf der PLT-Website
-- (plt-autovermietung.de/vermietstationen), fehlten aber in locations. Idempotent per
-- "not exists"-Guard auf slug, damit ein erneuter Lauf nichts doppelt anlegt.
insert into public.locations (company_id, name, address, phone, slug, is_active)
select v.company_id, v.name, v.address, v.phone, v.slug, true
from (values
  ('4cf746a5-3397-4b9f-9b11-39aa16070929'::uuid, 'Geldern',   'Shell Tankstelle Geldern, Burgstrasse 12, 47608 Geldern',    '02831-1329752', 'geldern'),
  ('4cf746a5-3397-4b9f-9b11-39aa16070929'::uuid, 'Rheinberg', 'PM Tankstelle Rheinberg, Rheinberger Str. 373, 47495 Rheinberg', '02844-1309',    'rheinberg'),
  ('4cf746a5-3397-4b9f-9b11-39aa16070929'::uuid, 'Sonsbeck',  'BFT Tankstelle Sonsbeck, Weseler Strasse 17, 47665 Sonsbeck', '02838-96566',   'sonsbeck')
) as v(company_id, name, address, phone, slug)
where not exists (
  select 1 from public.locations l
  where l.company_id = v.company_id and l.slug = v.slug
);

-- PLT-Stationen-Slugs befüllen (company_id = PLT). Slug aus dem Stationsnamen
-- abgeleitet (Weeze→weeze usw.) — die 8 Namen sind im Plan verifiziert.
update public.locations l
set slug = lower(
      translate(l.name, 'äöüÄÖÜß ', 'aouaous-')
    )
where l.company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929'
  and l.slug is null;

-- Echte Stationsnummern (Quelle: plt-autovermietung.de/vermietstationen, 02.07.2026).
-- Pro Station gezielt per slug gesetzt — dasselbe Muster wie die Pilot-Freischaltung.
-- Nur die 8 in der DB geführten Stationen; Geldern/Rheinberg/Sonsbeck existieren dort nicht.
update public.locations set phone = '02837-962551'  where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'weeze';
update public.locations set phone = '02826-437'     where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'kranenburg';
update public.locations set phone = '02823-3414'    where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'goch';
update public.locations set phone = '02824-962245'  where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'kalkar';
update public.locations set phone = '02832-7236'    where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'kevelaer';
update public.locations set phone = '02802-700901'  where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'alpen';
update public.locations set phone = '02825-539955'  where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'uedem';
update public.locations set phone = '02801-9871491' where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' and slug = 'xanten';

-- PILOT: nur Kranenburg bekommt den vollen Online-Flow. Alle anderen bleiben auf
-- default false (Beta-Hinweis + Anruf-Button). Weitere Stationen später mit
-- demselben Update-Muster (slug='...') freischalten.
update public.locations
set online_booking_enabled = true
where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929'
  and slug = 'kranenburg';

-- Ergebnis prüfen: select name, slug, phone, online_booking_enabled from locations
--   where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' order by name;
-- Erwartet: 11 Zeilen (weeze, kranenburg, goch, kalkar, kevelaer, alpen, uedem, xanten,
-- geldern, rheinberg, sonsbeck), jede mit slug + echter phone;
-- online_booking_enabled = true NUR bei kranenburg.
