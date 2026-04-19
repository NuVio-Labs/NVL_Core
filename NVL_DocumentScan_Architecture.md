# NVL Document Scan — Technische Architektur

## Ziel

Ein Ausweis oder Führerschein wird mit einem Tablet fotografiert. Die relevanten Daten werden
automatisch erkannt, vom Mitarbeiter geprüft und erst nach Bestätigung in das Vertragsformular
übernommen. Dokumentbilder werden **nie dauerhaft gespeichert** — sie sind ephemer und werden
sofort nach der Extraktion gelöscht.

Rechtsgrundlage: Art. 6 Abs. 1 b DSGVO (Vertragserfüllung), § 20 PAuswG (Personalausweis-Kopie).

---

## Gesamtarchitektur

```
Tablet (Browser)
  │
  │  Foto aufnehmen → Crop → WebP-Export (clientseitig)
  │
  ▼
Vercel / Supabase Edge Function
  │  /api/document-scan
  │  → OpenAI Vision API (gpt-4o-mini, EU-Region)
  │  → strukturiertes JSON zurück
  │  → Bilder sofort aus Speicher gelöscht
  │
  ▼
Frontend — Confirm Modal
  │  Mitarbeiter prüft + korrigiert + bestätigt
  │
  ▼
Supabase Postgres
  └─ contracts: Vertragsfelder + ocr_consent_log
     (kein Bild, kein Rohtext — nur extrahierte Felder)
```

---

## Schichten und Verantwortlichkeiten

### Frontend (React / Vite, gehostet auf Vercel)
- Kameraansicht auf dem Tablet (Browser-native `getUserMedia`)
- Foto aufnehmen
- Dokument-Crop clientseitig (Canvas API)
- Resize + WebP-Export (clientseitig, Ziel: 1280×800 px, 80–85% Qualität, max 400 KB)
- Alle 4 Bilder in einem Request an `/api/document-scan`
- OCR-Ergebnis im Confirm Modal anzeigen (editierbar, gelb markiert)
- Nach Bestätigung: Felder ins Vertragsformular übernehmen
- PAuswG-Checkbox + Datenschutzhinweis vor Scan-Start erzwingen

### Backend-Route `/api/document-scan`
- Supabase Edge Function oder Vercel Serverless Function
- Empfängt Bilder als `multipart/form-data`
- Validiert: company_id, Rollenberechtigung (editor / admin / owner), Dateigröße
- Ruft OpenAI Vision API auf (ein Call, alle 4 Bilder + Prompt + JSON-Schema)
- Empfängt strukturiertes JSON von OpenAI
- Löscht Bilder sofort aus dem Arbeitsspeicher (kein Schreiben in Storage)
- Gibt JSON-Ergebnis an Frontend zurück
- Keine Bilder in Logs

### OpenAI Vision API
- Modell: **`gpt-4o-mini`** (Stand 2026 — vor Go-Live auf aktuellstes Vision-Modell prüfen)
- Region: **EU** (in-region Verarbeitung + Zero Data Retention)
- Vertragsgrundlage: Data Processing Addendum (DPA, Art. 28 DSGVO)
- Kein Training-Opt-in
- Kein State über den API-Call hinaus
- Ein Call für alle 4 Bilder → strukturiertes JSON nach Schema

### Supabase Postgres
- Speichert ausschließlich extrahierte Vertragsfelder
- Speichert `ocr_consent_log` (Timestamp, Mitarbeiter-ID, company_id, Consent-Version, optional SHA-256-Hash)
- **Kein Storage-Bucket für Dokumentbilder**
- RLS auf `contracts`: company_id-basiert, rollengesichert

---

## Bildformat-Spezifikation (Frontend-Crop)

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

Unter 1100 px Breite verliert OpenAI Vision Erkennungsqualität bei kleinen Feldern
(FS-Nummer, Ausweisnummer). Über 1600 px keine relevante Verbesserung, aber höhere API-Kosten.

---

## Scan-Ablauf (vollständig)

