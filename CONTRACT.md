# Vertragsmodul — Planungsdokument

## Ziel

Ein digitales Vertragsmodul das aus einer bestehenden Buchung einen Mietvertrag erzeugt,
fehlende Felder per OCR (Führerschein / Personalausweis) ergänzt, und den fertigen
Vertrag als PDF ausgibt — mandantenfähig, datengetrieben, ohne harte Sonderlogik.

---

## Analysiertes Blanko-Formular (PLT Mietvertrag)

### Linke Seite — Mieterdaten

| Feld | Quelle |
|---|---|
| Vertragsnummer (No.) | auto-generiert (laufende Nummer pro Mandant) |
| Wagentyp | Ressource → Name |
| Gruppe | Ressource → metadata.preisgruppe |
| Amtl. Kennzeichen | Ressource → metadata.kennzeichen |
| Mieter (1) Name | Buchung → first_name + last_name |
| Straße | OCR Ausweis / manuell |
| Ort | OCR Ausweis / manuell |
| TEL. | Buchung → phone |
| Beruf | OCR Ausweis / manuell |
| Beschäftigt bei | manuell |
| Pers. Ausweis Nr. | OCR Ausweis |
| Pers. Ausweis ausgestellt am | OCR Ausweis |
| Geb. am | OCR Ausweis |
| Geb. in | OCR Ausweis |
| FS-Klasse | OCR Führerschein |
| FS-Nr. | OCR Führerschein |
| FS ausgestellt in / am | OCR Führerschein |
| Mieter (2) — alle Felder | optional, manuell / zweiter OCR-Scan |

### Rechte Seite — Fahrzeug & Abrechnung

| Feld | Quelle |
|---|---|
| Fahrzeugübergabe Datum | Buchung → starts_at (Datum) |
| Fahrzeugübergabe Uhrzeit | Buchung → starts_at (Uhrzeit) |
| Fahrzeugübergabe IN (Standort) | Ressource → metadata.aktueller_standort |
| Vereinbarte Rückgabe Datum | Buchung → ends_at (Datum) |
| Vereinbarte Rückgabe Uhrzeit | Buchung → ends_at (Uhrzeit) |
| Vereinbarte Rückgabe IN | Buchung → metadata.rückgabe_standort / manuell |
| Verlängert bis | manuell / leer |
| Fahrzeug-Rückgabe Datum/Zeit/IN | beim Abschluss erfasst |
| KM/Anfang | Ressource → metadata.km_stand / manuell |
| KM/Ende | beim Abschluss erfasst |
| KM/Gesamt | berechnet |
| Frei-KM | aus Preislisten-Position (Dauer-Tarif) |
| KM à | aus Preisliste → metadata.km_preis |
| STD. à | aus Preisliste |
| Tage à | berechnet aus Dauer + Preisliste |
| WO./MO. à | aus Preisliste |
| VK-SB-Reduzierung auf 300€ | Checkbox + Betrag, manuell |
| KM-Paket +100 / +300 / +500 / +1000 | Checkbox + Betrag, aus Preisliste |
| Netto Betrag | berechnet |
| Steuer (MwSt.) % | Mandanten-Einstellung |
| Gesamtsumme | berechnet |
| Anzahlung Mietsumme | manuell / aus Buchung |
| Anzahlung Kaution | manuell |
| Restzahlung/Rückvergütung | berechnet |
| Ladebordwand / Fahrtenschreiber / Tank voll | Checkbox, manuell |
| Schäden? JA/NEIN | Checkbox |
| Unterschrift Mieter | digital (Canvas) oder leer für Ausdruck |
| Kreditkartennummer / Gültigkeitsdatum | **nicht gespeichert** (PCI-DSS) — nur letzte 4 Stellen optional als Hinweis |
| Datum | Buchung → starts_at |
| Bemerkung | Buchung → notes |

---

## Datenmodell

### Tabelle: `contracts`

```sql
create table public.contracts (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  booking_id            uuid references public.bookings(id) on delete set null,
  resource_id           uuid references public.resources(id) on delete set null,

  -- Vertragsnummer (pro Mandant laufend)
  contract_number       integer not null,

  -- Mieterdaten (Mieter 1)
  first_name            text not null,
  last_name             text not null,
  phone                 text,
  street                text,
  city                  text,
  profession            text,
  employer              text,
  id_number             text,         -- Personalausweis Nr.
  id_issued_at          text,         -- ausgestellt am
  date_of_birth         date,
  place_of_birth        text,
  license_class         text,         -- FS-Klasse
  license_number        text,         -- FS-Nr.
  license_issued_in     text,
  license_issued_at     date,

  -- Mieter 2 (optional)
  second_renter         jsonb,        -- gleiche Felder als JSON

  -- Fahrzeug & Zeiten
  handover_at           timestamptz,  -- Übergabe
  handover_location     text,
  return_agreed_at      timestamptz,  -- vereinbarte Rückgabe
  return_actual_at      timestamptz,  -- tatsächliche Rückgabe
  return_location       text,
  extended_until        timestamptz,

  -- KM
  km_start              integer,
  km_end                integer,
  km_free               integer,      -- Freikm aus Tarif

  -- Preise (Snapshot)
  price_per_km          numeric(10,4),
  price_per_day         numeric(10,4),
  price_base            numeric(10,4),
  tax_rate              numeric(5,2),  -- z.B. 19.00

  -- Zusatzoptionen
  extras                jsonb not null default '{}',
  -- z.B. { "vk_sb_reduction": true, "vk_sb_amount": 25,
  --        "km_package_300": true, "km_package_300_amount": 40 }

  -- Checkboxen
  loading_gate          boolean,      -- Ladebordwand
  tachograph            boolean,      -- Fahrtenschreiber
  tank_full             boolean,
  damage                boolean,
  damage_notes          text,

  -- Zahlungen
  advance_rent          numeric(10,2),
  advance_deposit       numeric(10,2),

  -- Sonstiges
  -- KEIN credit_card_number / credit_card_expiry — PCI-DSS Verstoß (nie PAN speichern)
  -- Höchstens: last4 (letzte 4 Stellen) als Hinweis, kein Pflichtfeld
  credit_card_last4     char(4),      -- optional, nur letzte 4 Stellen, kein PAN
  notes                 text,

  -- OCR Consent Log (kein Bildinhalt — nur Nachweis)
  ocr_consent_log       jsonb,        -- { version, timestamp, staff_id, company_id, image_hash? }

  -- Rückgabe
  tank_return_full      boolean,
  payment_status        text default 'open' check (payment_status in ('open', 'partial', 'paid')),
  payment_method        text,         -- 'cash' | 'card'
  returned_by           uuid references public.profiles(id) on delete set null,

  -- PDF
  pdf_url               text,         -- Supabase Storage Pfad nach Generierung

  -- Sonderabrechnung (nur Admin/Owner)
  price_override        numeric(10,2),   -- NULL = Systempreis, Wert = Sonderpreis
  price_override_reason text,            -- Pflichtfeld wenn override gesetzt
  price_override_by     uuid references public.profiles(id) on delete set null,
  price_override_at     timestamptz,

  -- Status
  status                text not null default 'draft'
                          check (status in ('draft', 'active', 'completed', 'cancelled')),

  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
```

