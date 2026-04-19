# Datenschutz-Folgenabschätzung (DSFA)
## nach Art. 35 DSGVO

**Dokument-ID:** DSFA-NVL-001  
**Version:** 1.0  
**Datum:** 2026-04-19  
**Erstellt von:** Axel Schurer, NuVioLabs  
**Status:** Entwurf — zur Prüfung durch Datenschutzberater  

---

## 1. Beschreibung der Verarbeitung

### 1.1 Bezeichnung der Verarbeitung
OCR-gestützte Identitätsdokumentenerfassung zur Vertragsanlage (NuVio Fleet / NuVio Core)

### 1.2 Zweck der Verarbeitung
Automatisierte Extraktion von Mieterdaten (Name, Adresse, Geburtsdatum, Führerscheinklasse, Dokumentnummer) aus Lichtbildausweisen (Personalausweis, Führerschein, Reisepass) mittels KI-gestützter Texterkennung (OpenAI GPT-4o-mini Vision API), um die manuelle Dateneingabe bei Vertragsabschluss zu beschleunigen und Eingabefehler zu reduzieren.

### 1.3 Rechtsgrundlage
- **Art. 6 Abs. 1 lit. b DSGVO** — Verarbeitung zur Erfüllung eines Vertrags (Mietvertrag)
- **Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO** für die Ablichtung des Ausweises (PAuswG-Konformität)

### 1.4 Verantwortlicher
NuVioLabs  
Axel Schurer  
Nimwegerstraße 3, 47559 Kranenburg  
contact@nuviolabs.de

### 1.5 Auftragsverarbeiter
| Dienstleister | Zweck | Vertrag |
|---|---|---|
| OpenAI Ireland Ltd., Dublin | KI-Texterkennung (Vision API) | DPA unterzeichnet 2026-04-19 |
| Supabase Inc. | Datenbankhosting, Auth | DPA vorhanden |
| Vercel Inc. | Hosting / Edge Functions | DPA vorhanden |

### 1.6 Kategorien betroffener Personen
- Mieter (Kunden des Endkunden / Mandanten)
- Ggf. Zweitmietern

### 1.7 Kategorien verarbeiteter Daten
| Datenkategorie | Gespeichert | Ephemer | Anmerkung |
|---|---|---|---|
| Vorname, Nachname | ✅ ja | — | Vertragsfeld |
| Adresse | ✅ ja | — | Vertragsfeld |
| Geburtsdatum | ✅ ja | — | Vertragsfeld |
| Führerscheinklasse | ✅ ja | — | Vertragsfeld |
| Führerschein-Nr. / Reisepass-Nr. | ✅ ja | — | Vertragsfeld, kein PA |
| Personalausweis-Seriennummer | ❌ nein | — | PAuswG §20 verboten |
| Ausweisbild (Foto) | ❌ nein | ✅ ephemer | Nur RAM, sofort nach GPT-Response gelöscht |
| OCR-Rohtext | ❌ nein | ✅ ephemer | Nie persistiert |
| Consent Log | ✅ ja | — | Wer, wann, welche Felder extrahiert |

### 1.8 Empfänger der Daten
- Mitarbeiter des jeweiligen Mandanten (Editor, Admin, Owner)
- OpenAI Ireland Ltd. (Auftragsverarbeiter, temporär für API-Call)
- Keine Weitergabe an Dritte

### 1.9 Übermittlung in Drittländer
OpenAI verarbeitet über OpenAI Ireland Ltd. (EEA). Datenübermittlung in die USA durch SCCs abgesichert (im DPA vom 2026-04-19 enthalten, Art. 46 DSGVO).

### 1.10 Löschfristen
| Datenkategorie | Frist | Grundlage |
|---|---|---|
| Vertragsfelder | 6 Jahre nach Vertragsende | HGB §257 |
| Bei steuerrelevanten Verträgen | 10 Jahre | AO §147 |
| Consent Log | Gleich wie Vertrag | Nachweispflicht |
| Ausweisbilder | Sofort nach GPT-Response | Datensparsamkeit, PAuswG |

---

## 2. Notwendigkeit und Verhältnismäßigkeit

### 2.1 Ist die Verarbeitung für den Zweck notwendig?
Ja. Ohne Identitätsprüfung ist der Abschluss eines Fahrzeugmietvertrags rechtlich nicht sinnvoll möglich. Die OCR-Unterstützung ist freiwillig — der Vertrag kann auch ohne OCR manuell ausgefüllt werden (keine Pflicht zur Dokumentenablichtung).