```
1.  Mitarbeiter öffnet Schritt "Dokumente scannen" im Vertragsformular
2.  Datenschutzhinweis wird angezeigt (Art. 6 Abs. 1 b DSGVO)
3.  Mitarbeiter setzt PAuswG-Checkbox (Pflicht, § 20 PAuswG)
    → "Scan starten"-Button wird erst aktiv
4.  Fotos aufnehmen:
      - Personalausweis Vorderseite
      - Personalausweis Rückseite
      - Führerschein Vorderseite
      - Führerschein Rückseite
5.  Frontend: Crop → Resize → WebP-Export (clientseitig, Canvas API)
6.  Frontend sendet alle 4 Bilder in EINEM Request an /api/document-scan
      Header: Authorization (Supabase JWT), company_id, consent_version
7.  Backend validiert Rolle + company_id
8.  Backend ruft OpenAI Vision auf (gpt-4o-mini, EU-Region):
      - System-Prompt mit Feldschema
      - Alle 4 Bilder als base64
      - Structured Output (JSON-Schema)
9.  OpenAI gibt strukturiertes JSON zurück
10. Backend löscht Bilder sofort aus Arbeitsspeicher
11. Backend gibt JSON an Frontend zurück (kein Zwischenspeichern)
12. Frontend zeigt Confirm Modal:
      - erkannte Felder gelb markiert
      - alle Felder editierbar
      - "Bestätigen" erst nach Prüfung möglich
13. Mitarbeiter korrigiert, bestätigt
14. System übernimmt Felder ins Vertragsformular
15. System speichert in DB:
      - Vertragsfelder (contracts-Tabelle)
      - ocr_consent_log: { version, timestamp, staff_id, company_id, image_hash? }
16. Bilder sind zu diesem Zeitpunkt bereits gelöscht — nie in Storage geschrieben
```

---

## Extrahierte Felder pro Dokument

### Personalausweis (Vorder- + Rückseite)
- Nachname, Vorname
- Geburtsdatum, Geburtsort
- Ausweisnummer
- Ausstellungsdatum / Gültig bis
- Adresse (Straße, Hausnummer, PLZ, Ort)

### Führerschein (Vorder- + Rückseite)
- FS-Klasse(n) (Felder 9/10)
- FS-Nummer (Feld 5)
- Ausstellungsbehörde (Feld 4a)
- Ausstellungsdatum (Feld 4b)
- Nachname, Vorname (zur Kreuzvalidierung mit Ausweis)

---

## OpenAI JSON-Schema (Beispiel)

```json
{
  "type": "object",
  "properties": {
    "id_card": {
      "type": "object",
      "properties": {
        "last_name":        { "type": "string" },
        "first_name":       { "type": "string" },
        "date_of_birth":    { "type": "string", "format": "date" },
        "place_of_birth":   { "type": "string" },
        "id_number":        { "type": "string" },
        "id_issued_at":     { "type": "string" },
        "street":           { "type": "string" },
        "city":             { "type": "string" }
      }
    },
    "license": {
      "type": "object",
      "properties": {
        "license_number":    { "type": "string" },
        "license_class":     { "type": "string" },
        "license_issued_in": { "type": "string" },
        "license_issued_at": { "type": "string", "format": "date" }
      }
    }
  }
}
```

---

## Was gespeichert wird — und was nicht

| | Gespeichert | Nicht gespeichert |
|---|---|---|
| Vertragsfelder | ✓ in `contracts` | |
| Consent Log | ✓ in `contracts.ocr_consent_log` | |
| Bildhash (SHA-256) | optional in Consent Log | |
| Dokumentbilder | | ✗ nie — ephemer |
| OCR-Rohtext | | ✗ nie |
| Debug-Logs mit Bildinhalt | | ✗ nie |
| Bilder in Supabase Storage | | ✗ kein Bucket dafür |

---

## UI-Pflichtbausteine

```
┌─────────────────────────────────────────────────────────┐
│  Schritt: Dokumente scannen                             │
│                                                         │
│  ℹ️  Die aufgenommenen Bilder werden ausschließlich     │
│      zur automatischen Übernahme der Vertragsdaten      │
│      verwendet. Sie werden nach der Bestätigung         │
│      sofort und unwiderruflich gelöscht.                │
│      Rechtsgrundlage: Art. 6 Abs. 1 b DSGVO.           │
│                                                         │
│  ☐  Ich stimme der Ablichtung des Personalausweises    │
│     zur Identitätsprüfung im Rahmen dieses             │
│     Mietvertrags zu. (§ 20 PAuswG)                     │
│                                                         │
│  [ Scan starten ]  ← erst aktiv nach Checkbox          │
└─────────────────────────────────────────────────────────┘
```

---

## Sicherheitsmaßnahmen

