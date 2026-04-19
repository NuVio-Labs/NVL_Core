# NVL Core

## Was ist NuVio Core

NuVio Core ist der gemeinsame, branchenneutrale Betriebskern der NuVio Plattform.

Core ist nicht als Einzellösung für einen bestimmten Kunden gedacht, sondern als sauberes, skalierbares und mandantenfähiges SaaS Fundament, auf dem später spezialisierte Produkte wie zum Beispiel NuVio Fleet aufbauen können.

Das Ziel ist eine professionelle Multi Tenant Plattform, die sich für Agenturvertrieb, White Label Ansätze, individuelle Kundenanpassungen und spätere vertikale Branchenlösungen eignet, ohne dass für jeden Kunden eigene Sonderlogik im Frontend entsteht.

## Zielbild

NuVio Core soll sich wie ein hochwertiges, produktisierbares Betriebssystem für Unternehmensprozesse verhalten.

Im Mittelpunkt stehen:

- klare Mandantentrennung
- saubere Rollen und Rechte
- strukturierte Datenlogik
- modulare Erweiterbarkeit
- nachvollziehbare Prozesse
- wartbare Architektur
- datengetriebene Steuerung statt harter Sonderpfade

Core soll nicht nur funktional sein, sondern strukturell richtig aufgebaut werden, damit daraus langfristig ein verkaufbares SaaS Produkt entstehen kann.

## Kernaufgabe von Core

NuVio Core bündelt alle allgemeinen Funktionen, die unabhängig von einer speziellen Branche oder einem Spezialprodukt in fast jedem Mandanten gebraucht werden.

Dazu gehören insbesondere:

- Authentifizierung und Session Handling
- Workspace mit aktivem Mandantenkontext
- Benutzer, Memberships, Rollen und Berechtigungen
- Kundenverwaltung
- Ressourcenverwaltung
- Preislisten und Preislogik
- Buchungen und Kalenderlogik
- Standorte und Übergabepunkte
- Vertrags und Dokumentenbasis
- Uploads und Dateiverwaltung
- OCR und Dokumentenerkennung mit Bestätigungsworkflow
- Abrechnungsgrundlagen
- auditierbare Änderungslogik
- Einstellungen pro Mandant
- optionale White Label und Agenturkonfiguration

## Architekturprinzipien

NuVio Core folgt klaren Architekturregeln, damit das System langfristig sauber bleibt.

### 1. Multi Tenant ist Fundament
Mandantenfähigkeit ist kein Zusatz, sondern Kern des Systems.

Jeder fachliche Datensatz soll sauber an einen Mandanten gebunden sein. Die zentrale fachliche Wahrheit läuft über:

- company_id
- slug
- memberships
- activeCompany
- activeRole

### 2. Workspace ist der zentrale Zugriffskontext
Workspace bildet die Einstiegsschicht für den aktiven Mandanten, die aktive Rolle und die gültige Membership.

Zentrale Zustände sind:

- activeCompanyId
- activeCompany
- activeMembership
- activeRole

Auf dieser Basis werden Rechte, Sichtbarkeit, Filterung und fachlicher Kontext konsistent gesteuert.

### 3. Keine harte Sonderlogik für einzelne Kunden
Unterschiede zwischen Kunden sollen nicht durch Sonderpfade im Frontend gelöst werden.

Stattdessen sollen Unterschiede über folgende Mittel steuerbar sein:

- Konfiguration
- Datenmodell
- Module
- Rollen
- Preislisten
- Mandanteneinstellungen

### 4. Klare fachliche Trennung
Core trennt sauber zwischen:

- Domain
- Datenzugriff
- Applikationslogik
- UI

UI Komponenten sollen präsentationsnah bleiben. Geschäftslogik gehört nachvollziehbar in Services, Mapper, Validierungen und fachliche Schichten.

### 5. Datengetriebene Produktlogik
Preise, Ressourcen, Standorte, Verfügbarkeiten, Buchungsregeln und Dokumentendaten sollen möglichst datengetrieben modelliert sein.

Dauerhaft harte Frontend Logik ist zu vermeiden.

### 6. Kleine, sichere und wartbare Änderungen
Core wird nicht über breite Umbauten entwickelt, sondern über kleine, kontrollierte und nachvollziehbare Schritte.

Bestehende Muster, Services, Hooks, Types und Queries sollen gezielt erweitert statt durch Parallelstrukturen ersetzt werden.

## Was Core enthalten soll

## 1. Plattform Fundament

- Login und Session Handling
- Workspace Aufbau
- Mandantenkontext
- aktive Membership Ermittlung
- Rollenbasierte Zugriffslogik
- Plattform Admin und Tenant Admin Trennung

## 2. Benutzer und Rechte

- Benutzerverwaltung
- Membership Verwaltung
- Rollenmodell
- Rechte und Guards
- spätere Grundlage für feingranulare Freigaben

## 3. Stammdaten

- Kunden
- Ressourcen
- Standorte
- Übergabepunkte
- Preislisten
- Preislisteneinträge
- Mandanteneinstellungen

## 4. Operative Prozesse

- Buchungen
- Kalender
- Verfügbarkeiten
- Konfliktlogik
- fachliche Regeln rund um Ressourcen und Preislogik

## 5. Verträge und Dokumente

- allgemeine Vertragsbasis
- strukturierte Dokumentendaten
- Dokumentengenerierung als Grundlage
- Uploads
- Dateiverwaltung
- OCR Erkennung mit manueller Prüfung und Bestätigung

## 6. Nachvollziehbarkeit und Abrechnung

