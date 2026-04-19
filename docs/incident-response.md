# Incident-Response-Prozess
## Datenpannen und Sicherheitsvorfälle nach Art. 33/34 DSGVO

**Dokument-ID:** IRP-NVL-001  
**Version:** 1.0  
**Datum:** 2026-04-19  
**Verantwortlicher:** Axel Schurer, NuVioLabs  
**Kontakt:** contact@nuviolabs.de  
**Status:** Entwurf — zur Prüfung durch Datenschutzberater  

---

## 1. Geltungsbereich

Dieser Prozess gilt für alle Datenpannen (Personal Data Breaches) im Zusammenhang mit NuVio Core und NuVio Fleet, einschließlich Vorfälle bei Auftragsverarbeitern (Supabase, Vercel, OpenAI).

Eine **Datenpanne** im Sinne von Art. 4 Nr. 12 DSGVO ist jede Verletzung der Sicherheit, die zur unbeabsichtigten oder unrechtmäßigen:
- Vernichtung
- Verlust
- Veränderung
- unbefugten Offenlegung
- oder unbefugtem Zugang

zu personenbezogenen Daten führt oder führen kann.

---

## 2. Schweregrad-Klassifikation

| Stufe | Bezeichnung | Beispiele |
|---|---|---|
| **S1 — Kritisch** | Hohes Risiko für betroffene Personen | Ausweisbilder/Vertragsdaten öffentlich zugänglich, RLS-Fehler mit Cross-Tenant-Zugriff, API-Key-Leak mit Datenzugriff |
| **S2 — Hoch** | Risiko für betroffene Personen | Unbefugter interner Zugriff auf Mieterdaten, Supabase-Breach mit NuVio-Daten, OCR-Bild versehentlich persistiert |
| **S3 — Mittel** | Geringes Risiko, aber Meldepflicht prüfen | Einzelner Nutzer sieht fremde Buchung durch Bug, Log-Datei mit personenbezogenen Daten zugänglich |
| **S4 — Niedrig** | Kein Risiko für Personen | Interne Konfigurationsfehler ohne Datenzugriff, fehlgeschlagene Angriffsversuche ohne Erfolg |

---

## 3. 72-Stunden-Regel (Art. 33 DSGVO)

> **Vorfälle der Stufe S1 und S2 müssen innerhalb von 72 Stunden nach Bekanntwerden der Aufsichtsbehörde gemeldet werden.**

Zuständige Aufsichtsbehörde für NuVioLabs (NRW):  
**Landesbeauftragte für Datenschutz und Informationsfreiheit NRW (LDI NRW)**  
Kavalleriestraße 2–4, 40213 Düsseldorf  
poststelle@ldi.nrw.de  
Tel.: 0211 38424-0  
Online-Meldung: https://www.ldi.nrw.de/meldung-einer-datenpanne

Die 72 Stunden beginnen ab dem Zeitpunkt, an dem NuVioLabs von dem Vorfall **Kenntnis erlangt** — auch wenn die Ursache noch nicht vollständig geklärt ist. In diesem Fall wird eine vorläufige Meldung abgegeben und nachträglich ergänzt.

---

## 4. Meldepflicht gegenüber Betroffenen (Art. 34 DSGVO)

Betroffene Personen (Mieter) müssen **unverzüglich** informiert werden, wenn ein Vorfall **voraussichtlich ein hohes Risiko** für ihre Rechte und Freiheiten zur Folge hat (Stufe S1).

Die Benachrichtigung enthält:
- Art des Vorfalls (in verständlicher Sprache)
- Kontaktdaten des Verantwortlichen
- Wahrscheinliche Folgen
- Ergriffene und geplante Maßnahmen

---

## 5. Incident-Response-Ablauf

### Phase 1 — Erkennung & Erstbewertung (0–2 Stunden)

- [ ] Vorfall dokumentieren: Was wurde wann wie entdeckt?
- [ ] Schweregrad einschätzen (S1–S4)
- [ ] Axel Schurer informieren (bei S1/S2 sofort, auch außerhalb der Geschäftszeiten)
- [ ] Vorfall in Incident-Log eintragen (siehe Abschnitt 7)

