import { describe, it, expect } from 'vitest'
import { richtpreis24h } from './richtpreis'
import type { PublicPriceItem, PublicVehicle } from '../types'

// Fixtures = die echten PLT-Privat-Items (aus public_price_items, 02.07.2026).
// Deckt die Falle ab: gleicher Kern in verschiedenen Listen (B in PKW vs. B_LKW).
const PRICE_ITEMS: PublicPriceItem[] = [
  { priceListName: 'Preisliste Privatkunden PKW/9-Sitzer', itemName: 'A', tarif24std: '45' },
  { priceListName: 'Preisliste Privatkunden PKW/9-Sitzer', itemName: 'B', tarif24std: '55' },
  { priceListName: 'Preisliste Privatkunden PKW/9-Sitzer', itemName: 'C', tarif24std: '75' },
  { priceListName: 'Preisliste Privatkunden PKW/9-Sitzer', itemName: 'PKW_D', tarif24std: '140' },
  { priceListName: 'Preisliste Privatkunden PKW/9-Sitzer', itemName: 'PKW_E', tarif24std: '165' },
  { priceListName: 'Preisliste Privatkunden LKW/Transporter', itemName: 'Transporter_C', tarif24std: '120' },
  { priceListName: 'Preisliste Privatkunden LKW/Transporter', itemName: 'Transporter_D', tarif24std: '130' },
  { priceListName: 'Preisliste Privatkunden LKW/Transporter', itemName: 'Transporter_F', tarif24std: '160' },
  { priceListName: 'Preisliste Privatkunden LKW/Transporter', itemName: 'Transporter_G', tarif24std: '225' },
  { priceListName: 'Preisliste Privatkunden Anhänger', itemName: 'Anhaenger_Autotrailer', tarif24std: '85' },
  { priceListName: 'Preisliste Privatkunden Anhänger', itemName: 'Anhaenger_Koffer', tarif24std: '60' },
  { priceListName: 'Preisliste Privatkunden Anhänger', itemName: 'Anhaenger_Planeklein', tarif24std: '45' },
]

function vehicle(name: string, preisGruppe: string | null): PublicVehicle {
  return { id: name, name, preisGruppe, ahk: null, sitze: null }
}

describe('richtpreis24h', () => {
  it('PKW B_PKW → 55 € (PKW-Liste, Kern-Match)', () => {
    expect(richtpreis24h(vehicle('Fiat Tipo', 'B_PKW'), PRICE_ITEMS)).toBe(55)
  })

  it('Transporter C_Transporter → 120 € (Transporter-Liste)', () => {
    expect(richtpreis24h(vehicle('Citroen Jumper', 'C_Transporter'), PRICE_ITEMS)).toBe(120)
  })

  it('B_LKW landet NICHT beim PKW-B-Preis (55), sondern in der LKW/Transporter-Liste', () => {
    // Kategorie transporter → nur LKW/Transporter-Liste. Dort gibt es kein "B",
    // also kein Treffer → null (kein falscher 55-€-Preis aus der PKW-Liste).
    const p = richtpreis24h(vehicle('Ford Transit LKW 3,5t', 'B_LKW'), PRICE_ITEMS)
    expect(p).not.toBe(55)
    expect(p).toBeNull()
  })

  it('9-Sitzer E_PKW → 165 € (PKW_E via Kern)', () => {
    expect(richtpreis24h(vehicle('9-Sitzer Ford', 'E_PKW'), PRICE_ITEMS)).toBe(165)
  })

  it('exakter Item-Name: preis_gruppe "B" (Opel Meriva) → 55 €', () => {
    expect(richtpreis24h(vehicle('Opel Meriva', 'B'), PRICE_ITEMS)).toBe(55)
  })

  // Echte Kranenburg-Anhänger (aus public_vehicles): exakter Name-Match.
  it('Anhaenger_Autotrailer → 85 € (exakter Anhänger-Match)', () => {
    expect(richtpreis24h(vehicle('Autotrailer Kranenburg', 'Anhaenger_Autotrailer'), PRICE_ITEMS)).toBe(85)
  })

  it('Anhaenger_Planeklein → 45 € (exakter Anhänger-Match)', () => {
    expect(richtpreis24h(vehicle('Planenanhänger Kranenburg', 'Anhaenger_Planeklein'), PRICE_ITEMS)).toBe(45)
  })

  it('Transporter_F (Ford Transit LKW) → 160 € (exakt, Transporter-Liste)', () => {
    expect(richtpreis24h(vehicle('Ford Transit LKW 3,5t', 'Transporter_F'), PRICE_ITEMS)).toBe(160)
  })

  it('G_Transporter (MAN 7,5t) → 225 € (Kern-Match in Transporter-Liste)', () => {
    expect(richtpreis24h(vehicle('MAN 7,5t', 'G_Transporter'), PRICE_ITEMS)).toBe(225)
  })

  it('unbekannte Preisgruppe → null', () => {
    expect(richtpreis24h(vehicle('Egal', 'Z_Unbekannt'), PRICE_ITEMS)).toBeNull()
  })

  it('keine Preisgruppe → null', () => {
    expect(richtpreis24h(vehicle('Egal', null), PRICE_ITEMS)).toBeNull()
  })
})
