# Online-Buchung für PLT-Website — UMSETZUNGSREIFER Plan

> Endkunden buchen direkt online ein Auto von einer Station. Stand: 28.06.2026.
> Alle Entscheidungen getroffen, DB-Realität verifiziert. In FRISCHER Session bauen (/clear).
> Package-Manager: **pnpm** (nicht npm!). Verifizieren mit: pnpm exec tsc --noEmit, pnpm run test:run, pnpm build.

> **Update 02.07.2026 (Axel bestätigt):** Formular = **schlanke Anfrage**, NICHT das volle
> Mitarbeiter-Formular replizieren (kein km-Paket, keine verbindliche Endpreis-Zusage an Gäste;
> Richtpreis „ab X €" nur informativ). Freigabe = **eigene „Online-Anfragen"-Liste** im Dashboard
> mit Bestätigen/Ablehnen + Konfliktprüfung. Benachrichtigung = **In-App zuerst** (Badge/Zähler),
> E-Mail (IONOS-SMTP) erst als späterer Schritt. Diese drei Beschlüsse sind final.

---

## ENTSCHEIDUNGEN (alle final, von Axel)

| Thema | Entscheidung |
|---|---|
| Integration | Eigene öffentliche Core-Route (Weg B). PLT verlinkt per Button. Kein iFrame. |
| Buchungsart | **Anfrage (pending)** → PLT bestätigt im Dashboard. Nie sofort verbindlich. |
| Fahrzeug-Filter | Nur Autos mit `metadata.homebase == Station`. Sonst „telefonisch buchen". |
| Preise | **Richtpreis anzeigen** (z.B. „24h ab 55 €"). |
| Kennzeichen | **NICHT** öffentlich. Nur Fahrzeugtyp/Name. |
| Account | **Gast** (Name/Tel/E-Mail), kein Login. |
| URL-Struktur | **Stationswähler auf einer Seite**: `/buchen/plt-autovermietung` → Station wählen → Auto. |
| Spam-Schutz | Erstmal **Honeypot + Rate-Limit** (kein externes Captcha). Turnstile später nachrüstbar. |
| Telefon | **Pro Station eigene Nummer** → locations braucht neues Feld `phone`. |
| Vorlauf | **72h Mindestvorlauf** (`starts_at >= now() + lead`). Konfigurierbar pro Mandant: `companies.settings.online_booking_lead_hours` (Default 72). Erzwungen im Datepicker UND serverseitig in der RPC. |
| Richtpreis | Im **Frontend** via vorhandene `pricing.ts` berechnet (keine doppelte Preislogik in SQL). Text: **„ab X € / 24 h"**. |

---

## VERIFIZIERTE DB-REALITÄT (28.06.2026 per service_role geprüft)

- `companies.slug` existiert. PLT slug = **`plt-autovermietung`**.
- `companies.settings` (JSONB) existiert → online-buchen-Konfig hier rein (datengetrieben).
  Aktuelle Keys: feature_ocr_scan, booking_field_standort, pricing_show_unit_price, booking_field_preisgruppe.
- `locations` (PLT, 8 Stück): id, company_id, name, address, notes, is_active. **KEIN slug, KEIN phone** → beides ergänzen.
- Fahrzeug↔Station: über `resources.metadata->>'homebase'`. Die 8 homebase-Werte decken sich
  EXAKT mit den 8 `locations.name` (Weeze, Kranenburg, Goch, Kalkar, Kevelaer, Alpen, Uedem, Xanten). Keine Inkonsistenz.
- `bookings.status` ist **text mit CHECK (status in ('confirmed','cancelled','completed'))** — KEIN Enum.
  → Für 'pending' nur den CHECK-Constraint erweitern (kleine Migration), kein Enum-Umbau.
- Preis-Quelle: price_list_items + Matching-Logik liegt testbar in `src/features/bookings/lib/pricing.ts`
  (resourceCategory, matchPriceList, matchPriceClassItem, resolveTariff) — WIEDERVERWENDEN.

## ROUTER (verifiziert — minimaler Eingriff)

`src/app/router/index.tsx`: Öffentliche Routen (login/signup/datenschutz) liegen VOR `<ProtectedRoute>`.
→ Neue öffentliche Route einfach als weiteren Eintrag in diese Liste, z.B.:
```
{ path: 'buchen/:companySlug', lazy: () => import('@/pages/PublicBookingPage')... }
```
Kein Umbau am Guard nötig. Eigenes schlankes Public-Layout (KEIN AppShell/Sidebar/Header).

---

## MIGRATIONEN (DDL — via Supabase SQL-Editor, da pnpm/CLI kein DDL über REST)

1. **bookings.status erweitern** um 'pending':
   `alter table bookings drop constraint <name>; add check (status in ('confirmed','cancelled','completed','pending'));`
   (Constraint-Name vorher prüfen.) Default bleibt 'confirmed'. Online-Buchung schreibt 'pending'.
2. **locations.slug + locations.phone + online_booking_enabled** ergänzen. Slugs für die 8 Stationen
   befüllen (kranenburg, kalkar, weeze, goch, kevelaer, alpen, uedem, xanten), phone pro Station.
   `online_booking_enabled boolean default false` — **PILOT: nur `kranenburg` = true.**
   Weitere Stationen später per einfachem UPDATE freischalten (kein Deploy). Bereits in
   `_GEPLANT_online_buchung_02_*.sql` mitgeführt.
3. **Öffentliche Lese-View(s)** (SECURITY DEFINER / RLS) — nur freigegebene Felder:
   - `public_stations(company_slug)` → Stationen (name, slug, address, phone, **online_booking_enabled**) der Firma.
   - `public_vehicles(company_slug, station_slug)` → Fahrzeuge der Station (name, typ aus preis_gruppe,
     Richtpreis 24h, AHK, sitze) — OHNE kennzeichen, OHNE interne Felder.
4. **RPC `create_public_booking_request(...)`** (SECURITY DEFINER): validiert serverseitig
   (Station hat `online_booking_enabled = true`? Fahrzeug gehört zur Station? Zeitraum frei?
   Honeypot leer? Pflichtfelder?), schreibt booking mit status='pending' + metadata.source='online'
   + Kontaktdaten. Rate-Limit pro IP. NIEMALS direkter anon-INSERT auf bookings.
   **Pilot-Regel serverseitig erzwingen** — nicht nur im UI: RPC lehnt Anfragen für Stationen
   mit `online_booking_enabled = false` ab (sonst umgehbar).

## FRONTEND (neue Dateien)

- `src/pages/PublicBookingPage.tsx` — öffentliche Seite, eigenes Layout. Flow:
  1. Station wählen (Dropdown/Liste aus public_stations).
  2. **PILOT-Weiche direkt nach Stationswahl:**
     - `online_booking_enabled === false` (alle außer Kranenburg) → **Beta-Hinweis**
       („Online-Buchung für diese Station ist in Kürze verfügbar — wir arbeiten daran")
       + **Anruf-Button** `tel:<station.phone>` („Station anrufen"). KEIN Formular.
     - `online_booking_enabled === true` (Kranenburg) → weiter mit Schritt 3.
  3. Zeitraum wählen (von/bis).
  4. Verfügbare Autos der Station im Zeitraum (public_vehicles + Verfügbarkeit) mit Richtpreis.
     Auto nicht buchbar/nicht an Station → „Telefonisch buchen: <station.phone>".
  5. Kontaktdaten (Name, Tel, E-Mail) + Honeypot-Feld (versteckt).
  6. Absenden → RPC → Bestätigungsseite „Anfrage eingegangen, PLT meldet sich".
- `src/features/public-booking/` — service (RPC-Calls), hooks, types. Öffentlich = eigener
  Supabase-Client-Pfad ok (anon key), aber nur die Public-RPCs/Views nutzen.
- Preis-Anzeige nutzt vorhandene pricing.ts-Logik (oder die View liefert den Richtpreis fertig).

## DASHBOARD (bestehende App erweitern)

- Neue Liste/Filter „Online-Anfragen" (status='pending', metadata.source='online') — canManage.
- Bestätigen → status='confirmed' (Fahrzeug verbindlich geblockt). Ablehnen → 'cancelled'.
- Bestehende Belegungs-/Konfliktprüfung beim Bestätigen anwenden (Doppelbuchung!).
- Optional E-Mail (IONOS-SMTP, siehe [[deployment_infra]]): an Station bei neuer Anfrage,
  an Kunde bei Bestätigung. Kann Etappe 6 sein.

## BAU-REIHENFOLGE (Etappen)

1. Migrationen 1+2 (status 'pending', locations.slug+phone+online_booking_enabled) via SQL-Editor.
   Slugs/Phones befüllen; NUR kranenburg = online_booking_enabled true.
2. Public-Route + leeres Public-Layout + Stationswähler (statisch).
3. Views 3 (inkl. online_booking_enabled) + public_stations/public_vehicles → echte Stationen +
   Autos + Richtpreis. **Pilot-Weiche:** disabled-Station → Beta-Hinweis + tel:-Anruf-Button.
4. Verfügbarkeits-Filter + „telefonisch buchen"-Fallback (nur Kranenburg-Pfad).
5. RPC 4 (mit serverseitiger Pilot-Prüfung) + Kontaktformular + Honeypot + Bestätigungsseite.
6. Dashboard-Liste „Online-Anfragen" + Bestätigen/Ablehnen.
7. (optional) E-Mail-Benachrichtigungen.

## INVARIANTEN (nicht brechen — CLAUDE.md)

- Mandantentrennung strikt: Public-Sicht NUR auf die eine company/Station, nie cross-tenant.
- Kein anon-Schreibzugriff direkt auf Tabellen — alles über SECURITY DEFINER RPC.
- Booking-Konfliktlogik beim Bestätigen respektieren.
- Sensible Felder (Kennzeichen, Kundendaten anderer, Preise-intern) NIE in Public-Views.

## RESTLICHE OFFENE PUNKTE (in Bau-Session entscheiden, klein)

- Genaue Richtpreis-Anzeige: welcher Tarif als „ab"-Preis (24h?).
- Cloudflare Turnstile später: dann Keys + Edge-Verify ergänzen.
- E-Mail-Templates Wording.
