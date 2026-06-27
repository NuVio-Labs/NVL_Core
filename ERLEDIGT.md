# Erledigt-Protokoll — NuVio Core

Konsolidiertes Protokoll abgeschlossener Arbeiten. Zusammengeführt am 27.06.2026 aus
`UX.md`, `PREISLISTEN_LUECKEN.md`, `BOOKING.md`. Offene Punkte stehen in [TODO.md](TODO.md).

---

## Preisgruppen & Fahrzeug-Stammdaten (PLT) — abgeschlossen 27.06.2026

- **16 Anhänger** auf gültige `Anhaenger_*`-Gruppen gesetzt (zuletzt: Plane Goch/Uedem → Planegross,
  Kevelaer/Weeze → Planeklein, Pferdeanhänger → Koffer). Kein Fahrzeug mehr auf ungültigem
  `A_Anhaenger` / `A_LKW` / `B_LKW`.
- **5 „LKW"** auf `G_Transporter` (7,5t) bzw. `F_Transporter` (3,5t) umgestellt.
- **Ford Transit Transporter** (`PKW E` → `C_Transporter`) korrigiert.
- **Preisberechnung verifiziert:** alle 49 aktiven Fahrzeuge × (Privat + Gewerbe) = 98 Kombis,
  **0 ohne Preis** (per echter Matching-Logik durchgerechnet). Kein „keine Preisgruppe" mehr.
- **Vollabgleich DB ↔ offizielle PLT-Liste (28.11.2024):** DB stimmt fast vollständig überein.
  Citroen Jumper KLE-PL-977 (`E_PKW`) geprüft = korrekt (echter 9-Sitzer). CD-146/DC-146 sind
  zwei echte Fahrzeuge (9-Sitzer Custom + Transporter), beide korrekt.

## Buchungsmodul

- **Reservierungs-Formular** (Name, Vorname, Tel, Start-Datum/Zeit, Fahrzeug, Dauer-Dropdown
  1h/5h/24h/7d/30d, Info-Box mit errechnetem Preis aus Zeit + Preisgruppe) umgesetzt.
- **Standort-Warnung:** wenn Fahrzeug-Standort ≠ Mitarbeiter-Standort → Hinweis.
- **Mehrtagesbuchungen:** aus dem 24h-Tarif abgeleitete Stufen „2–5 Tage" (Preis × N, Enddatum × N,
  keine neuen DB-Felder).
- **Durchgehende Kalenderbalken** für mehrtägige Buchungen (feste Lane pro Monat).
- **Kunde aus Buchung anlegen** („Als Kunde"-Button übernimmt Kontaktdaten, verknüpft Kunden).
- **Tages-Modal:** Klick auf Tag / „+N weitere" öffnet alle Tagestermine → bearbeiten/neu.
- **Rückgabe-Bestätigung:** überfällige Buchungen quittierbar (wer/wann/wo, Standort-Pflicht),
  Widerruf möglich, Anzeige unter „Heute zurückgenommen".
- **Ersteller in Buchung** sichtbar („Angelegt von: [Name]").

## Dashboard

- **Rollenbasiert:** Admin sieht KPIs + HU-Warnungen + Mitarbeiterübersicht; Mitarbeiter sieht
  eigene Buchungen. Umsatzdaten nur für Admin.
- **Mitarbeiterübersicht:** Name + Rollenbadge, gruppiert nach Standort.
- **HU-Erledigt-Flag:** „HU erneuern" → Inline-Monatsauswahl → schreibt neues Datum in metadata.

## Kalender

- **Farbkodierung:** Blau = aktiv, Orange = endet heute, Rot = überfällig (+ Legende).
- **Tooltip on Hover:** Name, Kennzeichen, Von/Bis, Angelegt von.

## Ressourcen

- **Standort-Quickaction:** Inline-Edit direkt in der Tabellenzeile.
- **Suche/Filter:** Name/Kennzeichen + Standort-Dropdown + Status-Filter + „X von Y".
- **is_active-Toggle:** Ein-Klick-Statuswechsel ohne Edit-Dialog.
- **Kennzeichen-Normalisierung:** einheitlich GROSS + Bindestriche („kle pl 977" → „KLE-PL-977").

## Buchungsseite

- **Suche/Filter:** Name/Kennzeichen + Status-Filter (Aktiv/Endet heute/Überfällig) + Zähler.
- **Listen-Ansicht:** Kalender ↔ Liste-Toggle mit Status-Badge + Ersteller.

## Plattform / Allgemein

- **Onboarding-Redirect-Bug** behoben (`refreshMemberships()` vor `navigate('/')`).
- **ErrorBoundary** (`PageErrorBoundary` in AppShell) — Seitencrash zeigt saubere Meldung.
- **Profil-Seite:** Rollenanzeige + Passwort ändern mit Validierung/Inline-Feedback.
- **EmptyState-Komponente** wiederverwendbar (Customers, Resources, Staff, Pricing).

## Tests & Infrastruktur

- **Vitest aufgesetzt** (`vitest.config.ts`, `test:run`-Script).
- **Preislogik** aus BookingDialog in `src/features/bookings/lib/pricing.ts` extrahiert + getestet
  (Verhalten bewiesen identisch). **36 Tests grün** (Preislogik + Kennzeichen-Normalisierung).
