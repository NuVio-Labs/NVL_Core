# TODO — NuVio Core

Offene Punkte. Konsolidiert am 27.06.2026. Abgeschlossenes steht in [ERLEDIGT.md](ERLEDIGT.md).

---

## Offen bei PLT (Kunde, nicht von uns zu erledigen)

- **Fiat Punto / KLE-PL-147** — HU-Datum klären: DB sagt 09.2026, offizielle Liste 9/21.
- **Fiat Ducato / KLE-PL-547** — HU-Datum klären: DB sagt 12.2026, offizielle Liste 12/21.
- **HU-Termine aktualisieren** — ~32 Fahrzeuge sind laut DB überfällig (HU-Daten = Liste vom
  28.11.2024, viele aus 2021–2023). 14 Fahrzeuge haben gar kein HU-Datum. Reine Stammdatenpflege
  beim Kunden — die Dashboard-Anzeige „32 überfällig" ist korrekt, kein Bug.

## UX / UI — offen

- **Dashboard → Link zum Vertrag** (klein): direkter Vertrags-Link in der Buchungsliste.
- **Tablet Card-Layout** (groß): Tabellen auf < 768px schwer lesbar; Priorität BookingDialog,
  ContractDialog, Ressourcen-Tabelle.
- **Globale Suche** (groß): seitenübergreifend über Buchungen, Ressourcen, Verträge.

## Plattform / Rollen — offen

- **Permission Overrides** (groß, geplant): Admin vergibt in Company-Einstellungen Extra-Rechte
  (Phase 1 Rollen-Override, Phase 2 Einzeluser). Konzept in `src/lib/permissions.ts`.

## Tests — Ausbau (kein Muss)

- Mehr Preislogik-Coverage (Mehrtage-Faktor-Edgecases, Mindestmiete-Ableitung aus
  `availableDurations`). Aktuell 36 Tests grün; Basis steht.

## PWA / Branding — offen

- **PWA-Icons** sind noch Platzhalter „N" in `public/` — echtes Logo einsetzen.
- **White-Label Design** — Vorlage `WHITELABEL_DESIGN_SHEET.md` war leer; bei Bedarf befüllen.

---

## Größere Vorhaben — eigene Plandokumente (behalten, nicht hier ausführlich)

Diese Module sind geplant/spezifiziert, aber noch nicht gebaut. Details in den jeweiligen Dateien:

- **Vertragsmodul** → [CONTRACT.md](CONTRACT.md) — Mietvertrag aus Buchung, OCR-Ergänzung, PDF.
  Aktuell deaktiviert, Code vorhanden.
- **Dokument-Scan / OCR** → [NVL_DocumentScan_Architecture.md](NVL_DocumentScan_Architecture.md) —
  ephemere Ausweis-/Führerscheinerkennung mit Bestätigungs-Workflow. Liegt brach.
- **Sales-Modul (Mini-CRM)** → [SALES_MODUL_PLAN.md](SALES_MODUL_PLAN.md) — Leads, Partner,
  Follow-ups, Deals, Provisionen.
- **Modul-Freischaltung pro Mandant** → [MODUL_FREISCHALTUNG_PLAN.md](MODUL_FREISCHALTUNG_PLAN.md) —
  Plattform-Owner schaltet Module pro Kunde frei (Basis für Sales/Fleet).
- **Produkt-/Wachstumsplan** → [PLAN.md](PLAN.md) · **Produktbeschreibung** → [NVL_Core.md](NVL_Core.md).