- Abrechnungsgrundlagen
- auditierbare Änderungen
- nachvollziehbare Status und Prozesszustände
- konsistente Datenübergaben ohne doppelte Wahrheiten

## 7. Technische Basisschichten

- Supabase als Daten und Auth Grundlage
- konsistente Queries
- konsistente Types
- Mapper zwischen Datenmodell und UI
- Validation
- Query Handling
- Error Handling
- vorbereitete Integrationspunkte für Mail, Storage, OCR, Dokumente und externe APIs

## Fehlende Module mit Mehrwert (Roadmap)

### Audit-Log
- Jede fachlich relevante Änderung (Buchung, Vertrag, Ressource, Preisliste) wird protokolliert
- Tabelle `audit_logs`: `entity_type`, `entity_id`, `action`, `changed_by`, `changed_at`, `diff` (JSONB)
- Im UI: "Änderungshistorie" pro Datensatz aufklappbar
- Pflicht für professionelle Mandanten (Haftung, Streitfälle)
- Mandantenfähig, RLS-gesichert

### Standortverwaltung
- Aktuell ist `standort` ein freies Textfeld in resource metadata
- Verbesserung: eigene Tabelle `locations` pro Mandant (Name, Adresse, Koordinaten)
- Ressourcen, Buchungen, Verträge referenzieren echte Standort-IDs
- Ermöglicht später: Standort-Filter, Standort-Dashboard, Routen

### Benachrichtigungen / Notifications
- In-App Benachrichtigungen für relevante Ereignisse:
  - HU läuft in 30 Tagen ab
  - Fahrzeug heute nicht zurückgekommen
  - Sonderabrechnung wurde erstellt
  - Neuer Mitarbeiter hat Onboarding abgeschlossen
- Tabelle `notifications`: `company_id`, `profile_id`, `type`, `payload`, `read_at`
- Bell-Icon in Header mit Unread-Badge

### Reporting / Auswertungen
- Einfache Auswertungen pro Mandant:
  - Umsatz pro Monat / Quartal / Jahr
  - Auslastung pro Fahrzeug (% der Zeit vermietet)
  - Buchungen pro Standort
  - Häufigste Kunden
- Export als CSV
- Grundlage für spätere Dashboard-Erweiterungen

### Kundenprofil-Anreicherung
- Aktuell werden Kundendaten nur pro Buchung erfasst
- Verbesserung: Kundenprofil (`customers`) wird beim Vertrag angelegt/verknüpft
- Führerschein + Ausweisdaten werden am Kundenprofil gespeichert (OCR einmal, dann wiederverwendbar)
- Beim nächsten Vertrag: Felder automatisch vorausgefüllt aus Kundenprofil

### Wartungsmodul (Fahrzeuge)
- Neben HU: allgemeine Wartungseinträge pro Fahrzeug
- Tabelle `maintenance_records`: Datum, Art (Inspektion / Reifenwechsel / Reparatur), Kosten, Notizen
- Im Ressourcen-Detail sichtbar
- Warnung wenn Wartung überfällig

### E-Mail-Benachrichtigungen (Phase 2)
- Supabase Edge Function + Resend / Postmark
- Triggers: Buchungsbestätigung, Vertragsabschluss, HU-Warnung
- Template pro Mandant konfigurierbar
- Feature-Flag in `company.settings.email_notifications`

---

## Was bewusst nicht in Core gehört

Core soll bewusst frei von branchenspezifischer Sonderlogik bleiben.

Nicht in Core gehören:

- kundenspezifische Frontend Sonderpfade
- fest verstreute Preislogik im Frontend
- branchenspezifische UI Workarounds
- harte Sonderbehandlungen für einzelne Mandanten
- doppelte Zustände oder doppelte Wahrheiten
- unnötige neue Patterns ohne klaren Mehrwert
- spekulative Umbauten ohne direkten Nutzen

## Verhältnis zu späteren Produkten wie Fleet

NuVio Core ist die gemeinsame Plattformbasis.

Produkte wie NuVio Fleet sollen später nicht als separate Insellösungen entstehen, sondern als vertikale Erweiterungen auf dem Core aufsetzen.

Das bedeutet:

Core enthält die allgemeinen Funktionen wie:

- Workspace
- Benutzer und Rollen
- Kunden
- Ressourcen
- Buchungen
- Preislisten
- Dokumente
- Uploads
- Rechte
- Einstellungen

Fleet ergänzt darauf nur die branchenspezifische Fachlogik, zum Beispiel:

- fahrzeugspezifische Ressourcenfelder
- Fahrzeugzustand
- Schadendokumentation
- Führerschein und Ausweis Workflows
- Übergabe und Rückgabeprozesse
- Mietvertragsbesonderheiten
- fahrzeugbezogene Preis und Verfügbarkeitslogik

So bleibt der Core sauber, wiederverwendbar und skalierbar.

## Qualitätsstandard

Jede Änderung an NuVio Core soll folgende Anforderungen erfüllen:

- mandantenfähig
- fachlich nachvollziehbar
- strukturell sauber
- wartbar
- testfreundlich
- risikoarm
- konsistent mit bestehender Architektur

Wichtiger als schnelle Funktionserweiterung ist, dass jede Erweiterung in das Gesamtmodell passt.

## Leitprinzip

Jede Änderung an NuVio Core muss das Produkt näher an eine hochwertige, verkaufbare, agenturfähige und skalierbare SaaS Plattform bringen.

Nicht nur funktional richtig.

Sondern strukturell richtig.