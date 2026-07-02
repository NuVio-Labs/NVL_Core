import { categorize, priceListMatchesCategory, stripCategory } from '@/features/bookings/lib/pricing'
import type { PublicPriceItem, PublicVehicle } from '../types'

// Richtpreis-Ermittlung für die öffentliche Buchung. Nutzt bewusst die
// vorhandene Kategorie-/Match-Logik aus pricing.ts (keine doppelte Preislogik),
// angewandt auf die reduzierten Public-Preis-Items. Ergebnis ist der 24h-Tarif
// als "ab"-Richtpreis — unverbindlich, nur informativ.
//
// WICHTIG (wie in der App): erst die passende Preisliste per Kategorie wählen,
// dann NUR in deren Items nach der Preisgruppe suchen. Sonst würde z.B. "B_LKW"
// fälschlich den PKW-"B"-Preis treffen (gleicher Kern "b", andere Liste).

function matchItem(
  items: PublicPriceItem[],
  preisGruppe: string | null,
): PublicPriceItem | undefined {
  if (!preisGruppe) return undefined
  const pg = preisGruppe.trim().toLowerCase()

  const exact = items.find((it) => it.itemName.trim().toLowerCase() === pg)
  if (exact) return exact

  const pgCore = stripCategory(pg)
  if (pgCore) {
    const byCore = items.find((it) => stripCategory(it.itemName) === pgCore)
    if (byCore) return byCore
  }
  return undefined
}

/**
 * 24h-Richtpreis eines Fahrzeugs, oder null wenn kein verlässlicher Treffer
 * (dann zeigt das UI keinen Preis — kein falscher „ab"-Wert).
 */
export function richtpreis24h(
  vehicle: PublicVehicle,
  priceItems: PublicPriceItem[],
): number | null {
  if (!vehicle.preisGruppe) return null

  // 1) Kategorie aus Name + Preisgruppe (gleiche Regel wie App).
  const category = categorize(vehicle.name, vehicle.preisGruppe)

  // 2) Nur Items der zur Kategorie passenden Privat-Liste betrachten.
  const itemsInCategory = priceItems.filter((it) =>
    priceListMatchesCategory(it.priceListName, category),
  )

  // 3) Innerhalb dieser Liste nach Preisgruppe matchen.
  const item = matchItem(itemsInCategory, vehicle.preisGruppe)
  if (!item?.tarif24std) return null

  const val = Number(String(item.tarif24std).replace(',', '.'))
  return Number.isFinite(val) && val > 0 ? val : null
}
