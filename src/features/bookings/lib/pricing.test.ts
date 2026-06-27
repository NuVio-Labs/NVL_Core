import { describe, it, expect } from 'vitest'
import {
  resourceCategory,
  matchPriceList,
  matchPriceClassItem,
  resolveTariff,
} from './pricing'
import type { Resource } from '@/features/resources/types'
import type { PriceList, PriceListItem } from '@/features/pricing/types'

// Kompakte Fixtures, abgeleitet aus echten PLT-Stammdaten. Decken bewusst die
// uneinheitlichen Schreibweisen ab, die die Matching-Logik beherrschen muss.

function resource(name: string, preis_gruppe: string, extra: Record<string, unknown> = {}): Resource {
  return {
    id: name, company_id: 'c', name, description: null, is_active: true,
    metadata: { preis_gruppe, ...extra }, created_by: null,
    created_at: '', updated_at: '',
  } as Resource
}

function list(id: string, name: string, is_active = true): PriceList {
  return { id, company_id: 'c', name, is_active, created_at: '', updated_at: '' } as unknown as PriceList
}

function item(name: string, metadata: Record<string, unknown>): PriceListItem {
  return { id: name, price_list_id: 'pl', name, metadata, created_at: '', updated_at: '' } as unknown as PriceListItem
}

const PREISGRUPPE = 'preis_gruppe'

const lists: PriceList[] = [
  list('pkw-privat', 'Preisliste Privatkunden PKW/9-Sitzer'),
  list('trans-privat', 'Preisliste Privatkunden LKW/Transporter'),
  list('anh-privat', 'Preisliste Privatkunden Anhänger'),
  list('pkw-gew', 'Preisliste Gewerbekunden PKW/9-Sitzer'),
  list('trans-gew', 'Preisliste Gewerbekunden LKW/Transporter'),
  list('anh-gew', 'Preisliste Gewerbekunden Anhänger'),
  list('inaktiv', 'Preisliste Privatkunden PKW alt', false),
]

const pkwItems: PriceListItem[] = [
  item('A', { tarif_24std: '45', tarif_7tage: '225', label: 'A' }),
  item('B', { tarif_24std: '55', tarif_7tage: '275', label: 'B' }),
  item('PKW_E', { tarif_24std: '165', tarif_7tage: '825', label: '9-Sitzer groß (E)' }),
]
const transItems: PriceListItem[] = [
  item('Transporter_C', { tarif_1h: '25', tarif_24std: '120', label: 'C – Transporter kurz' }),
  item('Transporter_G', { tarif_24std: '225', tarif_7tage: '1125', label: 'G – LKW 7,49t' }),
]
const anhItems: PriceListItem[] = [
  item('Anhaenger_Planeklein', { tarif_5h: '30', tarif_24std: '45', label: 'Plane klein' }),
  item('Anhaenger_Planegross', { tarif_5h: '35', tarif_24std: '55', label: 'Plane groß' }),
  item('Anhaenger_Koffer', { tarif_5h: '35', tarif_24std: '60', label: 'Koffer' }),
]

describe('resourceCategory', () => {
  it('erkennt Anhänger über die Preisgruppe', () => {
    expect(resourceCategory(resource('Plane Goch', 'Anhaenger_Planegross'), PREISGRUPPE)).toBe('anhaenger')
  })
  it('erkennt Transporter — auch wenn die Klasse vorne steht (G_Transporter)', () => {
    expect(resourceCategory(resource('MAN 7,5t', 'G_Transporter'), PREISGRUPPE)).toBe('transporter')
  })
  it('erkennt LKW-Gruppe als Transporter-Kategorie', () => {
    expect(resourceCategory(resource('Iveco', 'A_LKW'), PREISGRUPPE)).toBe('transporter')
  })
  it('fällt für PKW-Gruppen auf pkw zurück', () => {
    expect(resourceCategory(resource('Fiat Tipo', 'B_PKW'), PREISGRUPPE)).toBe('pkw')
    expect(resourceCategory(resource('9-Sitzer', 'E_PKW'), PREISGRUPPE)).toBe('pkw')
  })
  it('erkennt Anhänger auch nur über den Namen (ohne Gruppe)', () => {
    expect(resourceCategory(resource('Pferdeanhänger', ''), PREISGRUPPE)).toBe('anhaenger')
  })
})

describe('matchPriceList', () => {
  it('wählt Privat-PKW-Liste für PKW + Privatkunde', () => {
    expect(matchPriceList(lists, 'pkw', false)?.id).toBe('pkw-privat')
  })
  it('wählt Gewerbe-Anhänger-Liste für Anhänger + Gewerbe', () => {
    expect(matchPriceList(lists, 'anhaenger', true)?.id).toBe('anh-gew')
  })
  it('verwechselt Transporter NICHT mit PKW (includes-Bug-Regression)', () => {
    // "LKW/Transporter" enthält nicht "pkw" → muss Transporter-Liste treffen
    expect(matchPriceList(lists, 'transporter', false)?.id).toBe('trans-privat')
  })
  it('ignoriert inaktive Listen', () => {
    const onlyInactive = [list('inaktiv', 'Preisliste Privatkunden PKW/9-Sitzer', false)]
    expect(matchPriceList(onlyInactive, 'pkw', false)).toBeNull()
  })
})