### Sequenz für Vertragsnummer (pro Mandant)

```sql
-- Laufende Vertragsnummer pro company_id via DB-Funktion
create sequence public.contract_number_seq;

-- Alternativ: MAX(contract_number) + 1 WHERE company_id = X
-- (einfacher, kein Schema-Konflikt bei Multi-Tenant)
```

---

## Datenbankfelder → Formular-Mapping

```
contracts.contract_number        → No. (oben links)
contracts.first_name/last_name   → MIETER (1)
contracts.phone                  → TEL.
contracts.street                 → STRASSE
contracts.city                   → ORT
contracts.profession             → BERUF
contracts.employer               → BESCHÄFTIGT BEI
contracts.id_number              → PERS. AUSW. NO.
contracts.id_issued_at           → IN / AM
contracts.date_of_birth          → GEB. AM
contracts.place_of_birth         → GEB. IN
contracts.license_class          → FS-KLASSE
contracts.license_number         → NO.
contracts.license_issued_in      → IN
contracts.license_issued_at      → AM
contracts.handover_at            → FAHRZEUGÜBERGABE DATUM + ZEIT
contracts.handover_location      → FAHRZEUGÜBERGABE IN
contracts.return_agreed_at       → VEREINBARTE RÜCKGABE DATUM + ZEIT
contracts.return_location        → VEREINBARTE RÜCKGABE IN
contracts.return_actual_at       → FAHRZEUG-RÜCKGABE DATUM + ZEIT
contracts.km_start               → KM/ANFANG
contracts.km_end                 → KM/ENDE
km_end - km_start                → KM/INSGESAMT
contracts.km_free                → FREI-KM
contracts.price_per_km           → KM à
contracts.price_per_day          → TAGE à
contracts.extras.vk_sb_*         → VK-SB-Reduzierung Checkbox + Betrag
contracts.extras.km_package_*    → KM-Paket Checkboxen + Beträge
(price_base * tax_rate/100)      → STEUER
contracts.advance_rent           → ANZAHLUNG (Mietsumme)
contracts.advance_deposit        → ANZAHLUNG (Kaution)
contracts.credit_card_last4      → KREDITKARTEN No. (nur letzte 4 Stellen, kein PAN)
-- Gültigkeitsdatum: wird nicht gespeichert (PCI-Risiko)
contracts.notes                  → BEMERKUNG
contracts.loading_gate           → LADEBORDWAND Checkbox
contracts.tachograph             → FAHRTENSCHREIBER Checkbox
contracts.tank_full              → TANK VOLL Checkbox
contracts.damage                 → SCHÄDEN? JA/NEIN
```

---

## OCR-Workflow

### Unterstützte Dokumente
1. **Personalausweis** (Vorder- + Rückseite)
2. **Führerschein** (Vorder- + Rückseite)

### Extrahierte Felder pro Dokument

**Personalausweis:**
- Nachname, Vorname
- Geburtsdatum, Geburtsort
- Ausweisnummer
- Ausstellungsdatum
- Adresse (Straße, Ort)

**Führerschein:**
- FS-Klasse(n)
- FS-Nummer
- Ausstellungsort, -datum
- Nachname, Vorname (zur Validierung)

---

## Technischer OCR-Flow (final, produktionsreif)

### Ablauf Schritt für Schritt

```
1. Personal öffnet "Vertrag anlegen"
2. Personal startet "Dokument scannen"
3. Fotos aufnehmen:
   - Personalausweis Vorderseite
   - Personalausweis Rückseite
   - Führerschein Vorderseite
   - Führerschein Rückseite
4. Frontend: Dokument-Crop + Resize + WebP-Export (clientseitig, siehe Bildformat-Spec unten)
5. Frontend sendet alle Bilder in EINEM Request an Backend-Route /api/document-scan
6. Backend ruft OpenAI Vision auf (Modell: gpt-4o-mini)
   - Prompt + JSON-Schema + alle Bilder in einem Call
7. Backend erhält strukturiertes JSON
8. Frontend zeigt Confirm Modal mit erkannten Feldern (editierbar, gelb markiert)
9. Personal prüft, korrigiert, bestätigt
10. System übernimmt Felder in das Vertragsformular
11. System speichert Vertrag + Consent Log in DB
12. System löscht temporäre Bilder sofort (ephemer — nie dauerhaft gespeichert)
```

