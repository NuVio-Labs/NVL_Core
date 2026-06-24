# UX / UI — Verbesserungen & Offene Punkte

Dieses Dokument sammelt UX- und UI-Verbesserungen die nicht direkt einem Feature-Modul zugehören,
sondern die allgemeine Bedienbarkeit der Plattform betreffen.

---

## Erledigt ✓

| Feature | Stand |
|---|---|
| Onboarding-Redirect-Bug | Behoben — `refreshMemberships()` vor `navigate('/')` |
| Dashboard rollenbasiert | Admin sieht KPIs + HU-Warnungen + Mitarbeiterübersicht; Mitarbeiter sieht eigene Buchungen |
| Mitarbeiterübersicht schärfen | Name + Rollenbadge, gruppiert nach Standort |
| Ersteller in Buchung anzeigen | `BookingWithCreator` JOIN, "Angelegt von: [Name]" im BookingDialog |
| Standort Quickaction Ressourcen | Inline-Edit direkt in Tabellenzeile (Klick → Input + ✓/X) |
| Suche / Filter Ressourcen | Suchfeld (Name/Kennzeichen) + Standort-Dropdown + Status-Filter + "X von Y" |
| ErrorBoundary | `PageErrorBoundary` in AppShell — Seitencrash zeigt saubere Fehlermeldung, App bleibt stabil |
| Buchungskalender Farbkodierung | Blau = aktiv, Orange = endet heute, Rot = überfällig + Legende unter Kalender |
| Tooltip on Hover Kalender | Hover-Popup: Name, Kennzeichen, Von/Bis, Angelegt von |
| HU Erledigt-Flag | "HU erneuern" Button in HU-Warnliste → Inline-Monatsauswahl → speichert neues Datum direkt in metadata |
| Suche / Filter Buchungsseite | Suchfeld (Name/Kennzeichen) + Status-Filter (Aktiv/Endet heute/Überfällig) + Zähler |
| Buchungsliste-Ansicht | Kalender ↔ Liste Toggle — Tabellenansicht aller Buchungen des Monats mit Status-Badge + Ersteller |
| Ressourcen is_active Toggle | Ein-Klick Status-Toggle direkt in der Tabelle ohne Edit-Dialog |
| Profil-Seite erweitert | Rollenanzeige + Passwort ändern mit Validierung und Inline-Feedback |
| EmptyState Komponente | Wiederverwendbare `EmptyState` in `src/components/` — genutzt in Customers, Resources, Staff, Pricing |
| Mehrtagesbuchungen | Aus dem 24h-Tarif abgeleitete Stufen "2–5 Tage" im Dauer-Dropdown — Preis × N und Enddatum × N, keine neuen DB-Felder |
| Durchgehende Kalenderbalken | Mehrtägige Buchungen als ein zusammenhängender Balken mit fester Lane (Zeilen-Zuordnung pro Monat), Platzhalter halten Balken in Spur |
| Kunde aus Buchung anlegen | "Als Kunde"-Button im BookingDialog übernimmt Vor-/Nachname + Telefon direkt als neuen Kunden und verknüpft ihn |
| Tages-Modal Kalender | Klick auf Tag (oder "+N weitere") öffnet Liste aller Tagestermine mit Status, Zeitraum, Kennzeichen → bearbeiten oder neu anlegen |

---

## Buchungskalender

**Farbkodierung**
- Buchungen im Kalender sind aktuell alle gleich grau
- Verbesserung: Farbe nach Fahrzeugkategorie (PKW / Transporter / LKW / Anhänger) oder nach Standort
- Oder: Status-Farbe (aktiv = grün, heute endend = orange, überfällig = rot)

**Tooltip on Hover**
- Beim Hovern über eine Buchung: Popup mit Name, Fahrzeug, Zeitraum, Kennzeichen
- Kein Klick nötig für Basisinfo — schnellere Übersicht bei vielen Buchungen

---

## Dashboard

**HU-Warnungen — "Erledigt markieren"**
- Mitarbeiter sieht dieselbe HU-Warnung bis das Datum in der DB geändert wird
- Problem: HU wurde gemacht aber noch nicht eingetragen → Warnung bleibt
- Verbesserung: "Als erledigt markieren" Button → setzt `hauptuntersuchung` auf neues Datum
  (oder temporäres "Ausblenden bis"-Flag in `company.settings`)

**Buchungen heute — Link zum Vertrag**
- In der Buchungsliste auf dem Dashboard: direkter Link zum zugehörigen Vertrag wenn vorhanden
- Spart Navigation: Dashboard → Buchungen → Vertrag

---

## Allgemein / Mobile

**Tablet-Optimierung**
- Mitarbeiter arbeiten am Fahrzeug auf Tablets — Tabellen sind auf kleinen Screens schlecht lesbar
- Priorität: BookingDialog, ContractDialog, Ressourcen-Tabelle
- Ansatz: Card-Layout statt Tabelle auf kleinen Screens (< 768px)

**Suche global**
- Kein globales Suchfeld vorhanden
- Mittelfristig: Suche über Buchungen (Name, Kennzeichen), Ressourcen, Verträge
- Kurzfristig: Suche pro Seite (Ressourcen ✓, Buchungen offen)

---

## Rollenmodell & Permissions

**Permission Overrides** *(geplant, noch nicht implementiert)*
- Admin soll in den Company-Einstellungen Rollen oder einzelne User mit Extra-Rechten ausstatten können
- Phase 1: Rollen-Override (z.B. editor bekommt Zugriff auf Pricing)
- Phase 2: Einzeluser-Override (membership-spezifisch)
- Technisches Konzept dokumentiert in `src/lib/permissions.ts`

---

## Prioritäten

| Priorität | Feature | Aufwand | Status |
|---|---|---|---|
| Hoch | Buchungskalender Farbkodierung | Mittel | ✓ Erledigt |
| Hoch | Tooltip on Hover Kalender | Klein | ✓ Erledigt |
| Mittel | HU Erledigt-Flag | Klein | ✓ Erledigt |
| Mittel | Dashboard Link zum Vertrag | Klein | Offen |
| Mittel | Permission Overrides (Einstellungen) | Groß | Geplant |
| Niedrig | Tablet Card-Layout | Groß | Offen |
| Niedrig | Globale Suche | Groß | Offen |
| Niedrig | Suche/Filter Buchungsseite | Klein | ✓ Erledigt |
