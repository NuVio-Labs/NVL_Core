-- =============================================================
-- Fix: Eingeladene Mitglieder können ihre eigene Membership beim
-- Onboarding aktivieren (invited -> active, Standort + Felder setzen).
--
-- Die Policy aus 20260418000009 ist in der laufenden DB nicht aktiv,
-- daher trifft das Onboarding-UPDATE 0 Zeilen ("Fehler beim Speichern").
-- Diese Migration legt sie sauber (neu) an.
--
-- Rollen-Eskalation ist hierüber nicht möglich: das Onboarding sendet
-- ausschließlich status/location/metadata, niemals role. Die separate
-- Admin-Policy ("admins can update memberships") bleibt für Rollen-
-- änderungen zuständig.
-- =============================================================

drop policy if exists "members can update own membership on onboarding" on public.memberships;

create policy "members can update own membership on onboarding"
  on public.memberships
  for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
