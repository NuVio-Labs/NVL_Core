-- ============================================================
-- NuVio Core — Contracts DSGVO / PAuswG Korrekturen
-- ============================================================

-- 1. returned_by: UUID-FK auf profiles → Freitext
--    Grund: Mitarbeiter der Rückgabe muss kein Systemmitglied sein.
--    FK-Lösung führt bei Mitarbeiter-Austritt zu Informationsverlust
--    im Rechtsgeschäft (set null überschreibt Vertragsdaten).
alter table public.contracts
  drop column if exists returned_by;

alter table public.contracts
  add column returned_by text;

-- 2. Aufbewahrungspflicht: Spalten für Löschfrist-Markierung
--    § 257 HGB: 6 Jahre / § 147 AO: 10 Jahre
--    retention_delete_after: berechnetes Datum, ab dem gelöscht werden darf
--    retention_category: 'hgb' | 'ao' | 'custom'
alter table public.contracts
  add column if not exists retention_category text
    check (retention_category in ('hgb', 'ao', 'custom'))
    default 'hgb';

alter table public.contracts
  add column if not exists retention_delete_after date;

-- Trigger: retention_delete_after automatisch setzen wenn Vertrag abgeschlossen wird
create or replace function set_contract_retention()
returns trigger
language plpgsql
as $$
begin
  -- Nur setzen wenn Status auf 'completed' oder 'cancelled' wechselt
  -- und noch kein Wert gesetzt ist
  if (NEW.status in ('completed', 'cancelled')) and OLD.status not in ('completed', 'cancelled') then
    if NEW.retention_delete_after is null then
      NEW.retention_delete_after := case NEW.retention_category
        when 'ao'  then (now() + interval '10 years')::date
        when 'hgb' then (now() + interval '6 years')::date
        else            (now() + interval '6 years')::date
      end;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger contracts_set_retention
  before update on public.contracts
  for each row execute function set_contract_retention();

-- 3. OCR Consent Log: Struktur dokumentieren als Check
--    Erlaubte Felder: { consented_at, consented_by_profile_id, document_type, fields_extracted[] }
--    Kein Bildinhalt, keine Ausweisnummer — nur Nachweis der Zustimmung
--    (wird im OCR-Flow befüllt, hier nur Kommentar zur Struktur)

comment on column public.contracts.ocr_consent_log is
  'DSGVO-Nachweislog für OCR-Scan. Struktur: { consented_at: timestamptz, consented_by: uuid, document_type: text, fields_extracted: text[] }. Kein Bildinhalt, keine Ausweisnummer (PAuswG § 20).';

comment on column public.contracts.id_number is
  'Ausweis-Dokumentennummer. PAuswG § 20: Speicherung nur mit expliziter Einwilligung zulässig. Nicht für Personalausweis-Seriennummern verwenden. Nur Dokumententyp + Ablaufdatum ist rechtssicher ohne Einwilligung.';

comment on column public.contracts.second_renter is
  'JSONB: ContractSecondRenter { first_name, last_name, phone?, street?, city?, date_of_birth?, id_number?, license_class?, license_number? }. Gilt dieselben Datenschutzregeln wie Mieter 1.';

comment on column public.contracts.retention_delete_after is
  'DSGVO Art. 17 + § 257 HGB / § 147 AO: Datum ab dem dieser Vertrag gelöscht werden darf. Wird automatisch bei Abschluss/Stornierung gesetzt.';