| Maßnahme | Umsetzung |
|---|---|
| Transport | TLS (HTTPS only) |
| Authentifizierung | Supabase JWT im Header |
| Rollenkontrolle | nur editor / admin / owner dürfen scannen |
| Mandantentrennung | company_id in jedem Request, RLS in DB |
| Upload-Limit | max. 2 MB je Bild nach WebP-Crop |
| Bildspeicherung | ephemer — nur RAM der Edge Function, nie Storage |
| Sofortlöschung | nach OpenAI-Response: Bilder aus Speicher entfernt |
| Keine Bilder in Logs | Backend-Logs dürfen keine Bildpixel enthalten |
| Kein Bild-Download | kein Storage-Bucket, kein Download-Link |
| Audit-Log | Consent Log ohne Bildinhalt: Hash, Timestamp, Staff-ID |
| OpenAI DPA | Data Processing Addendum abgeschlossen (Art. 28) |
| OpenAI EU-Region | in-region Verarbeitung + Zero Data Retention |

---

## Zuverlässigkeit (OpenAI Vision gpt-4o-mini — vor Go-Live Modell prüfen)

| Dokument | Erkennungsqualität |
|---|---|
| Personalausweis Vorderseite | ~95% |
| Personalausweis Rückseite | ~95% |
| Führerschein Vorderseite | ~90–95% |
| Führerschein Rückseite | ~90–95% |

Alle 4 Bilder in einem API-Call → minimale Latenz, ein Abrechnungsvorgang.

---

## Kosten (gpt-4o-mini, Stand 2026)

```
Pro Scan-Vorgang (4 Bilder in einem Call):
  Bilder:  ~4 × ~1.000 Tokens  → ~$0.002
  Prompt:  ~300 Tokens         → ~$0.0001
  Output:  ~200 Tokens         → ~$0.0003
  ─────────────────────────────────────────
  Gesamt:  ~$0.002–0.003 pro Vertrag

Hochrechnung:
  10 Verträge/Tag   →  ~$0.60–0.90/Monat
  30 Verträge/Tag   →  ~$1.80–2.70/Monat
  100 Verträge/Tag  →  ~$6.00–9.00/Monat
```

Wirtschaftlich irrelevant bei normaler Mandantengröße.

---

## Risiken und Entschärfung

| Risiko | Entschärfung |
|---|---|
| Bilder versehentlich gespeichert | kein Storage-Bucket für Dokumente, ephemere Verarbeitung als Architekturpflicht |
| Consumer-API ohne DPA | OpenAI API Business + DPA abschließen (Pflicht vor Go-Live) |
| Drittland-Transfer | EU-Region-Projekt bei OpenAI konfigurieren |
| Biometrie (Face Match) | bewusst nicht implementiert — wäre Art. 9 DSGVO |
| Datenpanne | Incident-Prozess + 72h-Meldepflicht vorbereiten |
| Schlechte Bildqualität | Crop-Vorschau + Neu-Aufnehmen-Option im UI |
| Falsch erkannte Felder | Confirm Modal ist Pflicht — kein Auto-Submit |

---

## Organisatorische Pflichten (nicht im Code)

- **DPA mit OpenAI** abschließen vor erstem produktiven Scan
- **DSFA** (Datenschutz-Folgenabschätzung, Art. 35 DSGVO) erstellen
- **RoPA** (Verzeichnis der Verarbeitungstätigkeiten) führen
- **Incident-Prozess** dokumentieren (72h-Meldepflicht bei Datenpanne)
- **Mitarbeiter-Schulung**: Scan nur für Vertragsabschluss, keine private Nutzung

---

## Go-Live Checkliste — OCR / Dokumentenscan

**Kein produktiver Betrieb bevor alle 4 Punkte vollständig erfüllt und nachgewiesen sind.**

---

### 1. Vertragliche Absicherung

- [ ] **DPA mit OpenAI** abgeschlossen (API Business Account, nicht Consumer)
- [ ] **AVV mit jedem Tenant** abgeschlossen (NuVio → Tenant, inkl. TOMs + Unterauftragsverarbeiterliste)
- [ ] Unterauftragsverarbeiterliste (OpenAI, Vercel, Supabase) im AVV als Anlage vorhanden

**Nachweis:** Unterschriebene DPA-/AVV-Dokumente im NuVio-Vertragsarchiv abgelegt.

---

### 2. OpenAI Projektkonfiguration — EU-Region + Zero Data Retention

- [ ] OpenAI Projekt auf **EU-Region** gestellt (nachweisbar im OpenAI Dashboard)
- [ ] **Zero Data Retention** aktiv für das Projekt (nachweisbar im OpenAI Dashboard)
- [ ] Kein Training-Opt-in gesetzt
- [ ] Kein State-persistierendes Feature aktiv

