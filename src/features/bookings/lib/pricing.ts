import type { Resource } from '@/features/resources/types'
import type { PriceList, PriceListItem } from '@/features/pricing/types'

/**
 * Reine Preis-/Matching-Logik für Buchungen — extrahiert aus BookingDialog,
 * damit sie testbar und an einer Stelle nachvollziehbar ist. Verhalten ist
 * identisch zur bisherigen Inline-Logik (kein fachlicher Eingriff).
 *
 * Hintergrund: Die PLT-Stammdaten sind uneinheitlich (Gruppen wie "B_PKW",
 * "C_Transporter", Items "B"/"PKW_E"/"Transporter_C"). Die Zuordnung läuft
 * deterministisch mit klarer Priorität — KEIN unscharfes Teil-Token-Matching,
 * das die falsche Gruppe treffen könnte.
 */

export type ResourceCategory = 'anhaenger' | 'transporter' | 'pkw'

/** Liest die Preisgruppe einer Ressource (datengetriebener Feldname). */
function readPreisgruppe(resource: Resource, preisgruppeFeld: string): string {
  const meta = (resource.metadata ?? {}) as Record<string, unknown>
  return String(meta[preisgruppeFeld] ?? meta.preis_gruppe ?? '')
}

/**
 * Bestimmt die grobe Kategorie eines Fahrzeugs. Wichtig: Gruppen-Wörter können
 * in beliebiger Reihenfolge stehen ("Transporter_F" UND "G_Transporter") →
 * mit `includes` prüfen, sonst landet ein Transporter fälschlich in der
 * PKW-Liste.
 */
export function resourceCategory(resource: Resource, preisgruppeFeld: string): ResourceCategory {
  const name = resource.name.toLowerCase()
  const gruppe = readPreisgruppe(resource, preisgruppeFeld).toLowerCase()
  if (gruppe.includes('anhaenger') || gruppe.includes('anhänger') || name.includes('anhänger') || name.includes('anhaenger')) return 'anhaenger'
  if (gruppe.includes('transporter') || gruppe.includes('lkw')) return 'transporter'
  return 'pkw'
}

/**
 * Wählt die passende Preisliste anhand Kategorie + Kundentyp. Privat vs.
 * Gewerbe wird über den Listennamen erkannt.
 */
export function matchPriceList(
  priceLists: PriceList[],
  category: ResourceCategory,
  isGewerbe: boolean,
): PriceList | null {
  return priceLists.find((pl) => {
    if (!pl.is_active) return false
    const n = pl.name.toLowerCase()
    const typeMatch = isGewerbe ? n.includes('gewerbe') : n.includes('privat')
    if (!typeMatch) return false
    if (category === 'anhaenger') return n.includes('anhänger') || n.includes('anhaenger')
    if (category === 'transporter') return n.includes('lkw') || n.includes('transporter')
    return n.includes('pkw') || n.includes('9-sitzer')
  }) ?? null
}

/** Entfernt Kategorie-Wörter → Kern (z.B. nur der Klassenbuchstabe). */
function stripCategory(s: string): string {
  return s
    .toLowerCase()
    .replace(/pkw|9-?sitzer|lkw|transporter|anh(ae|ä)nger/g, '')
    .replace(/[_\s]+/g, '')
    .trim()
}

/**
 * Findet das Preislisten-Item zur Preisgruppe eines Fahrzeugs.
 * Priorität: 1) exakter Name, 2) gleicher Kern nach Entfernen der Kategorie
 * (B_PKW ↔ B, E_PKW ↔ PKW_E, C_Transporter ↔ Transporter_C). Kein
 * verlässlicher Treffer → bewusst `undefined` (kein falscher Preis).
 */
export function matchPriceClassItem(
  priceListItems: PriceListItem[],
  preisgruppe: string | undefined,
): PriceListItem | undefined {
  if (!preisgruppe) return undefined
  const pg = preisgruppe.trim().toLowerCase()

  const exact = priceListItems.find((it) => it.name.trim().toLowerCase() === pg)
  if (exact) return exact

  const pgCore = stripCategory(pg)
  if (pgCore) {
    const byCore = priceListItems.find((it) => stripCategory(it.name) === pgCore)
    if (byCore) return byCore
  }

  return undefined
}

export interface TariffResult {
  basePrice: number | null
  kmPrice: number | null
  calculatedPrice: number | null
}

/**
 * Berechnet den Preis aus dem Tarif-Feld des Items × Dauer-Faktor, plus
 * optionalem km-Paket (pauschal, NICHT × Tage). Fehlt der Tarif → alles null.
 */
export function resolveTariff(
  item: PriceListItem | undefined,
  durationFieldName: string | undefined,
  durationFactor: number,
  kmPackageField?: string,
): TariffResult {
  const empty: TariffResult = { basePrice: null, kmPrice: null, calculatedPrice: null }
  if (!item || !durationFieldName) return empty

  const itemMeta = (item.metadata ?? {}) as Record<string, unknown>
  const val = itemMeta[durationFieldName]
  if (val === undefined || val === null || val === '') return empty

  const base = Number(String(val).replace(',', '.')) * durationFactor

  let km: number | null = null
  if (kmPackageField && itemMeta[kmPackageField] !== undefined) {
    const kmVal = String(itemMeta[kmPackageField]).replace(',', '.')
    km = Number(kmVal)
    if (isNaN(km)) km = null
  }

  return { basePrice: base, kmPrice: km, calculatedPrice: base + (km ?? 0) }
}
