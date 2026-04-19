-- ============================================================
-- NuVio Core — Contracts Migration
-- Vertragsmodul: contracts Tabelle + RLS + Hilfsfunktion
-- ============================================================

-- ─── Tabelle ─────────────────────────────────────────────────

create table public.contracts (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  booking_id            uuid references public.bookings(id) on delete set null,
  resource_id           uuid references public.resources(id) on delete set null,

  -- Vertragsnummer (pro Mandant laufend, per DB-Funktion vergeben)
  contract_number       integer not null,

  -- Mieterdaten Mieter 1
  first_name            text not null,
  last_name             text not null,
  phone                 text,
  street                text,
  city                  text,
  profession            text,
  employer              text,
  id_number             text,
  id_issued_at          text,
  date_of_birth         date,
  place_of_birth        text,
  license_class         text,
  license_number        text,
  license_issued_in     text,
  license_issued_at     date,

  -- Mieter 2 optional als JSONB
  second_renter         jsonb,

  -- Fahrzeug & Zeiten
  handover_at           timestamptz,
  handover_location     text,
  return_agreed_at      timestamptz,
  return_actual_at      timestamptz,
  return_location       text,
  extended_until        timestamptz,

  -- Kilometerstand
  km_start              integer,
  km_end                integer,
  km_free               integer,

  -- Preise (Snapshot zum Zeitpunkt der Vertragserstellung)
  price_per_km          numeric(10,4),
  price_per_day         numeric(10,4),
  price_base            numeric(10,4),
  tax_rate              numeric(5,2) default 19.00,

  -- Zusatzoptionen
  extras                jsonb not null default '{}',

  -- Checkboxen Fahrzeugzustand bei Übergabe
  loading_gate          boolean default false,
  tachograph            boolean default false,
  tank_full             boolean default false,
  damage                boolean default false,
  damage_notes          text,

  -- Rückgabe
  tank_return_full      boolean,
  returned_by           uuid references public.profiles(id) on delete set null,

  -- Zahlungen
  advance_rent          numeric(10,2),
  advance_deposit       numeric(10,2),
  payment_status        text not null default 'open'
                          check (payment_status in ('open', 'partial', 'paid')),
  payment_method        text check (payment_method in ('cash', 'card', 'transfer')),

  -- Kreditkarte: KEIN PAN — nur letzte 4 Stellen optional
  credit_card_last4     char(4),

  -- Sonstiges
  notes                 text,

  -- OCR Consent Log (kein Bildinhalt — nur Nachweis)
  ocr_consent_log       jsonb,

  -- PDF nach Generierung
  pdf_url               text,

  -- Sonderpreise (nur Admin)
  price_override        numeric(10,2),
  price_override_reason text,
  price_override_by     uuid references public.profiles(id) on delete set null,
  price_override_at     timestamptz,

  -- Archivierung / Sperrung
  is_locked             boolean not null default false,
  archived_at           timestamptz,

  -- Status
  status                text not null default 'draft'
                          check (status in ('draft', 'active', 'completed', 'cancelled')),

  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Unique: Vertragsnummer pro Mandant ──────────────────────
alter table public.contracts
  add constraint contracts_number_per_company unique (company_id, contract_number);

-- ─── Hilfsfunktion: nächste Vertragsnummer pro Mandant ───────
create or replace function next_contract_number(p_company_id uuid)
returns integer
language sql
volatile
security definer
as $$
  select coalesce(max(contract_number), 0) + 1
  from public.contracts
  where company_id = p_company_id;
$$;

-- ─── Indexes ─────────────────────────────────────────────────
create index contracts_company_id_idx on public.contracts (company_id);
create index contracts_booking_id_idx on public.contracts (booking_id);
create index contracts_resource_id_idx on public.contracts (resource_id);
create index contracts_status_idx on public.contracts (status);
create index contracts_created_at_idx on public.contracts (created_at desc);

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.contracts enable row level security;

-- SELECT: eigene Company-Mitglieder dürfen lesen
create policy "contracts_select" on public.contracts
  for select using (
    is_platform_owner()
    or company_id in (
      select company_id from public.memberships
      where profile_id = auth.uid() and status = 'active'
    )
  );

-- INSERT: editor und admin dürfen anlegen
create policy "contracts_insert" on public.contracts
  for insert with check (
    is_platform_owner()
    or get_my_role(company_id) in ('admin', 'editor', 'user')
  );

-- UPDATE: editor+ dürfen bearbeiten, gesperrte Verträge nur Admin
create policy "contracts_update" on public.contracts
  for update using (
    is_platform_owner()
    or (
      get_my_role(company_id) in ('admin', 'editor')
      and (not is_locked or get_my_role(company_id) = 'admin')
    )
  );

-- DELETE: nur Admin (wirklich löschen — besser archivieren)
create policy "contracts_delete" on public.contracts
  for delete using (
    is_platform_owner()
    or get_my_role(company_id) = 'admin'
  );
