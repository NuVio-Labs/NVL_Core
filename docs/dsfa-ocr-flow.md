# Datenschutz-Folgenabschätzung (DSFA)
## nach Art. 35 DSGVO

**Dokument-ID:** DSFA-NVL-001  
**Version:** 2.0  
**Datum:** 2026-04-20  
**Erstellt von:** Axel Schurer, NuVioLabs  
**Status:** Technisch umgesetzt — zur Prüfung durch Datenschutzberater

---

## 1. Beschreibung der Verarbeitung

### 1.1 Bezeichnung der Verarbeitung
KI-gestützte Dokumentenerfassung zur Vertragsanlage (NuVio Core — PLT-Feature)

### 1.2 Zweck der Verarbeitung
Automatisierte Extraktion von Mieterdaten aus Führerschein (Vorderseite) und Personalausweis (Rückseite) mittels GPT-4o Vision API, um die manuelle Dateneingabe bei Vertragsabschluss zu beschleunigen und Eingabefehler zu reduzieren. Optionales Feature, aktivierbar pro Mandant.

### 1.3 Rechtsgrundlage
- **Art. 6 Abs. 1 lit. b DSGVO** — Verarbeitung zur Erfüllung eines Vertrags (Mietvertrag)
- **Art. 6 Abs. 1 lit. a DSGVO** — explizite Einwilligung vor jedem Scan (Consent-Checkbox im UI)

### 1.4 Verantwortlicher
NuVioLabs  
Axel Schurer  
Nimwegerstraße 3, 47559 Kranenburg  
contact@nuviolabs.de

### 1.5 Auftragsverarbeiter
| Dienstleister | Zweck | Vertrag |
|---|---|---|
| OpenAI Ireland Ltd., Dublin | KI-Texterkennung (GPT-4o Vision API) | DPA unterzeichnet 2026-04-19 |
| Supabase Inc. | Datenbankhosting, Auth, Edge Functions | DPA vorhanden |

### 1.6 Kategorien betroffener Personen
- Mieter (Kunden des Mandanten)
- Ggf. Zweitmieter

### 1.7 Kategorien verarbeiteter Daten

| Datenkategorie | Gespeichert | Ephemer | Anmerkung |
|---|---|---|---|
| Vorname, Nachname | ✅ ja | — | Vertragsfeld, aus FS Feld 1+2 |
| Adresse (Straße, PLZ, Ort) | ✅ ja | — | Vertragsfeld, aus PA-Rückseite |
| Geburtsdatum | ✅ ja | — | Vertragsfeld, aus FS Feld 3 |
| Führerscheinklasse | ✅ ja | — | Vertragsfeld, aus FS Feld 9 |
| Führerschein-Nr. | ✅ ja | — | Vertragsfeld, aus FS Feld 5 |
| Personalausweis-Seriennummer | ❌ nein | — | PAuswG §20 — technisch nicht extrahiert |
| Ausweisbild (Foto) | ❌ nein | ✅ ephemer | Nur Base64 im RAM der Edge Function, sofort nach GPT-Response verworfen |
| OCR-Rohtext | ❌ nein | ✅ ephemer | GPT gibt nur strukturiertes JSON zurück, kein Rohtext gespeichert |
| Consent-Zeitstempel | ⚠️ geplant | — | Noch nicht in ocr_consent_log persistiert — TODO |

### 1.8 Empfänger der Daten
- Mitarbeiter des Mandanten (Editor, Admin, Owner-Rolle)
- OpenAI Ireland Ltd. (Auftragsverarbeiter, temporär für API-Call)
- Keine Weitergabe an weitere Dritte

### 1.9 Übermittlung in Drittländer
OpenAI verarbeitet über OpenAI Ireland Ltd. (EEA). Übermittlung in die USA durch SCCs abgesichert (im DPA 2026-04-19 enthalten, Art. 46 DSGVO). API call logging auf Disabled gesetzt, Zero Data Retention konfiguriert.

### 1.10 Löschfristen
| Datenkategorie | Frist | Grundlage |
|---|---|---|
| Vertragsfelder | 6 Jahre nach Vertragsende | HGB §257 |
| Steuerrelevante Verträge | 10 Jahre | AO §147 |
| Consent Log | Gleich wie Vertrag | Nachweispflicht Art. 7 DSGVO |
| Ausweisbilder | Sofort nach GPT-Response | Datensparsamkeit, PAuswG |

---

## 2. Technischer Ablauf (implementiert)

### 2.1 Führerschein Vorderseite — Felder 1, 2, 3, 5, 9

