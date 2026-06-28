-- GEPLANT (noch NICHT angewendet) — Teil 2 Online-Buchung.
-- locations bekommt slug (für die öffentliche URL/Stationswahl) + phone
-- (für den "telefonisch buchen"-Fall, pro Station eigene Nummer).

alter table public.locations
  add column if not exists slug  text,
  add column if not exists phone text;

comment on column public.locations.slug  is 'URL-Slug der Station für die öffentliche Online-Buchung (z.B. kranenburg).';
comment on column public.locations.phone is 'Telefonnummer der Station für den "telefonisch buchen"-Fall.';

-- Slug eindeutig pro company (zwei Mandanten könnten je eine Station "weeze" haben).
create unique index if not exists locations_company_slug_uidx
  on public.locations (company_id, slug) where slug is not null;

-- PLT-Stationen-Slugs befüllen (company_id = PLT). Telefonnummern sind PLATZHALTER
-- (02837/76 57 = zentrale Nummer aus dem Vertrag) — von Axel pro Station ersetzen.
update public.locations l
set slug = lower(
      translate(l.name, 'äöüÄÖÜß ', 'aouaous-')
    ),
    phone = coalesce(l.phone, '02837/7657')
where l.company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929'
  and l.slug is null;

-- Ergebnis prüfen: select name, slug, phone from locations
--   where company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' order by name;
-- Erwartet: kranenburg, kalkar, weeze, goch, kevelaer, alpen, uedem, xanten.