### Bildformat-Spezifikation (Frontend-Crop)

Basis: Dokumentkarte 85,6 × 54 mm — Sweetspot bei 350–400 dpi.

| Parameter | Wert |
|---|---|
| Format | WebP lossy |
| Farbraum | sRGB |
| Qualität | 80–85 |
| Zieldateigröße | 150–400 KB pro Bild |
| Empfohlene Auflösung (Landscape) | **1280 × 800 px** |
| Alternativ (16:9-Crop) | 1280 × 720 px (800 px Höhe stabiler für kleine Schrift) |
| Minimum | 1100 × 700 px |
| Maximum | 1600 × 1000 px |
| Seitenverhältnis | immer beibehalten |
| Rand um Dokument | 3–5 % (Crop nicht randlos) |

**Begründung:** Unter 1100 px Breite verliert OpenAI Vision Erkennungsqualität bei kleinen Feldern (FS-Nummer, Ausweisnummer). Über 1600 px keine relevante Verbesserung, aber höhere API-Kosten.

---

### Was in der DB gespeichert wird

**Gespeichert:**
- Vertragsfelder: Name, Adresse, Geburtsdatum, Dokumentnummern, FS-Klassen
- Consent Log: Version, Timestamp, Mitarbeiter-ID, Tenant-ID (company_id)
- Optional: Bildhash (SHA-256) als Nachweis ohne Bildinhalt

**Niemals gespeichert:**
- Dokumentbilder (weder temporär in DB noch in Storage)
- vollständiger OCR-Rohtext
- Debug-Logs mit Dokumentdaten

---

## Rechtliche Anforderungen (DSGVO + PAuswG)

### PAuswG — Pflichtblock für Personalausweis-Kopie

Nach § 20 PAuswG gilt bei jeder Ablichtung eines Personalausweises:
- Zustimmung des Ausweisinhabers ist erforderlich
- Ablichtung muss eindeutig als Kopie erkennbar sein
- Weitergabe an Dritte ist eingeschränkt
- DSGVO gilt zusätzlich weiter

**Konsequenz im UI:**
- Pflicht-Checkbox: *"Ich stimme der Ablichtung/Kopie zur Identitätsprüfung im Rahmen des Mietvertrags zu."*
- Kurzer Datenschutzhinweis direkt am Scan-Schritt sichtbar
- Hinweis: *"Die Bilder werden nur zur Datenübernahme genutzt und danach sofort gelöscht."*

### DSGVO — Pflichtblock

Rechtsgrundlage: Art. 6 Abs. 1 b DSGVO (Vertragsanbahnung/-erfüllung)

Prinzipien einhalten:
- **Zweckbindung:** Scan nur zur Vertragserstellung, keine andere Nutzung
- **Datenminimierung:** nur notwendige Felder extrahieren, kein Rohbild speichern
- **Speicherbegrenzung:** Bilder ephemer (sofort nach Extraktion gelöscht)
- **Sicherheit:** TLS-Transport, Rollenrechte, Audit-Log ohne Bildinhalt (Art. 32)

Auftragsverarbeitung:
- **DPA (Data Processing Addendum)** mit OpenAI abschließen (Art. 28 DSGVO)
- API-Projekt auf **EU-Region** konfigurieren (Zero Data Retention, in-region Processing)
- Zero Data Retention aktivieren: keine API-Logs mit Bildinhalten
- Kein Training-Opt-in
- Kein State persistieren über API hinaus

### DSFA (Datenschutz-Folgenabschätzung)

Bei amtlichen Dokumenten + KI-Verarbeitung ist eine DSFA nach Art. 35 DSGVO in der Praxis
sehr oft Pflicht oder dringend ratsam — besonders bei SaaS mit mehreren Mandanten.

Pflicht-Bestandteile:
- Zweck und Notwendigkeit der Verarbeitung
- Beschreibung der verarbeiteten Daten
- Risikobewertung (Dokumentbilder = hochsensibel)
- Maßnahmen zur Risikominimierung
- Löschkonzept

Zusätzlich erforderlich:
- **Verzeichnis der Verarbeitungstätigkeiten (RoPA)**
- **Incident-Prozess** für Datenpannen (72h-Meldepflicht an Aufsichtsbehörde)

---

## UI-Pflichtbausteine im Scan-Schritt

```
[ Schritt: Dokumente scannen ]

ℹ️  Datenschutzhinweis:
    Die aufgenommenen Bilder werden ausschließlich zur automatischen
    Übernahme der Vertragsdaten verwendet. Sie werden nach der
    Bestätigung sofort und unwiderruflich gelöscht.
    Rechtsgrundlage: Art. 6 Abs. 1 b DSGVO (Vertragserfüllung).

☐  Ich stimme der Ablichtung des Personalausweises zur
    Identitätsprüfung im Rahmen dieses Mietvertrags zu. (§ 20 PAuswG)

[ Scan starten ]  ← erst aktiv nach Checkbox
```

---

## Sicherheitsmaßnahmen (technisch)

| Maßnahme | Umsetzung |
|---|---|
| Transport | TLS (HTTPS only) |
| Upload-Limit | max. 2 MB je Bild nach WebP-Crop |
| Bildspeicherung | ephemer — nur im RAM/kurzlebigem Temp-Store, nie in DB oder Storage |
| Sofortlöschung | nach OpenAI-Response: Temp-Dateien sofort löschen |
| Keine Bilder in Logs | Server-Logs dürfen keine Bildpixel enthalten |
| Mandantentrennung | company_id überall, RLS-gesichert |
| Rollenzugriff | nur editor, admin, owner dürfen scannen |
| Audit-Log | ohne Bildinhalt: Hash, Timestamp, Mitarbeiter-ID, Tenant-ID, Consent-Version |
| Kein Bild-Download | normale Nutzer können Rohbilder nicht herunterladen |