**Nachweis vor Go-Live: Screenshot des OpenAI Projekt-Dashboards mit sichtbarer Region (EU) und ZDR-Status.**
Wird als Datei abgelegt: `docs/compliance/openai_eu_region_zdr_screenshot_YYYYMMDD.png`

Falls EU-Region/ZDR nicht verfügbar → Fallback-Stufe aus Abschnitt "Fallback" umsetzen und dokumentieren, bevor Go-Live freigegeben wird.

---

### 3. Code-Verifikation — Ephemere Bildverarbeitung

Der Code muss beweisbar sicherstellen, dass Bilder nie dauerhaft gespeichert werden.

- [ ] Backend-Route `/api/document-scan` speichert keine Bilder in Storage
- [ ] Backend-Route schreibt keine Bildpixel in Logs
- [ ] Bilder werden nach OpenAI-Response aus dem Arbeitsspeicher freigegeben
- [ ] Kein Storage-Bucket für Dokumentbilder existiert
- [ ] Upload-Limit (2 MB) serverseitig erzwungen

**Nachweis vor Go-Live:**
- Code-Review der Route durch zweite Person (4-Augen-Prinzip) mit Protokoll
- Testlauf mit Proxy/Netzwerk-Monitor: kein ausgehender Storage-Write nachweisbar
- Screenshot: Supabase Storage — kein `document_scans`- oder `ocr_uploads`-Bucket vorhanden
  Wird abgelegt: `docs/compliance/supabase_no_image_bucket_YYYYMMDD.png`

---

### 4. Compliance-Dokumente existieren als echte Dateien

- [ ] **DSFA** ausgefüllt und abgezeichnet (nicht nur als Hinweis in der MD)
- [ ] **RoPA** geführt, Eintrag für Dokumentenscan vorhanden
- [ ] **Incident-Prozess** als Dokument vorhanden (Ablauf, Verantwortliche, Meldeweg)
- [ ] **Datenschutzerklärung Template** für Tenants vorhanden und befüllt

**Nachweis:** Alle 4 Dokumente liegen im NuVio-Compliance-Ordner vor (intern, nicht im Repo).

---

### Go-Live Freigabe

| Punkt | Verantwortlich | Status | Datum |
|---|---|---|---|
| DPA OpenAI + AVV Tenants | NuVio Geschäftsführung | ☐ offen | — |
| OpenAI EU-Region + ZDR (Screenshot) | Entwicklung | ☐ offen | — |
| Code-Review ephemer + Supabase-Screenshot | Entwicklung (4-Augen) | ☐ offen | — |
| DSFA + RoPA + Incident-Prozess als Dokumente | NuVio / ggf. externer DSB | ☐ offen | — |

**Freigabe durch:** _________________________ **Datum:** _____________

---

## SaaS-Rollenmodell (Datenschutzrechtlich)

In einem Multi-Tenant SaaS gelten klar getrennte datenschutzrechtliche Rollen:

| Partei | Rolle | Bedeutung |
|---|---|---|
| **Tenant** (z.B. PLT Autovermietung) | **Verantwortlicher** (Art. 4 Nr. 7 DSGVO) | Bestimmt Zweck und Mittel der Verarbeitung. Trägt gegenüber dem Endkunden (Mieter) die volle DSGVO-Verantwortung. |
| **NuVio Labs** | **Auftragsverarbeiter** (Art. 4 Nr. 8 DSGVO) | Verarbeitet personenbezogene Daten ausschließlich im Auftrag und nach Weisung des Tenants. |
| **OpenAI** | **Unterauftragsverarbeiter** | Verarbeitet Bilddaten ephemer im Auftrag von NuVio. Absicherung über DPA + EU-Region. |
| **Vercel** | **Unterauftragsverarbeiter** | Hostet Backend-Routes. Absicherung über Vercel DPA (GDPR-konform). |
| **Supabase** | **Unterauftragsverarbeiter** | Speichert Vertragsdaten und Consent Log. Absicherung über Supabase DPA (EU-Region Frankfurt). |

### Konsequenzen für AVV

- NuVio muss mit **jedem Tenant** einen **Auftragsverarbeitungsvertrag (AVV)** nach Art. 28 DSGVO abschließen
- NuVio muss mit **OpenAI, Vercel, Supabase** jeweils einen DPA (als Unterauftragsverarbeiter) abgeschlossen haben
- Der Tenant muss wissen, welche Unterauftragsverarbeiter eingesetzt werden (Transparenzpflicht)
- Wechsel oder Ergänzung von Unterauftragsverarbeitern → Tenant muss informiert werden + Widerspruchsrecht

