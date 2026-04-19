# Verzeichnis von Verarbeitungstätigkeiten (VVT / RoPA)
## nach Art. 30 DSGVO

**Verantwortlicher:** NuVioLabs, Axel Schurer, Nimwegerstraße 3, 47559 Kranenburg  
**Kontakt:** contact@nuviolabs.de  
**Letzte Aktualisierung:** 2026-04-19  
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

## VT-005 — OCR-gestützte Dokumentenerfassung (geplant, noch nicht produktiv)

| Feld | Inhalt |
|---|---|
| **Zweck** | Automatisierte Extraktion von Mieterdaten aus Lichtbildausweisen zur Vereinfachung der Vertragsanlage |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b (Vertragserfüllung) + Einwilligung (PAuswG) |
| **Betroffene Personen** | Mieter die dem Scan zugestimmt haben |
| **Datenkategorien** | Ausweisbild (ephemer, nie gespeichert), extrahierte Vertragsfelder (→ VT-004), Consent Log |
| **Auftragsverarbeiter** | OpenAI Ireland Ltd. (Vision API), Supabase Inc. |
| **Drittlandübermittlung** | USA (OpenAI) — SCCs im DPA vom 2026-04-19; USA (Supabase) — SCCs |
| **Löschfrist** | Ausweisbild: sofort nach API-Response; Consent Log: wie Vertrag (VT-004) |
| **TOMs** | Bilder nur ephemer im RAM, sofortige Löschung nach API-Response, API call logging Disabled bei OpenAI, Seriennummer-Filter im Backend, Pflicht-Einwilligungs-Checkbox, Rollenbeschränkung (nur Editor/Admin/Owner) |
| **DSFA** | Erstellt (DSFA-NVL-001), Prüfung durch DSB ausstehend |

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
- **Incident-Management:** ⚠️ Prozess noch zu dokumentieren (72h-Meldepflicht nach Art. 33 DSGVO)
- **Auftragsverarbeitung:** DPAs mit allen Auftragsverarbeitern geschlossen

---

## Offene Punkte (vor Produktivbetrieb)

- [ ] Incident-Response-Prozess dokumentieren (72h-Meldepflicht Art. 33 DSGVO)
- [ ] Datenschutzerklärung für Endnutzer (Mieter) erstellen
- [ ] VT-005 (OCR) nach Implementierung auf "produktiv" setzen
- [ ] RoPA durch Datenschutzberater prüfen lassen
- [ ] Ggf. Datenschutzbeauftragten benennen (prüfen ob Pflicht besteht nach Art. 37 DSGVO)