---

## Risiken und Entschärfung

| Risiko | Entschärfung |
|---|---|
| Bilder länger gespeichert als nötig | ephemere Verarbeitung als Pflicht, kein Storage-Bucket für Dokumente |
| Consumer-API statt DPA | OpenAI API Business + DPA + EU-Region |
| Biometrie (Face Match/Selfie) | bewusst nicht implementiert — wäre Art. 9 DSGVO (besondere Kategorien) |
| Drittland-Transfer | EU-Region-Projekt bei OpenAI konfigurieren |
| Datenpanne | Incident-Prozess dokumentieren, 72h-Meldepflicht vorbereiten |

---

## OCR-Technologie (final)

**Gewählt: OpenAI Vision API (gpt-4o-mini)**
- Sehr hohe Genauigkeit für amtliche Dokumente (Ausweis + Führerschein)
- Strukturierter JSON-Output per Function Calling / Schema
- DPA verfügbar, EU-Region verfügbar
- Alle 4 Bilder in einem API-Call → minimale Latenz

**Verworfen:**
- Tesseract.js: zu unzuverlässig bei Führerschein-Hintergrundmuster (~30-65%)
- mrz-Library: nur für MRZ-Zeile, nicht für Führerschein geeignet

### Phase 1 (produktionsreif): OpenAI Vision API

**Zuverlässigkeit mit OpenAI Vision (gpt-4o-mini):**

| Dokument | Methode | Zuverlässigkeit |
|---|---|---|
| Personalausweis Vorderseite | OpenAI Vision | ~95% |
| Personalausweis Rückseite | OpenAI Vision | ~95% |
| Führerschein Vorderseite | OpenAI Vision | ~90-95% |
| Führerschein Rückseite | OpenAI Vision | ~90-95% |

Alle 4 Bilder in einem einzigen API-Call → strukturiertes JSON zurück.
OCR-Ergebnisse werden **gelb markiert** → Mitarbeiter bestätigt Pflicht vor Speichern.
Kein automatisches Speichern ohne manuelle Bestätigung.

**Kostenrechnung gpt-4o-mini (Stand 2026):**
```
Pro Scan-Vorgang (4 Bilder in einem Call):
  Bilder:  ~4 × ~1.000 Tokens  → ~$0.002
  Prompt:  ~300 Tokens         → ~$0.0001
  Output:  ~200 Tokens         → ~$0.0003
  ─────────────────────────────────────────
  Gesamt:  ~$0.002–0.003 pro Kunde  (ca. 0,20–0,28 Cent)

Hochrechnung:
  10 Verträge/Tag  →  ~$0.60–0.90/Monat
  30 Verträge/Tag  →  ~$1.80–2.70/Monat
  100 Verträge/Tag →  ~$6.00–9.00/Monat
```
→ Wirtschaftlich irrelevant bei normaler Mandantengröße.

**OpenAI Setup für DSGVO-Konformität:**
- API Business Account mit **Data Processing Addendum (DPA)** (Art. 28 DSGVO)
- Projekt auf **EU-Region** konfigurieren → in-region Verarbeitung + Zero Data Retention
- Zero Data Retention: keine Logs mit Bildinhalten
- Kein Training-Opt-in
- Kein State über API hinaus persistieren

### Phase 2 (optional): Feature-Flag `ocr_provider`
- `company.settings.ocr_provider` → `'openai'` | `'claude'`
- Nur `OcrUploader`-Komponente austauschen — Rest der Architektur bleibt identisch

---

## Frontend-Architektur

### Einstiegspunkt: Buchungsdetail-Ansicht

In der Buchungsansicht (Kalender → Buchung anklicken) erscheint ein Button:
**"Vertrag anlegen"** (sichtbar für editor, admin, owner)

Klick → öffnet ContractDialog (oder eigene Route `/contracts/:id`)

### Komponenten

```
src/features/contracts/
  types/index.ts                  — Contract, ContractInsert, ContractUpdate
  service/contractService.ts      — CRUD + PDF-Generierung
  hooks/useContracts.ts           — TanStack Query Hooks
  components/
    ContractDialog.tsx            — Formular (mehrstufig)
    ContractFormStep1.tsx         — Mieterdaten (aus Buchung vorausgefüllt)
    ContractFormStep2.tsx         — Fahrzeug, Zeiten, KM
    ContractFormStep3.tsx         — Preise, Extras, Checkboxen
    ContractFormStep4.tsx         — Prüfen & Abschließen
    OcrUploader.tsx               — Datei-Upload + OCR-Trigger
    OcrConfirmDialog.tsx          — OCR-Ergebnis bestätigen
    ContractPdfPreview.tsx        — Vorschau des fertigen Vertrags
src/pages/ContractsPage.tsx       — Liste aller Verträge (admin-seitig)
```

### PDF-Generierung

**Ansatz: Blanko-PDF als Vorlage + pdf-lib zum Beschreiben**

Das Original-Blanko-PDF (PLT Mietvertrag) wird als Template genutzt.
`pdf-lib` schreibt die Vertragsdaten an die exakten Koordinaten im PDF.
Kein Nachbau des Layouts nötig — das Original bleibt 1:1 erhalten.

**Bibliothek: `pdf-lib` (kostenlos, Open Source)**
```
npm install pdf-lib
```

**Funktionsweise:**
1. Blanko-PDF liegt in `public/templates/mietvertrag_blank.pdf`
2. Beim Abschluss: PDF laden → Felder einschreiben → Unterschrift einbetten → speichern
3. Dateiname: `{contract_number}.{last_name}.{first_name}.{timestamp}.pdf`
   z.B. `5574.Schurer.Axel.20260423-0814.pdf`
