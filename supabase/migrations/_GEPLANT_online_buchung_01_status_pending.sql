-- GEPLANT (noch NICHT angewendet) — Teil 1 Online-Buchung.
-- Erweitert bookings.status um 'pending' (für Online-Buchungsanfragen).
-- status ist ein text mit inline-CHECK (kein Enum) → Constraint ersetzen.
--
-- Der inline-Constraint heißt bei Postgres standardmäßig "bookings_status_check".
-- Falls er anders heißt, vorher prüfen mit:
--   select conname from pg_constraint
--   where conrelid = 'public.bookings'::regclass and contype = 'c'
--     and pg_get_constraintdef(oid) ilike '%status%';
-- und unten den Namen anpassen.

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('confirmed', 'cancelled', 'completed', 'pending'));

-- Default bleibt 'confirmed' (interne Buchungen). Online-Buchungen schreiben
-- explizit status='pending' über die RPC create_public_booking_request.