### Phase 2 — Eindämmung (2–6 Stunden)

- [ ] Zugriff sperren / betroffene Systeme isolieren (z.B. Supabase RLS temporär verschärfen, API-Key rotieren)
- [ ] Betroffenen Mandanten identifizieren
- [ ] Umfang der betroffenen Daten eingrenzen
- [ ] Beweise sichern (Logs, Screenshots) — **keine Logs löschen**

### Phase 3 — Meldung (spätestens 72 Stunden nach Bekanntwerden)

Bei S1/S2:
- [ ] Meldung an LDI NRW (online oder per E-Mail)
- [ ] Meldung an betroffene Auftragsverarbeiter (Supabase: support@supabase.io / OpenAI: privacy@openai.com)
- [ ] Betroffene Mandanten informieren
- [ ] Bei S1: Betroffene Personen (Mieter) direkt benachrichtigen

**Inhalt der Behördenmeldung (Art. 33 Abs. 3 DSGVO):**
1. Art der Verletzung, betroffene Kategorien und ungefähre Zahl der Personen und Datensätze
2. Name und Kontaktdaten des Verantwortlichen
3. Wahrscheinliche Folgen der Verletzung
4. Ergriffene oder vorgeschlagene Maßnahmen

### Phase 4 — Behebung

- [ ] Ursache vollständig beheben
- [ ] Technische Maßnahmen implementieren um Wiederholung zu verhindern
- [ ] Patch deployen
- [ ] Supabase RLS / Zugriffsrechte neu prüfen

### Phase 5 — Nachbereitung (innerhalb 2 Wochen)

- [ ] Abschlussbericht erstellen
- [ ] DSFA und RoPA aktualisieren falls notwendig
- [ ] Behörde über Abschluss der Maßnahmen informieren (Nachmeldung)
- [ ] Lessons Learned dokumentieren

---

## 6. Kontakte und Eskalation

| Rolle | Person | Kontakt |
|---|---|---|
| Verantwortlicher (DSGVO) | Axel Schurer | contact@nuviolabs.de |
| Aufsichtsbehörde NRW | LDI NRW | poststelle@ldi.nrw.de / 0211 38424-0 |
| Supabase Support | — | support@supabase.io |
| OpenAI Privacy | — | privacy@openai.com |
| Vercel Support | — | support@vercel.com |

---

## 7. Incident-Log (Vorlage)

Jeden Vorfall hier dokumentieren — auch S3/S4 die nicht gemeldet werden müssen.

| Feld | Inhalt |
|---|---|
| **Incident-ID** | INC-YYYY-NNN |
| **Entdeckt am** | |
| **Entdeckt durch** | |
| **Schweregrad** | S1 / S2 / S3 / S4 |
| **Beschreibung** | |
| **Betroffene Daten** | |
| **Betroffene Personen (ca.)** | |
| **Betroffene Mandanten** | |
| **Sofortmaßnahmen** | |
| **Behörde informiert am** | |
| **Betroffene informiert am** | |
| **Ursache** | |
| **Abstellmaßnahmen** | |
| **Abgeschlossen am** | |

---

## 8. Vorfälle durch Auftragsverarbeiter

Wenn Supabase, Vercel oder OpenAI einen Breach melden (gemäß Art. 2.7 des OpenAI DPA bzw. entsprechenden Klauseln):

- [ ] Meldung des Auftragsverarbeiters entgegennehmen und dokumentieren
- [ ] Eigene Betroffenheit prüfen (welche Mandanten, welche Daten)
- [ ] Eigene Meldepflicht gegenüber LDI NRW prüfen (72h-Frist läuft ab eigener Kenntnis)
- [ ] Mandanten informieren
- [ ] Normaler Incident-Ablauf ab Phase 3

---

## 9. Überprüfung dieses Dokuments

Dieses Dokument ist zu überprüfen:
- Jährlich (nächste Prüfung: 2027-04-19)
- Nach jedem tatsächlichen Vorfall
- Bei wesentlichen Änderungen an der Systemarchitektur