4. PDF wird in Supabase Storage gespeichert (`contracts`-Bucket)
5. Download-Link im Vertragsdatensatz gespeichert (`contracts.pdf_url`)

**Koordinaten-Mapping:**
- Jedes Formularfeld bekommt x/y-Koordinaten im PDF (einmalig vermessen)
- Koordinaten werden als Konstante im Code gespeichert
- Mandanten mit gleichem Formular nutzen dasselbe Mapping
- Mandanten mit eigenem Formular können eigene Koordinaten hinterlegen

**Unterschrift:**
- Tablet-fähiges Signature-Pad (`signature_pad` npm, kostenlos)
- Kunde unterschreibt direkt auf Tablet/Touchscreen
- Unterschrift wird als PNG exportiert
- `pdf-lib` bettet PNG an die Unterschrifts-Koordinaten im PDF ein

**Datei-Benennung:**
```
{vertragsnummer}.{nachname}.{vorname}.{YYYYMMDD-HHmm}.pdf
Beispiel: 5574.Schurer.Axel.20260423-0814.pdf
```

**Speicherung:**
- Supabase Storage Bucket `contracts` (per RLS auf company_id geschützt)
- `contracts.pdf_url` speichert den Storage-Pfad
- Download direkt aus der Vertragsansicht

**Optionen:**

| Bibliothek | Ansatz | Kosten |
|---|---|---|
| **pdf-lib** ✓ | bestehendes PDF beschreiben, Unterschrift einbetten | kostenlos |
| @react-pdf/renderer | JSX → neues PDF, Layout selbst bauen | kostenlos |
| jsPDF | Canvas-basiert | kostenlos |

**Empfehlung: pdf-lib** — Original-Layout bleibt erhalten, kein Nachbau nötig.

### Mehrstufiges Formular (Wizard)

```
Schritt 1: Mieterdaten
  [aus Buchung vorausgefüllt: Name, Tel]
  [OCR-Button für Ausweis → Felder ergänzen]
  [OCR-Button für Führerschein → Felder ergänzen]
  [Mieter 2 optional hinzufügen]

Schritt 2: Fahrzeug & Zeiten
  [aus Buchung: Fahrzeug, Übergabe, Rückgabe, Standort]
  [KM-Anfang eingeben]

Schritt 3: Preise & Extras
  [aus Preisliste vorausgefüllt]
  [Checkboxen: VK-SB, KM-Pakete, Ladebordwand, etc.]
  [MwSt.-Satz aus Mandanten-Einstellung]
  [Anzahlung, Kaution]

Schritt 4: Prüfen & Abschließen
  [Vorschau aller Daten]
  [PDF-Vorschau]
  [Speichern als "active"]
  [PDF herunterladen / drucken]
```

---

## RLS & Berechtigungen

```sql
-- Lesen: alle Mitglieder des Mandanten
create policy "members can read contracts"
  on public.contracts for select
  using (get_my_role(company_id) is not null);

-- Anlegen: editor, admin, owner
create policy "editors can insert contracts"
  on public.contracts for insert
  with check (get_my_role(company_id) in ('owner', 'admin', 'editor'));

-- Bearbeiten: editor, admin, owner
create policy "editors can update contracts"
  on public.contracts for update
  using (get_my_role(company_id) in ('owner', 'admin', 'editor'));

-- Löschen: nur admin, owner
create policy "admins can delete contracts"
  on public.contracts for delete
  using (get_my_role(company_id) in ('owner', 'admin'));
```

---

## Navigation

```
Nav-Eintrag "Verträge" unter Betrieb
  → sichtbar für: alle Rollen (viewer nur lesen)
  → Route: /contracts
```

---

## Umsetzungsreihenfolge (Schritte)

### Schritt 1 — Migration
- Tabelle `contracts` anlegen
- Vertragsnummer-Logik (MAX + 1 pro company_id)
- RLS-Policies

### Schritt 2 — Types, Service, Hooks
- `Contract`, `ContractInsert`, `ContractUpdate` Types
- `contractService` mit CRUD
- `useContracts`, `useCreateContract`, `useUpdateContract`

### Schritt 3 — ContractDialog (Formular, 4 Schritte)
- Schritt 1: Mieterdaten aus Buchung vorausgefüllt
- Schritt 2: Fahrzeug & Zeiten
- Schritt 3: Preise & Extras
- Schritt 4: Prüfen & Speichern

### Schritt 4 — OCR-Integration (OpenAI Vision API)
- Backend-Route `/api/document-scan` (Vercel Function oder Supabase Edge Function)
- `OcrUploader` Komponente — Foto aufnehmen → Crop → WebP-Export (1280×800, 80–85% Qualität) → Upload
- Alle 4 Bilder in einem Request → OpenAI Vision (gpt-4o-mini) → strukturiertes JSON
- `OcrConfirmDialog` — Felder anzeigen (gelb markiert), Mitarbeiter korrigiert + bestätigt
- Bilder sofort nach API-Response löschen (ephemer)
- Consent Log in DB speichern (Timestamp, Mitarbeiter-ID, company_id, Consent-Version)
- PAuswG-Checkbox + Datenschutzhinweis vor Scan-Start (Pflicht)
- `company.settings.ocr_provider` als Feature-Flag für spätere Anbieter-Umschaltung