describe('matchPriceClassItem', () => {
  it('matcht exakt (Anhaenger_Planegross)', () => {
    expect(matchPriceClassItem(anhItems, 'Anhaenger_Planegross')?.name).toBe('Anhaenger_Planegross')
  })
  it('matcht über den Kern: B_PKW ↔ Item "B"', () => {
    expect(matchPriceClassItem(pkwItems, 'B_PKW')?.name).toBe('B')
  })
  it('matcht über den Kern: E_PKW ↔ Item "PKW_E"', () => {
    expect(matchPriceClassItem(pkwItems, 'E_PKW')?.name).toBe('PKW_E')
  })
  it('matcht über den Kern: G_Transporter ↔ Item "Transporter_G"', () => {
    expect(matchPriceClassItem(transItems, 'G_Transporter')?.name).toBe('Transporter_G')
  })
  it('gibt undefined ohne verlässlichen Treffer (kein falscher Preis)', () => {
    expect(matchPriceClassItem(pkwItems, 'Z_PKW')).toBeUndefined()
    expect(matchPriceClassItem(pkwItems, undefined)).toBeUndefined()
  })
  it('verschiebt klein/groß NICHT (Planeklein ≠ Planegross)', () => {
    expect(matchPriceClassItem(anhItems, 'Anhaenger_Planeklein')?.name).toBe('Anhaenger_Planeklein')
    expect(matchPriceClassItem(anhItems, 'Anhaenger_Planegross')?.name).toBe('Anhaenger_Planegross')
  })
})

describe('resolveTariff', () => {
  const koffer = anhItems[2] // Anhaenger_Koffer: tarif_24std=60

  it('liest den 24h-Tarif als Basispreis', () => {
    expect(resolveTariff(koffer, 'tarif_24std', 1).calculatedPrice).toBe(60)
  })
  it('multipliziert den Basispreis mit dem Mehrtage-Faktor', () => {
    expect(resolveTariff(koffer, 'tarif_24std', 3).basePrice).toBe(180)
  })
  it('akzeptiert Komma als Dezimaltrenner', () => {
    const gewerbe = item('x', { tarif_24std: '50,42' })
    expect(resolveTariff(gewerbe, 'tarif_24std', 1).basePrice).toBeCloseTo(50.42)
  })
  it('addiert km-Paket pauschal (NICHT × Tage)', () => {
    const withKm = item('x', { tarif_24std: '60', km_300: '30' })
    const r = resolveTariff(withKm, 'tarif_24std', 3, 'km_300')
    expect(r.basePrice).toBe(180)
    expect(r.kmPrice).toBe(30)
    expect(r.calculatedPrice).toBe(210)
  })
  it('gibt null ohne Item, ohne Dauer-Feld oder ohne Tarifwert', () => {
    expect(resolveTariff(undefined, 'tarif_24std', 1).calculatedPrice).toBeNull()
    expect(resolveTariff(koffer, undefined, 1).calculatedPrice).toBeNull()
    expect(resolveTariff(koffer, 'tarif_1h', 1).calculatedPrice).toBeNull() // Anhänger hat keinen 1h-Tarif
  })
})

describe('Integration: Fahrzeug → Liste → Item → Preis (echte PLT-Fälle)', () => {
  const cases: Array<{ name: string; grp: string; cat: 'anhaenger' | 'transporter' | 'pkw'; items: PriceListItem[]; expect24h: number }> = [
    { name: 'Plane Goch', grp: 'Anhaenger_Planegross', cat: 'anhaenger', items: anhItems, expect24h: 55 },
    { name: 'Planenanhänger Kevelaer', grp: 'Anhaenger_Planeklein', cat: 'anhaenger', items: anhItems, expect24h: 45 },
    { name: 'Pferdeanhänger', grp: 'Anhaenger_Koffer', cat: 'anhaenger', items: anhItems, expect24h: 60 },
    { name: 'MAN 7,5t', grp: 'G_Transporter', cat: 'transporter', items: transItems, expect24h: 225 },
    { name: 'Fiat Tipo', grp: 'B_PKW', cat: 'pkw', items: pkwItems, expect24h: 55 },
  ]

  it.each(cases)('$name ($grp) liefert einen 24h-Preis', ({ name, grp, cat, items, expect24h }) => {
    const r = resource(name, grp)
    expect(resourceCategory(r, PREISGRUPPE)).toBe(cat)
    const pl = matchPriceList(lists, cat, false)
    expect(pl).not.toBeNull()
    const matched = matchPriceClassItem(items, grp)
    expect(matched).toBeDefined()
    const price = resolveTariff(matched, 'tarif_24std', 1).calculatedPrice
    expect(price).toBe(expect24h)
  })
})
