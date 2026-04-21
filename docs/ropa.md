# Verzeichnis von Verarbeitungstätigkeiten (VVT / RoPA)
## nach Art. 30 DSGVO

**Verantwortlicher:** NuVioLabs, Axel Schurer, Nimwegerstraße 3, 47559 Kranenburg  
**Kontakt:** contact@nuviolabs.de  
**Letzte Aktualisierung:** 2026-04-20  
**Status:** Entwurf — zur Prüfung durch Datenschutzberater  

> Dieses Verzeichnis muss nicht bei einer Behörde eingereicht werden, aber auf Anfrage der Aufsichtsbehörde (LDI NRW) vorgelegt werden können (Art. 30 Abs. 4 DSGVO).

---

## VT-001 — Benutzerauthentifizierung und Session-Verwaltung

| Feld | Inhalt |
|---|---|
| **Zweck** | Anmeldung, Session-Verwaltung, Passwort-Reset |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung SaaS-Nutzung) |
| **Betroffene Personen** | Mitarbeiter der Mandanten (Nutzer der Plattform) |
| **Datenkategorien** | E-Mail, verschlüsseltes Passwort (bcrypt), Session-Token, letzter Login |
| **Auftragsverarbeiter** | Supabase Inc. (Auth) |
| **Drittlandübermittlung** | USA — SCCs über Supabase DPA |
| **Löschfrist** | Bei Kündigung der Membership; Session-Tokens nach Ablauf |
| **TOMs** | TLS, bcrypt-Hashing, RLS, MFA optional |

---

## VT-002 — Mandanten- und Benutzerverwaltung

| Feld | Inhalt |
|---|---|
| **Zweck** | Verwaltung von Unternehmen (Mandanten), Memberships und Rollen |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung) |
| **Betroffene Personen** | Mitarbeiter der Mandanten |
| **Datenkategorien** | Name, E-Mail, Rolle, Unternehmenszuordnung, Einladungsstatus |
| **Auftragsverarbeiter** | Supabase Inc. |
| **Drittlandübermittlung** | USA — SCCs |
| **Löschfrist** | Bei Kündigung des Mandantenkontos |
| **TOMs** | RLS, company_id-Filterung, Rollenbasierte Zugriffskontrolle |

---

## VT-003 — Buchungsverwaltung

| Feld | Inhalt |
|---|---|
| **Zweck** | Erfassung und Verwaltung von Ressourcenbuchungen (z.B. Fahrzeugmiete) |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung) |
| **Betroffene Personen** | Kunden des Mandanten (Mieter) |
| **Datenkategorien** | Vorname, Nachname, Telefon, E-Mail, Buchungszeitraum, Ressource, Preis, Custom Fields |
| **Auftragsverarbeiter** | Supabase Inc. |
| **Drittlandübermittlung** | USA — SCCs |
| **Löschfrist** | 6 Jahre nach Buchungsende (HGB §257) |
| **TOMs** | RLS, Mandantenisolierung, TLS |

---

## VT-004 — Vertragsverwaltung

| Feld | Inhalt |
|---|---|
| **Zweck** | Erstellung, Verwaltung und Archivierung von Mietverträgen |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung), Art. 6 Abs. 1 lit. c (gesetzliche Aufbewahrungspflicht) |
| **Betroffene Personen** | Mieter (Kunden des Mandanten), ggf. Zweitmieter |
| **Datenkategorien** | Name, Adresse, Geburtsdatum, Führerscheinklasse, Führerschein-Nr. / Reisepass-Nr., Zahlungsstatus, Vertragsdetails, Zweitmieterdaten (JSONB) |
| **Auftragsverarbeiter** | Supabase Inc. |
| **Drittlandübermittlung** | USA — SCCs |
| **Löschfrist** | retention_category: HGB = 6 Jahre, AO = 10 Jahre nach Vertragsende (automatisch per DB-Trigger) |
| **TOMs** | RLS, Mandantenisolierung, TLS, Audit-Log geplant |
| **Besonderheit** | Personalausweis-Seriennummer wird technisch nie gespeichert (PAuswG §20) |

---

## VT-005 — KI-gestützte Dokumentenerfassung (✅ produktiv, PLT-Feature)

