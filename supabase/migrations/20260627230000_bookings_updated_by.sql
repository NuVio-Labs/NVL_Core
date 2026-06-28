-- Audit-Trail für Buchungen: festhalten, WER zuletzt bearbeitet hat.
-- "created_by" existiert bereits; ergänzt wird "updated_by" analog (FK auf
-- profiles, on delete set null — damit das Löschen eines Profils die Buchung
-- nicht mitlöscht, der Bearbeiter-Bezug aber sauber aufgelöst wird).
-- Additiv, nullable: bestehende Buchungen bleiben unverändert (updated_by NULL).

alter table public.bookings
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

comment on column public.bookings.updated_by is
  'Profil, das die Buchung zuletzt bearbeitet hat (Audit-Trail). NULL = seit Anlage nicht bearbeitet.';
