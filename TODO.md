# TODO — NuVio Core

Offene Punkte, geordnet nach **Priorität (Wichtigkeit × Aufwand)**. Konsolidiert am 27.06.2026.
Abgeschlossenes steht in [ERLEDIGT.md](ERLEDIGT.md).

> Legende — Aufwand: 🟢 klein · 🟡 mittel · 🔴 groß · Wichtigkeit: ⭐ niedrig · ⭐⭐ mittel · ⭐⭐⭐ hoch

---

## ⏳ Extern — bei PLT (nicht von uns zu erledigen)

Betrieblich relevant (Live-System), aber Stammdatenpflege beim Kunden:

| Punkt | Aufwand | Wichtigkeit |
|---|---|---|
| **HU-Termine aktualisieren** — ~32 Fahrzeuge laut DB überfällig (Daten = Liste 28.11.2024, viele 2021–2023), 14 ohne HU-Datum. Dashboard-Anzeige „32 überfällig" ist korrekt, kein Bug. | 🟡 | ⭐⭐⭐ |
| **Fiat Punto / KLE-PL-147** — HU-Datum klären (DB 09.2026 vs Liste 9/21). | 🟢 | ⭐⭐ |
| **Fiat Ducato / KLE-PL-547** — HU-Datum klären (DB 12.2026 vs Liste 12/21). | 🟢 | ⭐⭐ |

---

## 🎯 Zielzustand Vertrags-Wizard — PDF-Generierung

Der Vertrags-Wizard (aus Buchung → Kundendaten → Schadensprotokoll → Abschluss) ist in Arbeit.
**Zielzustand:** Aus den Wizard-Daten ein fertiges PLT-Vertrags-PDF erzeugen und **2× drucken**
(1× Kunde, 1× Ordner) — statt nur Bildschirm-Druck.

- 🔴 ⭐⭐ **PDF-Generierung** — braucht eine digitale Vorlage. Optionen, sobald PLT liefert/entscheidet:
  (a) **Blanko-PDF** von PLT (von Druckerei/Designer) → Felder per Koordinaten überlagern (sauberster Weg),
  (b) nur Fotos → Notlösung, Druckqualität leidet,
  (c) **eigenes PDF-Layout** im PLT-Stil von Grund auf (unabhängig vom Papierblock).
  pdf-lib war im alten (gelöschten) Modul schon im Einsatz — wiederbelebbar. DSGVO: Ausweis/FS bleiben
  ephemer, kommen nur ins gedruckte PDF, nicht in die DB.

- 🟡 ⭐⭐⭐ **Stationsübergreifend fortlaufende Vertragsnummer** — jede Vertrags-Nr. genau einmal,
  lückenlos fortlaufend ÜBER ALLE STATIONEN hinweg (Kranenburg 0001, Kalkar 0002, Weeze 0003,
  Kranenburg 0004 …). Gespeichert mit **Stationsname + Nummer**.
  - **Wichtig — anders als heute:** Aktuell `unique(company_id, contract_number)` + `next_contract_number()`
    macht `max()+1` → (1) nur PRO COMPANY fortlaufend, nicht stationsübergreifend, und (2) NICHT
    race-condition-sicher (zwei gleichzeitige Anlagen ziehen dieselbe Nummer).
  - **Lösung:** echte Postgres-SEQUENCE (atomar, keine Races) oder Tabelle mit Row-Lock
    (`SELECT … FOR UPDATE`). Nummer + Station beim Ziehen festschreiben.
  - **Zu klären VOR dem Bau:** Reihe pro Mandant (company) oder WIRKLICH global über alle Mandanten?
    "Station" = locations-Eintrag → Nummer mit location_id/-name speichern. Bestehende Migration
    (20260419000011_contracts.sql) anpassen, nicht parallel bauen.

## 1. Quick Wins — hoher Hebel, kleiner Aufwand (zuerst)

_Beide am 30.06.2026 erledigt → siehe [ERLEDIGT.md](ERLEDIGT.md):_
_Dashboard-Buchungszeilen klickbar (öffnen Buchung inkl. Vertragsdaten) · PWA-Icons auf echtes NuVio-Logo._

## 2. Strategisch wichtig — größere Vorhaben

- 🔴 ⭐⭐⭐ **Modul-Freischaltung pro Mandant** → [MODUL_FREISCHALTUNG_PLAN.md](MODUL_FREISCHALTUNG_PLAN.md)
  — Plattform-Owner schaltet Module pro Kunde frei. Kern des SaaS-Geschäftsmodells, Basis für
  Sales/Fleet. Sinnvoll vor oder mit dem Sales-Modul.
- 🔴 ⭐⭐⭐ **Vertragsmodul** → [CONTRACT.md](CONTRACT.md) — Mietvertrag aus Buchung, OCR-Ergänzung,
  PDF. Aktuell deaktiviert, Code vorhanden — reaktivierbar, falls PLT es will.
- 🔴 ⭐⭐ **Sales-Modul (Mini-CRM)** → [SALES_MODUL_PLAN.md](SALES_MODUL_PLAN.md) — Leads, Partner,
  Follow-ups, Deals, Provisionen. In frischer Session bauen.
- 🔴 ⭐⭐ **Permission Overrides** — Admin vergibt in Company-Einstellungen Extra-Rechte (Phase 1
  Rollen-Override, Phase 2 Einzeluser). Konzept in `src/lib/permissions.ts`.

## 3. Nice-to-have — niedrige Priorität

- 🔴 ⭐⭐ **Tablet Card-Layout** — Tabellen auf < 768px schwer lesbar; Priorität BookingDialog,
  ContractDialog, Ressourcen-Tabelle. Mitarbeiter arbeiten am Fahrzeug auf Tablets.
- 🔴 ⭐ **Globale Suche** — seitenübergreifend über Buchungen, Ressourcen, Verträge.
- 🟡 ⭐ **Tests-Ausbau** — mehr Preislogik-Coverage (Mehrtage-Faktor-Edgecases, Mindestmiete aus
  `availableDurations`). 36 Tests grün, Basis steht — kein Druck.
- 🟡 ⭐ **White-Label Design** — Vorlage war leer; bei Bedarf befüllen.

---

## Referenz — weitere Plandokumente (kein To-do, behalten)

- **Dokument-Scan / OCR** → [NVL_DocumentScan_Architecture.md](NVL_DocumentScan_Architecture.md) —
  ephemere Ausweis-/Führerscheinerkennung mit Bestätigungs-Workflow. Liegt brach (Teil des
  Vertragsmoduls).
- **Produkt-/Wachstumsplan** → [PLAN.md](PLAN.md) · **Produktbeschreibung** → [NVL_Core.md](NVL_Core.md).
