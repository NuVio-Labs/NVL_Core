-- =============================================================
-- NuVio Core: Login per Benutzername
-- profiles.username (eindeutig, case-insensitive) + sicherer
-- Lookup-RPC für den Login von nicht angemeldeten Nutzern.
-- =============================================================

-- ---------------------------------------------------------------
-- SPALTE: profiles.username
-- ---------------------------------------------------------------

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is
  'Eindeutiger Login-Name. Case-insensitive eindeutig über lower(username).';

-- Case-insensitive Eindeutigkeit. Erlaubt mehrere NULLs (noch nicht vergeben),
-- aber keine zwei gleichen Namen unabhängig von Groß-/Kleinschreibung.
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------
-- RPC: get_email_for_username
-- Einziger erlaubter Lookup-Pfad Name -> E-Mail für den Login.
-- SECURITY DEFINER, damit nicht angemeldete Nutzer (anon) trotz
-- strenger RLS auf profiles genau diesen einen Schritt machen können.
-- Gibt NUR die E-Mail bei genau einem Treffer zurück, sonst NULL.
-- ---------------------------------------------------------------

create or replace function public.get_email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email
  from public.profiles
  where lower(username) = lower(trim(p_username))
  limit 1
$$;

comment on function public.get_email_for_username(text) is
  'Login-Lookup: gibt die E-Mail zum Benutzernamen zurück (case-insensitive). Nur für den Anmeldevorgang.';

-- Ausführung für Login (auch vor der Anmeldung) erlauben.
grant execute on function public.get_email_for_username(text) to anon, authenticated;

-- ---------------------------------------------------------------
-- BACKFILL der Pilot-Nutzer (manuell vergeben)
-- Stand: nur noch ein Nutzer in der DB.
-- ---------------------------------------------------------------

update public.profiles set username = 'axel' where email = 'contact@nuviolabs.de';