### 2.2 Ist der Eingriff verhältnismäßig?
Ja, weil:
- Bilder werden nie dauerhaft gespeichert
- Seriennummer wird technisch gefiltert
- Einwilligung erfolgt explizit vor dem Scan
- Nur autorisierte Rollen (Editor, Admin, Owner) können scannen
- Mandantenisolierung verhindert Zugriff fremder Tenants

### 2.3 Datensparsamkeit (Art. 5 Abs. 1 lit. c DSGVO)
- Nur Felder die für den Mietvertrag notwendig sind werden extrahiert und gespeichert
- Personalausweis-Seriennummer wird technisch aus der GPT-Response gefiltert bevor sie das Frontend erreicht
- Bilddaten verlassen niemals den RAM des Servers

---

## 3. Risikoidentifikation

| Nr. | Risiko | Eintrittswahrscheinlichkeit | Schwere | Risikostufe |
|---|---|---|---|---|
| R1 | Ausweisbild wird versehentlich persistiert (Programmierfehler) | Mittel | Hoch | **Hoch** |
| R2 | Seriennummer wird nicht korrekt gefiltert und landet in DB | Mittel | Hoch | **Hoch** |
| R3 | OpenAI speichert Bildinhalte entgegen DPA | Niedrig | Sehr hoch | **Hoch** |
| R4 | Unbefugter Zugriff durch Mandantenfehler (RLS-Fehler) | Niedrig | Hoch | **Mittel** |
| R5 | Mitarbeiter scannt ohne Einwilligung des Ausweisinhabers | Mittel | Mittel | **Mittel** |
| R6 | Datenpanne bei OpenAI (Breach) | Niedrig | Hoch | **Mittel** |
| R7 | API-Key-Leak → unberechtigter API-Zugriff | Niedrig | Mittel | **Niedrig** |

---

## 4. Maßnahmen zur Risikobehandlung

| Risiko | Maßnahme | Status |
|---|---|---|
| R1 | Bilder nur in RAM, nie in DB/Storage schreiben; Code-Review-Pflicht für `/api/document-scan` | Geplant (OCR-Session) |
| R2 | Backend filtert Seriennummer explizit aus GPT-Response vor Rückgabe an Frontend | Geplant (OCR-Session) |
| R3 | OpenAI DPA unterzeichnet; API call logging Disabled; Zero Data Retention konfiguriert | ✅ erledigt |
| R4 | Supabase RLS auf allen Tabellen; company_id-Filter auf allen Queries | ✅ erledigt |
| R5 | Pflicht-Checkbox im UI vor jedem Scan; kein Scan ohne explizite Einwilligung möglich | Geplant (OCR-Session) |
| R6 | Incident-Prozess dokumentieren; 72h-Meldepflicht einplanen | ⚠️ offen |
| R7 | API-Key nur serverseitig (Edge Function), nie im Frontend-Bundle | Geplant (OCR-Session) |

---

## 5. Konsultation der Aufsichtsbehörde

Nach Einschätzung des Verantwortlichen ist eine vorherige Konsultation der zuständigen Aufsichtsbehörde (LDI NRW) gemäß Art. 36 DSGVO derzeit **nicht erforderlich**, da:
- die technischen und organisatorischen Maßnahmen das Restrisiko auf ein vertretbares Niveau senken
- keine systematische Verarbeitung besonderer Kategorien (Art. 9 DSGVO) erfolgt
- die Verarbeitung auf den Vertragsabschluss beschränkt ist

**Diese Einschätzung ist vom Datenschutzberater zu bestätigen.**

---

## 6. Ergebnis

Die Verarbeitung ist unter den beschriebenen Maßnahmen datenschutzrechtlich vertretbar.  
Voraussetzung für den Produktivbetrieb:
- [ ] Maßnahmen R1, R2, R5, R7 technisch umgesetzt (OCR-Session)
- [ ] Incident-Prozess dokumentiert (R6)
- [ ] DSFA durch Datenschutzberater geprüft und freigegeben
- [ ] Datenschutzerklärung für Endnutzer aktualisiert

---

## 7. Überprüfung

Diese DSFA ist zu überprüfen bei:
- Wesentlichen Änderungen am OCR-Flow
- Wechsel des KI-Dienstleisters
- Erweiterung der gespeicherten Datenkategorien
- Behördlicher Anforderung

Nächste geplante Überprüfung: **2027-04-19**
