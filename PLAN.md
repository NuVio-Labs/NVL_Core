# NuVio Platform — Produkt- und Wachstumsplan

_Erstellt: April 2026_

---

## Vision

NuVio wird eine modulare, mandantenfähige SaaS-Plattform für operative
Unternehmensprozesse — beginnend mit Autovermietung, skalierend in andere
Branchen. Jedes Modul ist in sich geschlossen, baut aber auf dem gemeinsamen
Core auf. Kunden zahlen nur was sie nutzen.

---

## Produktarchitektur

```
┌─────────────────────────────────────────────────────┐
│                  NuVio Platform                     │
├─────────────────────────────────────────────────────┤
│                   NuVio Core                        │
│  Auth · Workspace · Rollen · Kunden · Einstellungen │
│  Ressourcen · Buchungen · Preislisten · Mitarbeiter │
│  Verträge · Dokumente · OCR · Storage · Audit       │
├──────────────┬──────────────┬───────────────────────┤
│  NuVio Fleet │  NuVio Rent  │  NuVio Field  │  ...  │
│  (Fuhrpark)  │  (Vermietung)│  (Außendienst)│       │
└──────────────┴──────────────┴───────────────────────┘
```

Core ist die gemeinsame Basis. Vertikale Produkte ergänzen nur
branchenspezifische Fachlogik — kein Duplikat, kein Fork.

---

## Aktueller Stand (April 2026)

### Fertig / in Produktion
- [x] Auth + Session Handling
- [x] Multi-Tenant Workspace
- [x] Rollen & Berechtigungen (owner / admin / editor / member / viewer)
- [x] Ressourcenverwaltung + dynamische Felder
- [x] Preislisten + dynamische Positionsfelder
- [x] Buchungsmodul + Kalender + Doppelbuchungsschutz
- [x] Dauer-Tarif-Mapping (auto-generiert aus Preislisten)
- [x] Mitarbeiterverwaltung + dynamische Felder + Standort
- [x] Einstellungen (Felder, Zuordnungen, Profil)
- [x] Standort-Warnung im Buchungsformular

### In Planung / nächster Schritt
- [ ] Vertragsmodul (siehe CONTRACT.md)
- [ ] OCR (Tesseract.js + MRZ → Phase 2 Claude)
- [ ] PDF-Generierung (pdf-lib + Original-Blanko)
- [ ] Tablet-Unterschrift (signature_pad)
- [ ] Kundenverwaltung (Ausbau)

---

## Modul-Roadmap

### Phase 1 — Core fertigstellen (2026)

| Modul | Beschreibung | Status |
|---|---|---|
| **Vertragsmodul** | Mietvertrag aus Buchung, OCR, PDF, Unterschrift | In Planung |
| **Kundenverwaltung** | Kundenakte, Historie, Dokumente | Basis vorhanden |
| **Dokumenten-Ablage** | Upload, Kategorisierung, Supabase Storage | Geplant |
| **Audit-Log** | Wer hat wann was geändert | Geplant |
| **Dashboard** | KPIs, Auslastung, Umsatz-Übersicht | Basis vorhanden |

### Phase 2 — Operative Erweiterungen (2026/2027)

| Modul | Beschreibung |
|---|---|
| **Schadenmodul** | Schaden erfassen, Fotos, Status, Abrechnung |
| **Übergabeprotokoll** | digitales Fahrzeugprotokoll bei Übergabe/Rückgabe |
| **Rechnungsmodul** | Rechnung aus Vertrag generieren, PDF, MwSt. |
| **Mahnwesen** | Zahlungsstatus, Mahnlauf, Eskalationsstufen |
| **Kalender-Erweiterung** | Ressourcen-Ansicht, Multi-Ressource, Drag & Drop |
| **Benachrichtigungen** | E-Mail bei Buchung, Erinnerung, Rückgabe |
| **Standortverwaltung** | mehrere Standorte pro Mandant, Übergabepunkte |

### Phase 3 — Plattform-Features (2027)

| Modul | Beschreibung |
|---|---|
| **Kundenportal** | Mieter kann online buchen, Vertrag einsehen |
| **Online-Buchung** | öffentliche Buchungsseite pro Mandant (White Label) |
| **Zahlungsintegration** | Stripe, SEPA, Anzahlung, Kaution |
| **E-Mail-System** | Buchungsbestätigung, Vertragsversand, Mahnungen |
| **Reporting** | Auslastung, Umsatz, Mandantenvergleich (Plattform-Admin) |
| **API** | REST-API für externe Systeme (Buchhaltung, ERP) |
| **Webhooks** | Events für externe Integrationen |
| **White Label** | eigene Domain, Logo, Farben pro Mandant |

### Phase 4 — Vertikale Produkte (2027+)

| Produkt | Zielgruppe | Core-Erweiterung |
|---|---|---|
| **NuVio Fleet** | Fuhrparkverwaltung | Wartung, TÜV, Tankkarten, Poolfahrzeuge |
| **NuVio Rent** | Vermietung allgemein | Inventar, Kategorien, Saisonpreise |
| **NuVio Field** | Außendienst | Tourenplanung, Zeiterfassung, Aufträge |
| **NuVio Event** | Eventausstattung | Pakete, Auf-/Abbau, Lager |
| **NuVio Service** | Handwerk / Service | Aufträge, Materialien, Stundennachweis |