```
Mitarbeiter öffnet Vertragsformular
→ Consent-Checkbox angehakt (Pflicht vor Scan)
→ Klick "Führerschein (Vorderseite) scannen"
→ Dateiauswahl / Kamera (aktuell: Upload, Produktion: Kamera)
→ Browser: Bild → Base64 (nur RAM, nie DOM/Storage)
→ POST an Supabase Edge Function "ocr-license" (mode: license_front)
   Body: { image_base64, mime_type, mode }
→ Edge Function: liest OPENAI_API_KEY aus Supabase Secret
→ POST an OpenAI GPT-4o Vision API
   Prompt: extrahiere nur Felder 1 (Nachname), 2 (Vorname), 3 (GebDat YYYY-MM-DD),
           5 (FS-Nr.), 9 (höchste Klasse) — nichts anderes
→ GPT antwortet mit JSON: { last_name, first_name, date_of_birth, license_number, license_class }
→ Edge Function gibt JSON zurück, Bild wird verworfen
→ Frontend: Felder direkt ins Formular übernehmen (setValue)
→ Bild im Browser: File-Objekt wird nach handleFile() garbage-collected
```

**Extrahierte Felder:** Nachname, Vorname, Geburtsdatum, Führerscheinnummer, Führerscheinklasse  
**Nicht extrahiert:** Ausweisnummer, MRZ, Foto, Größe, Augenfarbe, Behörde

### 2.2 Personalausweis Rückseite — Adresse

```
Mitarbeiter klickt "Ausweis Rückseite (Adresse) scannen"
(gleicher Consent gilt)
→ POST an Edge Function (mode: id_back)
→ Prompt: extrahiere nur Straße+Hausnummer und PLZ+Ort — nichts anderes
→ GPT antwortet: { street, city }
→ Frontend: street und city ins Formular
```

**Extrahierte Felder:** Straße, PLZ + Ort  
**Nicht extrahiert:** MRZ, Seriennummer, Geburtsdatum, Augenfarbe, Behörde

### 2.3 Feature-Flag
- OCR-Scan ist **nicht standardmäßig aktiv**
- Aktivierung pro Mandant über `company_settings.feature_ocr_scan = true`
- Toggle in Einstellungen → Features (nur Admin/Owner sichtbar)
- Aktuell aktiviert: PLT Autovermietung (Testkunde)

### 2.4 Kosten
- GPT-4o: ca. $0.002–0.004 pro Scan
- Beide Dokumente zusammen: unter $0.01 pro Vertrag
- Monitoring über OpenAI Usage Dashboard

---

## 3. Risikoidentifikation und Maßnahmen

| Nr. | Risiko | Stufe | Maßnahme | Status |
|---|---|---|---|---|
| R1 | Ausweisbild versehentlich persistiert | Hoch | Bild nur als Base64 im RAM der Edge Function, nie in DB/Storage | ✅ implementiert |
| R2 | PA-Seriennummer in DB | Hoch | GPT-Prompt extrahiert Seriennummer technisch nicht; PA-Seriennummer ist kein extrahiertes Feld | ✅ implementiert |
| R3 | OpenAI speichert Bildinhalte | Hoch | DPA unterzeichnet; API logging Disabled; Zero Data Retention | ✅ erledigt |
| R4 | Mandantenfehler / RLS | Mittel | Supabase RLS auf allen Tabellen; company_id-Filter | ✅ erledigt |
| R5 | Scan ohne Einwilligung | Mittel | Pflicht-Checkbox im UI, Scan-Button disabled bis Haken gesetzt | ✅ implementiert |
| R6 | Datenpanne bei OpenAI | Mittel | Incident-Response-Prozess dokumentiert (docs/incident-response.md) | ✅ erledigt |
| R7 | API-Key-Leak | Niedrig | Key nur als Supabase Secret, nie im Frontend-Bundle | ✅ implementiert |
| R8 | Consent nicht persistiert | Mittel | ocr_consent_log Spalte vorhanden, Befüllung noch nicht implementiert | ⚠️ TODO |
| R9 | Upload statt Kamera (Produktion) | Niedrig | Aktuell `capture="environment"` + file input — für Produktion: rein Kamera-Modus erzwingen | ⚠️ TODO |

---

## 4. Offene Punkte (TODOs vor Produktionsfreigabe)

- [ ] **R8:** Consent-Zeitstempel in `contracts.ocr_consent_log` speichern (profile_id, timestamp, document_type, fields_extracted)
- [ ] **R9:** Upload-Option für Produktion deaktivieren — nur Kamera (`accept="image/*" capture="environment"` ohne Upload-Fallback auf Desktop erzwingen oder separates Modal)
- [ ] DSFA durch externen Datenschutzberater prüfen und freigeben
- [ ] Datenschutzerklärung (docs/datenschutzerklaerung-endnutzer.md) um OCR-Abschnitt ergänzen

---

## 5. Ergebnis

Die Verarbeitung ist unter den beschriebenen Maßnahmen datenschutzrechtlich vertretbar.  
Kernrisiken R1–R7 sind technisch adressiert. R8 und R9 sind vor breitem Produktionseinsatz umzusetzen.

Nächste Überprüfung: **2027-04-20**