### Schritt 5 — PDF-Generierung + Unterschrift
- `pdf-lib` + `signature_pad` installieren (beide kostenlos)
- Blanko-PDF nach `public/templates/mietvertrag_blank.pdf` legen
- Koordinaten aller Felder im PDF einmalig vermessen → Konstanten-Datei
- `pdf-lib` schreibt Vertragsdaten an Koordinaten ins PDF
- `SignaturePad`-Komponente für Tablet-Unterschrift (touch-optimiert)
- Unterschrift als PNG in PDF einbetten
- Fertiges PDF: `{nr}.{name}.{vorname}.{timestamp}.pdf`
- Upload nach Supabase Storage Bucket `contracts`
- `contracts.pdf_url` speichert den Pfad, Download aus Vertragsansicht

### Schritt 6 — ContractsPage
- Liste aller Verträge mit Status, Vertragsnummer, Mieter, Fahrzeug
- Filter nach Status (draft / active / completed / cancelled)
- Nav-Eintrag

### Schritt 7 — "Vertrag anlegen"-Button in BookingDialog
- Sichtbar für editor, admin, owner
- Übergibt Buchungsdaten an ContractDialog

---

## Getroffene Entscheidungen (final)

| Thema | Entscheidung |
|---|---|
| OCR-Dienst | **OpenAI Vision gpt-4o-mini** — EU-Region, DPA, ~95% Genauigkeit |
| Bildformat | **WebP lossy, 80–85%, 1280×800 px**, 150–400 KB/Bild |
| PDF-Lib | **pdf-lib** — Original-Blanko-PDF beschreiben, Koordinaten-Mapping |
| PDF-Vorlage | Original-Blanko-PDF in `public/templates/mietvertrag_blank.pdf` |
| Vertragsnummer | MAX+1 pro company_id + UNIQUE-Constraint + Retry |
| Signatur | **signature_pad** — Tablet-Unterschrift, als PNG in PDF eingebettet |
| Mieter 2 | Optional (per Toggle) |
| Bildspeicherung | **Ephemer** — nie in DB oder Storage, sofort nach API-Response gelöscht |
| Consent Log | In DB: Timestamp, Mitarbeiter-ID, company_id, Consent-Version |

---

## Abhängigkeiten zu bestehenden Modulen

| Modul | Verwendung |
|---|---|
| `bookings` | Buchungsdaten als Ausgangspunkt |
| `resources` | Fahrzeugdaten (Kennzeichen, Gruppe, KM-Stand) |
| `pricing` | Preislisten-Positionen, Tarife, KM-Preise |
| `workspace` | company_id, Mandanten-MwSt.-Einstellung |
| `auth` | created_by (Vertrag angelegt von) |

---

## Mandantenfähigkeit

- Alle Verträge filtern nach `company_id`
- MwSt.-Satz als Mandanten-Einstellung (`company.settings.tax_rate`)
- Firmenname + Logo aus `companies`-Tabelle im PDF-Header
- Vertragsnummer-Prefix optional konfigurierbar (`company.settings.contract_number_prefix`)
- Formularfelder (Checkboxen, Extras) erweiterbar über `extras`-JSONB

---

## Sonderabrechnung

### Konzept
Mitarbeiter schließt Vertrag normal ab — Systempreis wird automatisch berechnet.
Admin/Owner kann danach (oder beim Abschluss) eine Sonderabrechnung setzen.

### Flow
1. Vertrag ist ausgefüllt (Schritt 4 — Prüfen & Abschließen)
2. Neben "Abschließen" erscheint für Admin/Owner ein Button **"Sonderabrechnung"**
3. Klick öffnet kleinen Dialog:
   - Betrag (Pflicht)
   - Grund (Pflicht, z.B. "Kulanz", "Stammkunde", "Schaden bereits vorhanden")
4. Nach Bestätigung: `price_override`, `price_override_reason`, `price_override_by`, `price_override_at` werden gesetzt
5. Im PDF: Sonderpreis wird angezeigt, Systempreis durchgestrichen + Grund als Vermerk
6. In der Vertragsliste: Badge "Sonderpreis" sichtbar

### Berechtigungen
- Button nur sichtbar für `admin` und `owner`
- RLS: `price_override` darf nur von admin/owner gesetzt werden
- Mitarbeiter sieht Sonderpreis im fertigen Vertrag, kann ihn aber nicht ändern

### Dashboard-Benachrichtigung (Admin)
- Eigener Abschnitt im Admin-Dashboard: **"Sonderabrechnungen"**
- Zeigt alle Verträge mit `price_override IS NOT NULL` der letzten 30 Tage
- Felder: Vertragsnummer, Mieter, Fahrzeug, Systempreis, Sonderpreis, Grund, erstellt von
- Nur sichtbar für Admin/Owner
- KPI-Badge: Anzahl Sonderabrechnungen im aktuellen Monat

---

## Rückgabe-Flow

Eigener Schritt wenn Fahrzeug zurückkommt — vom Mitarbeiter ausgefüllt:
- KM-Ende eingeben → KM-Gesamt wird berechnet → Mehrkilometer-Nachberechnung automatisch
- Tatsächliche Rückgabe Datum + Uhrzeit
- Tankstand bei Rückgabe (Checkbox: voll / nicht voll → Nachberechnung wenn leer)
- Schäden vorhanden? → wenn JA → Weiterleitung zum Schadensbericht
- Restzahlung bestätigen (Betrag + Zahlungsart: Bar / Karte)
- Vertrag wird auf `completed` gesetzt

Felder `tank_return_full`, `payment_status`, `payment_method`, `returned_by` sind im Hauptschema der `contracts`-Tabelle enthalten.

## Verlängerung

Mitarbeiter kann laufenden Vertrag verlängern:
- Button "Verlängern" im aktiven Vertrag
- Neues Rückgabedatum + Uhrzeit wählen
- Preis für Verlängerungszeitraum wird neu berechnet (aus Preisliste)
- `extended_until` wird gesetzt, original `return_agreed_at` bleibt erhalten
- Buchung in `bookings` wird ebenfalls angepasst (`ends_at`)
- Verlängerungshistorie in `extras` JSONB gespeichert