---

## Preismodell (Planung)

### Aktuell (Testphase)
```
Flat: 25€/Monat pro Mandant
→ Alle verfügbaren Module inklusive
→ Ziel: erste zahlende Kunden, Feedback sammeln
```

### Mittelfristig (ab ~10 Mandanten)
```
Starter   25€/Monat   Buchungen, Ressourcen, Kalender
Business  49€/Monat   + Verträge, OCR, PDF, Unterschrift
Pro       89€/Monat   + Rechnungen, Schadenmodul, API-Zugang
```

### Langfristig (Plattform)
```
Core-Module       Basispreis pro Mandant
Add-on-Module     +X€/Monat je Modul
Vertikale         eigene Produktpreise (Fleet, Rent, etc.)
Agentur-Lizenzen  White Label + Reseller-Marge
```

### Kostenstruktur (Hochrechnung)

| Mandanten | Einnahmen | Infra-Kosten | Marge |
|---|---|---|---|
| 5 | €125 | ~€10 | €115 (92%) |
| 20 | €500 | ~€25 | €475 (95%) |
| 50 | €1.250 | ~€60 | €1.190 (95%) |
| 100 | €2.500 | ~€120 | €2.380 (95%) |

_Infra = Supabase Pro + Claude API + Hosting. Skaliert sehr günstig._

---

## Technische Skalierungsstrategie

### Datenbank
- Supabase Free → Pro ab ~5 Mandanten ($25/Monat)
- Row Level Security sichert Mandantentrennung auf DB-Ebene
- Kein Datenmix möglich — company_id ist überall Pflicht

### Storage
- Supabase Storage für PDFs, Fotos, Dokumente
- Pro Mandant eigener Pfad: `/{company_id}/contracts/...`
- Kosten: ~$0.021/GB/Monat — bei 100 Mandanten à 500MB = ~$1/Monat

### OCR
- Phase 1: Tesseract.js (kostenlos, lokal im Browser)
- Phase 2: Claude Haiku (~$0.004/Scan) — unter $5/Mandant/Monat
- Feature-Flag pro Mandant: `company.settings.ocr_provider`

### Performance
- TanStack Query für Caching — minimale DB-Last
- RLS auf Supabase — kein App-Server nötig
- Vite + React — schnelle Ladezeiten
- Lazy Loading aller Seiten — kleines Initial-Bundle

### Multi-Tenancy
- Vollständig ab Fundament — company_id auf jeder Tabelle
- RLS-Policies auf DB-Ebene — kein Frontend-Workaround möglich
- Workspace-Kontext zentralisiert — kein Datenleck zwischen Mandanten

---

## Go-to-Market Strategie

### Schritt 1 — Erster Kunde (jetzt)
- PLT Autovermietung als Pilot
- Direkter Praxistest aller Module
- Feedback → sofort in Produkt zurück
- Preis: 25€/Monat Flat

### Schritt 2 — Erste 5 Mandanten
- Autovermietungen im Umkreis (Kleve, Weeze, Goch, Emmerich)
- Persönlicher Vertrieb, Onboarding vor Ort
- Fokus: Buchung + Vertrag + OCR funktioniert reibungslos
- Preismodell verfeinern

### Schritt 3 — Agenturmodell
- Vermietungsagenturen oder Buchhalter als Reseller
- White-Label-Ansatz: eigene Subdomain + Logo pro Mandant
- Agentur bekommt Marge, NuVio bekommt Plattformgebühr

### Schritt 4 — Vertikale Produkte
- NuVio Fleet als erstes eigenständiges Produkt
- Fuhrparkverwaltung für Unternehmen (nicht nur Vermietung)
- Größere Zielgruppe, höherer ARPU

---

## Offene strategische Entscheidungen

| Thema | Optionen | Stand |
|---|---|---|
| Eigenvertrieb vs. Reseller | direkt / Agentur / beides | offen |
| Onboarding | selbst / automatisch | manuell in Phase 1 |
| Support | E-Mail / Chat / Telefon | offen |
| Abrechnung der App selbst | Stripe Billing / manuell | manuell in Phase 1 |
| Plattform-Admin-Panel | eigenes Dashboard für NuVio-Intern | geplant Phase 3 |
| Mehrsprachigkeit | DE only / DE+EN | DE in Phase 1 |
| Mobile App | PWA / native | PWA-ready (React), native später |

---

## Nicht-Ziele (bewusst ausgeklammert)

- Keine Branchenlösung für einen einzelnen Kunden fest einbauen
- Keine harte Sonderlogik die nur für PLT gilt
- Kein Monolith — Module bleiben unabhängig aktivierbar
- Keine eigene Auth-Infrastruktur — Supabase Auth bleibt Fundament
- Kein Over-Engineering für hypothetische Anforderungen

---

## Leitprinzip

> NuVio Core ist kein Kundenprojekt.  
> Es ist ein Produkt — gebaut für viele Kunden,  
> skalierbar ohne Umbau,  
> verkaufbar ohne Erklärung.
