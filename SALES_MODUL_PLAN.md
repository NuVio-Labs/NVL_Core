# Sales-Modul für NuVio Core — Umsetzungsplan

> Internes Mini-CRM für NuVioLabs: Leads erfassen, Sales-Partner zuordnen,
> Kontaktverlauf, Follow-ups, Deals, Provisionen.
> Stand: 26.06.2026 · Spec von Axel, an Core-Architektur angepasst.

---

## WICHTIG — Anpassung an NuVio Core (nicht generisch bauen!)

Die Original-Spec war generisch. Für dieses Repo gilt:

| Spec sagt | In NuVio Core stattdessen |
|---|---|
| `tenant_id` | **`company_id`** (überall — Tabellen, RLS, Queries) |
| Routen `/t/[tenant]/sales` | **`/sales`, `/sales/leads`, …** (Mandant aus `activeCompanyId`, kein URL-Prefix) |
| Rollen generisch | **`admin`/`owner`** = voll, **`user`** (= Sales-Partner) nur eigene Leads. Über `permissions.ts` + `useCan()` |
| neue Patterns | bestehende nutzen: feature-Ordner `src/features/sales/`, Service+Hooks+Types wie bei `bookings`/`customers` |

Architektur-Vorbild: **`src/features/customers/`** (ähnlich einfach) für Aufbau von service/hooks/types, und **`src/features/bookings/`** für Dialoge/Listen.

---

## Datenmodell (5 Tabellen, alle mit `company_id` + RLS)

```
sales_partners
  id, company_id, profile_id (FK profiles), name, email, phone,
  default_commission_rate (numeric), max_commission_rate, is_active,
  created_at, updated_at

leads
  id, company_id, sales_partner_id (FK, nullable),
  company_name, contact_name, email, phone, website, industry, city,
  source, status (enum), priority (enum: low/medium/high),
  estimated_value (numeric), next_follow_up_at (timestamptz),
  last_contact_at, notes, created_at, updated_at, created_by

lead_activities
  id, company_id, lead_id (FK), type (enum: call/whatsapp/email/instagram/meeting/note),
  title, note, activity_at, created_by, created_at

deals
  id, company_id, lead_id (FK), sales_partner_id (FK),
  title, description, project_value (numeric), status (enum),
  probability (int 0-100), offer_sent_at, won_at, lost_at, lost_reason,
  created_at, updated_at

commissions
  id, company_id, deal_id (FK), sales_partner_id (FK),
  commission_rate (numeric), commission_amount (numeric),
  status (enum: pending/partially_due/due/paid/cancelled),
  due_at, paid_at, created_at, updated_at
```

**Enums:**
- `lead_status`: new, contacted, interested, meeting_scheduled, offer_needed, offer_sent, won, lost, follow_up_later
- `deal_status`: open, offer_sent, won, lost
- `commission_status`: pending, partially_due, due, paid, cancelled
- `activity_type`: call, whatsapp, email, instagram, meeting, note

**RLS-Kernregeln:**
- Alle Tabellen: Zeile gehört zu `company_id` des aktiven Mandanten (wie bestehende Policies).
- Sales-Partner (`role = user`): sieht/bearbeitet nur Leads/Deals/Provisionen, deren `sales_partner_id` zu seiner eigenen `sales_partners`-Zeile (via `profile_id = auth.uid()`) gehört.
- Admin/Owner: alles im Mandanten.
- Provisionen: nur Admin darf `status`/`paid_at` ändern (Sales-Partner nur lesen).

---

## Phasen

### Phase 1 — Lead-Pipeline (MVP, zuerst bauen)
1. Migration: `sales_partners`, `leads`, `lead_activities` + Enums + RLS
2. `src/features/sales/` anlegen: types, service, hooks (Muster: customers)
3. Sales-Partner Verwaltung (Liste + Dialog, nur Admin) — `/sales/partners`
4. Lead erstellen/bearbeiten/löschen (Dialog)
5. Lead-Liste mit Filter (Status, Sales-Partner, Priorität, Wiedervorlage) — `/sales/leads`
6. Lead-Detailseite: Stammdaten + Notizen + Aktivitäten — `/sales/leads/:id`
7. Aktivität hinzufügen (call/whatsapp/email/instagram/meeting/note)
8. Wiedervorlage setzen (`next_follow_up_at`)
9. „Heute nachfassen"-Ansicht (Leads mit fälligem Follow-up)
10. Sales-Partner sieht nur eigene Leads (RLS + useCan)
11. Nav-Eintrag „Vertrieb" (nur sichtbar mit Permission)
12. permissions.ts: neue Ressourcen `leads`, `sales_partners`, `deals`, `commissions`

### Phase 2 — Deals & Provisionen
- Deal aus Lead erstellen, project_value, probability
- Deal → won/lost
- Provision automatisch: `project_value * commission_rate` (nur auf bezahlten Projektumsatz!)
- Provisionsstatus pending → due → paid; Admin markiert „bezahlt"
- Sales-Partner sieht eigene Provisionen

### Phase 3 — später (NICHT im MVP)
- Sales-Dashboard mit KPI-Karten (neue Leads, offene Follow-ups, Pipeline-Wert, gewonnene Deals, offene Provisionen, Conversion)
- Lexware-Anbindung (Kontakt/Angebot/Rechnung/Zahlungsstatus)
- Reports, CSV-Export

### Bewusst WEGLASSEN (Scope-Disziplin)
E-Mail-Automation, KI-Lead-Scoring, Kalender-/WhatsApp-API, mehrere Pipelines, Trello-artiges Task-Management, Dokumentenverwaltung.

---

## Provisions-Regeln (wichtig)
- Provision NUR auf **tatsächlich bezahlten Projektumsatz**.
- KEINE Provision auf Hosting, Domains, Tools, externe Kosten.
- Start-Satz 10 %, Staffel später (12,5 / 15 / 17 %).
- Fällig, sobald Kunde bezahlt hat (später Split 50/50 Anzahlung/Schluss möglich).

---

## Geschätzter Aufwand
- Phase 1: ~1 größere Session (Migration + Modul-Grundgerüst + Lead-CRUD + Aktivitäten + Filter)
- Phase 2: ~1 weitere Session
- In **frischer Session** starten (`/clear`) — nicht im vollen Kontext.