## Schadensdokumentation

Eigenständiges Formular, separat vom Mietvertrag:

**Felder:**
- Vertragsnummer (Referenz)
- Fahrzeug + Kennzeichen
- Datum + Uhrzeit der Feststellung
- Beschreibung des Schadens (Freitext)
- Schadensposition (Dropdown: Karosserie / Innenraum / Reifen / Mechanik / Sonstiges)
- Foto-Upload (bis zu 5 Fotos, Supabase Storage Bucket `damage_reports`)
- Geschätzte Schadenshöhe (optional, nur Admin)
- Unterschrift Mieter (Signature Pad)
- Unterschrift Mitarbeiter

**Datenmodell — eigene Tabelle `damage_reports`:**
```sql
create table public.damage_reports (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id),
  contract_id     uuid references public.contracts(id),
  resource_id     uuid references public.resources(id),
  description     text not null,
  position        text,
  photo_urls      jsonb default '[]',   -- Array von Storage-Pfaden
  estimated_cost  numeric(10,2),        -- nur Admin
  reported_by     uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
```

**PDF-Output:**
- Eigenes PDF "Schadensbericht" — separate Vorlage
- Enthält Fotos, Beschreibung, beide Unterschriften
- Wird in Supabase Storage gespeichert + Referenz in `damage_reports`

## Buchung — Ersteller anzeigen

`bookings.created_by` ist bereits im Datenmodell vorhanden.
In der Buchungsansicht (Kalender + BookingDialog) anzeigen: "Angelegt von: [Name]"
Dazu JOIN auf `profiles` beim Laden der Buchung — einfache Erweiterung in `bookingService.getByMonth`.

## Ausdruck / PDF

Jeder Vertrag und jeder Schadensbericht bekommt einen **"Drucken"** Button:
- Öffnet fertiges PDF in neuem Tab → Browser-Druckdialog
- Kein separates Print-Layout nötig — PDF ist bereits druckfertig
- Auf Tablet: direkt druckbar wenn Drucker im WLAN

## UX — Vertragsflow

**Wizard-Fortschrittsanzeige**
- 4-Schritt-Wizard zeigt oben "Schritt 2 von 4" + visuellen Fortschrittsbalken
- Mitarbeiter weiß jederzeit wo er ist und kann zurücknavigieren

**Auto-Save als Draft**
- Nach jedem abgeschlossenen Schritt wird der Vertrag automatisch als `draft` gespeichert
- Kein Datenverlust wenn Browser schließt oder Tablet einschläft
- "Entwurf fortsetzen" beim nächsten Öffnen

**Pflichtfeld-Zusammenfassung vor Abschluss**
- Schritt 4 zeigt eine Checkliste: was ist ausgefüllt, was fehlt noch
- Verhindert unvollständige Verträge

**Ausdruck**
- Button "Drucken" öffnet fertiges PDF in neuem Tab → Browser-Druckdialog
- Auf Tablet direkt druckbar wenn Drucker im WLAN erreichbar
- Kein separates Print-Layout nötig — PDF ist druckfertig

---

## Offene technische Punkte

**Fahrzeugstatus nach Rückgabe**
- Nach `completed` soll `resources.metadata.standort` automatisch auf den Rückgabe-Standort gesetzt werden
- Sonst stimmt Dashboard (Verfügbar/Vermietet) nicht mehr
- Umsetzung: beim Setzen von `return_actual_at` → `resourceService.update` mit neuem Standort

**Verfügbarkeits-Check bei Verlängerung**
- Beim Verlängern muss geprüft werden ob das Fahrzeug im neuen Zeitraum nicht anderweitig gebucht ist
- Gleiche Logik wie `bookingService.checkAvailability`, mit `excludeBookingId`

**Vertragsnummer-Kollision**
- MAX+1 bei gleichzeitigen Inserts kann Duplikate erzeugen
- Lösung: DB-seitiger `UNIQUE`-Constraint auf `(company_id, contract_number)` + Retry-Logik im Service
- Alternativ: PostgreSQL Sequence per company_id

**Archivierung**
- Abgeschlossene Verträge unterliegen gesetzlicher Aufbewahrungspflicht (DE: 10 Jahre)
- Keine Löschung von `completed`/`cancelled` Verträgen per RLS erlauben
- Archiv-Ansicht in ContractsPage (Filter: älter als 1 Jahr)

## Kaution
Laut Betrieb nicht aktiv genutzt — Felder `advance_deposit` im Datenmodell bleiben als optionale Felder erhalten, werden im UI aber nicht angezeigt.

---

## Retention Policy (Aufbewahrung und Löschung)

### Aufbewahrungsfristen nach Datenart

| Datenart | Frist | Rechtsgrundlage | Nach Frist |
|---|---|---|---|
| Vertragsdaten gesamt (completed) | 10 Jahre | § 147 AO, § 257 HGB | Anonymisierung oder Löschung |
| Vertragsdaten (cancelled / draft > 30 Tage) | 30 Tage nach Status | DSGVO Art. 5 Abs. 1 e | Löschung |
| Consent Log (OCR) | 10 Jahre (mit Vertrag) | Nachweispflicht | Löschung mit Vertrag |
| Dokumentenbilder | 0 Sekunden | ephemer, nie gespeichert | — |
| PDF-Dateien (Supabase Storage) | 10 Jahre | § 147 AO | Löschung nach Frist |
| Buchungsdaten (ohne Vertrag) | 3 Jahre | § 195 BGB (Verjährung) | Löschung |
| Profile / Mitarbeiterdaten | Bis Kündigung + 3 Monate | DSGVO Art. 17 | Löschung auf Anfrage |