---

## AVV-Paket NuVio → Tenant (Pflicht vor Go-Live)

NuVio benötigt eine AVV-Vorlage für jeden Tenant. Mindestinhalt nach Art. 28 Abs. 3 DSGVO:

### Pflichtbestandteile AVV

```
1. Gegenstand und Dauer der Verarbeitung
   → Vertragserstellung, Dokumentenscan, Buchungsverwaltung
   → Laufzeit = Vertragslaufzeit mit Tenant

2. Art und Zweck der Verarbeitung
   → Verarbeitung personenbezogener Daten von Mietern
   → Zweck: digitale Mietvertragserstellung, OCR-gestützte Dateneingabe

3. Art der personenbezogenen Daten
   → Name, Adresse, Geburtsdatum, Ausweis-/Führerscheindaten, KM-Daten, Zahlungsdaten

4. Kategorien betroffener Personen
   → Endkunden des Tenants (Mieter)

5. Weisungsgebundenheit
   → NuVio verarbeitet nur nach dokumentierter Weisung des Tenants

6. Technische und organisatorische Maßnahmen (TOMs)
   → Verschlüsselung (TLS, at rest), Zugriffskontrollen, Rollenmodell,
      ephemere Bildverarbeitung, Audit-Log, RLS, Mandantentrennung

7. Unterauftragsverarbeiter-Liste (Anlage zum AVV)
   → OpenAI (EU-Region, ZDR, DPA)
   → Vercel (EU, DPA)
   → Supabase (Frankfurt, DPA)

8. Unterstützung bei Betroffenenanfragen
   → NuVio stellt Tenant technische Mittel bereit (Export, Löschung, Korrektur)

9. Löschung / Rückgabe nach Vertragsende
   → Vertragsdaten werden nach Kündigung X Monate aufbewahrt, dann gelöscht/anonymisiert
   → Tenant kann Export vor Löschung anfordern

10. Nachweispflicht / Audit
    → NuVio stellt Informationen für Compliance-Nachweise bereit
```

### Unterauftragsverarbeiter-Transparenzliste (Anlage)

| Anbieter | Zweck | Region | DPA | ZDR |
|---|---|---|---|---|
| OpenAI | OCR-Extraktion (ephemer) | EU | ✓ | ✓ (konfigurieren) |
| Vercel | Hosting Backend-Routes | EU | ✓ | — |
| Supabase | Datenbank + Auth | Frankfurt (EU) | ✓ | — |

---

## Informationspflichten Art. 13 DSGVO (Template pro Tenant)

Wenn der Mieter beim Vertragsabschluss personenbezogene Daten angibt, greift Art. 13 DSGVO.
Der Tenant ist Verantwortlicher — NuVio stellt ein Template bereit, das der Tenant anpassen muss.

### Pflichtangaben (Art. 13 Abs. 1 + 2 DSGVO)

```
Verantwortlicher:
  [Firmenname Tenant], [Adresse], [E-Mail], [Telefon]

Datenschutzbeauftragter (falls benannt):
  [Name / Kontakt DPO des Tenants]

Zwecke und Rechtsgrundlage:
  Verarbeitung zur Durchführung des Mietvertrags (Art. 6 Abs. 1 b DSGVO).
  Dokumentenscan zur Identitätsprüfung (Art. 6 Abs. 1 b DSGVO + § 20 PAuswG).

Empfänger / Kategorien von Empfängern:
  NuVio Labs (Auftragsverarbeiter, Softwareplattform)
  OpenAI Ireland Ltd. (Unterauftragsverarbeiter, ephemere OCR-Verarbeitung, EU-Region)
  Vercel Inc. (Unterauftragsverarbeiter, Hosting)
  Supabase Inc. (Unterauftragsverarbeiter, Datenspeicherung, Frankfurt)

Speicherdauer:
  Vertragsdaten: gesetzliche Aufbewahrungspflicht (DE: 10 Jahre nach § 147 AO / § 257 HGB).
  Dokumentenbilder: werden nicht gespeichert — sofortige Löschung nach OCR-Extraktion.
  Consent Log: Laufzeit des Vertrags + 10 Jahre.

Rechte der betroffenen Person:
  Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
  Einschränkung (Art. 18), Widerspruch (Art. 21), Datenübertragbarkeit (Art. 20).
  Beschwerderecht bei der zuständigen Aufsichtsbehörde.

Kontakt für Anfragen:
  [E-Mail Tenant für Datenschutzanfragen]
```