| Feld | Inhalt |
|---|---|
| **Zweck** | Automatisierte Extraktion von Mieterdaten aus Führerschein (Vorderseite) und Personalausweis (Rückseite) zur Vereinfachung der Vertragsanlage |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung) + Art. 6 Abs. 1 lit. a (Einwilligung, Pflicht-Checkbox vor Scan) |
| **Betroffene Personen** | Mieter die dem Scan zugestimmt haben |
| **Datenkategorien** | Ausweisbild / Führerscheinbild (ephemer, nie gespeichert), extrahierte Vertragsfelder: Name, Adresse, Geburtsdatum, FS-Klasse, FS-Nr. (→ VT-004) |
| **Auftragsverarbeiter** | OpenAI Ireland Ltd. (GPT-4o Vision API), Supabase Inc. (Edge Function Hosting) |
| **Drittlandübermittlung** | USA (OpenAI) — SCCs im DPA vom 2026-04-19; USA (Supabase) — SCCs |
| **Löschfrist** | Bilder: sofort nach GPT-Response; extrahierte Felder: wie Vertrag (VT-004) |
| **TOMs** | Bilder nur als Base64 im RAM der Edge Function; nie in DB/Storage; API call logging Disabled bei OpenAI; Zero Data Retention; PA-Seriennummer technisch nicht extrahiert (GPT-Prompt); Pflicht-Consent-Checkbox; Feature nur per company_settings.feature_ocr_scan aktivierbar; nur Editor/Admin/Owner-Rollen |
| **DSFA** | DSFA-NVL-001 v2.0 erstellt (2026-04-20), Prüfung durch DSB ausstehend |
| **Aktiviert für** | PLT Autovermietung (Testkunde) |

---

## VT-006 — Ressourcenverwaltung

| Feld | Inhalt |
|---|---|
| **Zweck** | Verwaltung von vermietbaren Ressourcen (Fahrzeuge, Geräte, etc.) |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung) |
| **Betroffene Personen** | Keine natürlichen Personen direkt (Fahrzeugdaten) |
| **Datenkategorien** | Ressourcenname, Kennzeichen, Metadaten, Verfügbarkeit |
| **Auftragsverarbeiter** | Supabase Inc. |
| **Drittlandübermittlung** | USA — SCCs |
| **Löschfrist** | Bei Löschung der Ressource durch Mandant |
| **TOMs** | RLS, Mandantenisolierung |

---

## VT-007 — Preislisten und Abrechnungsgrundlagen

| Feld | Inhalt |
|---|---|
| **Zweck** | Verwaltung von Preisstrukturen für Buchungen und Verträge |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung) |
| **Betroffene Personen** | Keine natürlichen Personen direkt |
| **Datenkategorien** | Preislisten, Tagessätze, Extras, Pakete |
| **Auftragsverarbeiter** | Supabase Inc. |
| **Drittlandübermittlung** | USA — SCCs |
| **Löschfrist** | Bei Löschung durch Mandant |
| **TOMs** | RLS, Mandantenisolierung |

---

## Auftragsverarbeiter-Übersicht

| Dienstleister | Sitz | Zweck | DPA / SCCs |
|---|---|---|---|
| Supabase Inc. | USA | Datenbank, Auth, Storage | DPA vorhanden, SCCs |
| Vercel Inc. | USA | Hosting, Edge Functions | DPA vorhanden, SCCs |
| OpenAI Ireland Ltd. | Irland (EEA) | Vision API (OCR) | DPA unterzeichnet 2026-04-19, SCCs |

---

## Technische und organisatorische Maßnahmen (TOMs) — Überblick

- **Verschlüsselung:** TLS 1.2+ für alle Übertragungen; Supabase verschlüsselt Daten at rest
- **Zugriffskontrolle:** Row Level Security (RLS) auf allen Tabellen; rollenbasierte Berechtigungen
- **Mandantenisolierung:** company_id-Filterung auf allen Queries; kein Cross-Tenant-Datenzugriff möglich
- **Datensparsamkeit:** Nur notwendige Felder werden erfasst; Ausweisbilder niemals persistiert
- **Löschkonzept:** Automatische Löschfristen per DB-Trigger; retention_delete_after-Feld auf contracts
- **Incident-Management:** Prozess dokumentiert in docs/incident-response.md (72h-Meldepflicht nach Art. 33 DSGVO)
- **Auftragsverarbeitung:** DPAs mit allen Auftragsverarbeitern geschlossen

---

## Offene Punkte

- [x] Incident-Response-Prozess dokumentieren (72h-Meldepflicht Art. 33 DSGVO) — docs/incident-response.md
- [x] Datenschutzerklärung für Endnutzer (Mieter) erstellen — docs/datenschutzerklaerung-endnutzer.md
- [x] VT-005 (OCR) nach Implementierung auf "produktiv" setzen — ✅ produktiv, PLT Autovermietung
- [ ] Consent-Zeitstempel in `contracts.ocr_consent_log` persistieren (R8, DSFA-NVL-001)
- [ ] Produktion: Upload-Option deaktivieren, nur Kamera-Modus (R9, DSFA-NVL-001)
- [ ] RoPA durch Datenschutzberater prüfen lassen
- [ ] Ggf. Datenschutzbeauftragten benennen (prüfen ob Pflicht besteht nach Art. 37 DSGVO)
- [ ] Datenschutzerklärung um OCR-Abschnitt ergänzen (VT-005)