### Technische Umsetzung

**Löschbarkeit:**
- `completed`- und `cancelled`-Verträge dürfen per RLS nicht gelöscht werden (Aufbewahrungspflicht)
- Nach Ablauf der 10-Jahres-Frist: `status = 'archived'` + Anonymisierung sensibler Felder
  (Name → "Anon.", Adresse → leer, id_number → leer, license_number → leer)
- PDF bleibt bis Fristablauf erhalten; danach wird es zusammen mit der DB-Anonymisierung/Löschung entfernt

**Wer darf löschen / anonymisieren:**
- Nur `owner` des Tenants darf Anonymisierung manuell auslösen
- NuVio kann auf Anfrage des Tenants löschen (AVV-Pflicht)
- Automatisierte Löschung: geplant als Cron-Job (Supabase pg_cron) — Phase 2

**Sperrung statt Löschung:**
- Während laufender Aufbewahrungsfrist: Datensätze werden gesperrt (`is_locked = true`)
- Gesperrte Verträge: nur lesbar, nicht bearbeitbar, nicht löschbar
- Entsperrung nur durch Owner nach manueller Prüfung

**PDF und Anonymisierung — kein Widerspruch:**

Das PDF enthält personenbezogene Daten und ist selbst ein personenbezogener Datensatz.
Anonymisierung der DB allein reicht nicht — das PDF muss ebenfalls behandelt werden.

| Zeitpunkt | DB-Datensatz | PDF in Storage |
|---|---|---|
| Aktiver Vertrag (0–10 Jahre) | vollständig, gesperrt | vollständig, gesperrt |
| Nach Löschanfrage (DSAR Art. 17) während Aufbewahrungspflicht | Anonymisierung nicht möglich — Hinweis an Tenant | PDF bleibt (Aufbewahrungspflicht überwiegt) |
| Nach Ablauf 10 Jahre | Anonymisierung der sensiblen Felder in DB | **PDF wird aus Storage gelöscht** |
| Nach Ablauf 10 Jahre (alternativ) | Vollständige Löschung des DB-Datensatzes | **PDF wird aus Storage gelöscht** |

Regel: DB-Anonymisierung und PDF-Löschung passieren **gleichzeitig** nach Fristablauf.
Es gibt keinen Zustand "DB anonymisiert, PDF noch vorhanden" — das wäre keine echte Anonymisierung.

**Datenmodell-Ergänzung:**
```sql
is_locked     boolean not null default false,  -- Sperrung während Aufbewahrungsfrist
archived_at   timestamptz,                      -- Zeitpunkt der Anonymisierung + PDF-Löschung
```

---

## Betroffenenanfragen (Art. 15–21 DSGVO)

Mieter (Endkunden des Tenants) haben Rechte gegenüber dem Tenant als Verantwortlichem.
NuVio stellt als Auftragsverarbeiter die technischen Mittel bereit.

### Rechte und technische Umsetzung

| Recht | Art. | Umsetzung im System |
|---|---|---|
| **Auskunft** | 15 | Owner/Admin kann alle Verträge eines Mieters (Name + Geburtsdatum) exportieren als JSON/CSV |
| **Berichtigung** | 16 | Felder in `contracts` editierbar für editor/admin/owner (außer gesperrte Verträge) |
| **Löschung** | 17 | Nur wenn keine Aufbewahrungspflicht — sonst Anonymisierung (siehe Retention Policy) |
| **Einschränkung** | 18 | `is_locked = true` setzt den Vertrag auf read-only |
| **Datenübertragbarkeit** | 20 | Export als JSON (alle Vertragsfelder, kein Bildinhalt) |
| **Widerspruch** | 21 | Verarbeitung auf Basis Art. 6 Abs. 1 b (Vertrag) — Widerspruch greift hier nicht während laufendem Vertrag |

### Prozess im System

```
Mieter stellt Anfrage an Tenant (per E-Mail / Formular)
  ↓
Tenant (Owner/Admin) öffnet ContractsPage
  → Suche nach Mieter (Name + Geburtsdatum)
  → Alle Verträge des Mieters werden angezeigt
  ↓
Auskunft: "Export als JSON" Button → Download
Berichtigung: Felder direkt editierbar (wenn nicht gesperrt)
Löschung: "Anonymisieren" Button (nur Owner, nur nach Prüfung)
  → Prüfung: läuft Aufbewahrungsfrist noch? → wenn ja: Löschung abgelehnt, Hinweis anzeigen
  → wenn nein (Frist abgelaufen): DB-Felder leeren + PDF aus Storage löschen (gleichzeitig)
  → status = 'archived', archived_at = now()
  ↓
Tenant dokumentiert die Anfrage und Bearbeitung (außerhalb des Systems)
```

### Was NuVio bereitstellt (AVV-Pflicht Art. 28 Abs. 3 f)

- Export-Funktion in ContractsPage (JSON, alle Vertragsfelder eines Mieters)
- Anonymisierungs-Funktion (Owner-only)
- Keine automatische Weiterleitung von Anfragen — Tenant bleibt Ansprechpartner

### Was nicht gespeichert ist — und damit auch nicht auskunftspflichtig

- Dokumentenbilder: nie gespeichert → kein Auskunftsgegenstand
- OCR-Rohtext: nie gespeichert → kein Auskunftsgegenstand
- Consent Log: enthält keine Bildinhalte, nur Metadaten des Scan-Vorgangs

## Nicht in Phase 1

- Digitale Signatur (Canvas) — Phase 2
- E-Mail-Versand des Vertrags — Phase 2
- Zahlungsintegration (Stripe etc.) — nicht geplant
- Mehrsprachige Vertragsvorlagen