### UI-Umsetzung

- Im Scan-Schritt: kurzer Datenschutzhinweis + **Link zur vollständigen Datenschutzerklärung** des Tenants
- Die vollständige Datenschutzerklärung liegt beim Tenant (nicht bei NuVio)
- NuVio stellt das Template — Tenant füllt es aus und veröffentlicht es

---

## PAuswG — Kopie-Kennzeichnungspflicht (technisch)

Nach § 20 Abs. 2 PAuswG muss jede Ablichtung eines Personalausweises eindeutig und dauerhaft
als **Kopie** gekennzeichnet sein.

### Anwendungsfälle und Umsetzung

| Anwendungsfall | Umsetzung |
|---|---|
| Bilder werden ephemer verarbeitet, nie gespeichert | Kennzeichnung nicht anwendbar — kein persistentes Bild vorhanden |
| Confirm Modal zeigt Bildvorschau im Browser | Vorschau erhält sichtbares **"KOPIE"**-Wasserzeichen (Canvas, clientseitig) |
| PDF-Ausdruck des Vertrags enthält Ausweis-Daten (Text, kein Bild) | Keine Bildkopie → keine Kennzeichnungspflicht |
| Zukünftig: Bildspeicherung optional aktiviert | Dann: Wasserzeichen serverseitig einbetten vor Speicherung (Pflicht) |

### Technische Umsetzung Wasserzeichen (Confirm Modal)

```javascript
// Canvas API — Wasserzeichen über Bildvorschau
ctx.font = 'bold 48px sans-serif'
ctx.fillStyle = 'rgba(255, 0, 0, 0.35)'
ctx.rotate(-Math.PI / 6)
ctx.fillText('KOPIE', canvas.width / 4, canvas.height / 2)
```

Regel: Sobald ein Dokumentbild irgendwo angezeigt oder gespeichert wird → Wasserzeichen ist Pflicht.

---

## Fallback: EU-Region / Zero Data Retention nicht verfügbar

Wenn OpenAI EU-Region oder ZDR für ein Projekt nicht konfigurierbar ist:

### Fallback-Stufe 1 — Reduzierte Verarbeitung
- Nur Felder ohne besondere Sensibilität per API senden (kein Vollbild)
- Alternativmodell prüfen: Claude API (Anthropic, EU-freundlichere Datenschutzbedingungen)
- Interne Risikoabwägung dokumentieren

### Fallback-Stufe 2 — Transfer Safeguards
Falls Drittlandtransfer unvermeidbar (US-Server):
- **Standardvertragsklauseln (SCC)** nach Art. 46 Abs. 2 c DSGVO nutzen
- Transfer Impact Assessment (TIA) durchführen und dokumentieren
- Zusätzliche Maßnahmen: Datenverschlüsselung vor Transfer, minimale Datenmenge

### Fallback-Stufe 3 — OCR deaktivieren
- Feature-Flag `company.settings.ocr_provider = 'disabled'`
- Manuelle Eingabe aller Vertragsfelder als Fallback
- Mitarbeiter wird informiert ("Automatische Erkennung nicht verfügbar")

### Dokumentationspflicht
Jeder Fallback-Einsatz muss im RoPA dokumentiert werden.
Kein Produktivbetrieb mit Drittlandtransfer ohne dokumentierte Rechtsgrundlage.

---

## Abgrenzung zu CONTRACT.md

| Dokument | Inhalt |
|---|---|
| **CONTRACT.md** | fachliche Planung — Formularfelder, Wizard-Schritte, Datenmodell, RLS, Sonderabrechnung, Rückgabe-Flow |
| **NVL_DocumentScan_Architecture.md** | technische Architektur — Scan-Flow, Bildformat, API-Schema, Sicherheit, Kosten |

Beide Dokumente ergänzen sich. Bei Widersprüchen gilt CONTRACT.md als fachliche Wahrheit.

---

## Verworfene Alternativen

| Ansatz | Grund für Ablehnung |
|---|---|
| PaddleOCR (Python Service) | dauerhafter Storage + eigener VPS = höheres Datenschutzrisiko, mehr Infrastruktur |
| Tesseract.js (Browser) | zu unzuverlässig bei Führerschein-Hintergrundmuster (~30–65%) |
| mrz-Library | nur MRZ-Zeile, kein Führerschein |
| Bilder dauerhaft archivieren | rechtlich riskant (DSGVO Speicherbegrenzung), nicht notwendig für den Zweck |
