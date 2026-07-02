// Öffentliche Sicht auf eine Station — nur die Felder, die ein Gast sehen darf.
// Bewusst KEINE internen Felder (id-Streuung, notes, is_active-Interna).
// Etappe 3 füllt das aus der public_stations-View; Etappe 2 nutzt statische Daten.
export interface PublicStation {
  /** URL-Slug der Station (z.B. "kranenburg"). */
  slug: string
  /** Anzeigename der Station (z.B. "Kranenburg"). */
  name: string
  /** Adresse für Anzeige / "telefonisch buchen"-Kontext. */
  address: string | null
  /** Telefonnummer der Station (tel:-Link im Beta-/Fallback-Fall). */
  phone: string | null
  /**
   * Pilot-Flag: true = voller Online-Flow, false = Beta-Hinweis + Anruf-Button.
   * Wird serverseitig in der RPC erneut geprüft (UI-Wert ist nur Anzeige).
   */
  onlineBookingEnabled: boolean
}

// Öffentliche Sicht auf die Firma, deren Stationen buchbar sind.
export interface PublicCompany {
  slug: string
  name: string
  /** Mindestvorlauf in Stunden für den frühesten Startzeitpunkt (Default 72). */
  leadHours: number
}

// Öffentliche Sicht auf ein Fahrzeug einer Station — OHNE Kennzeichen/interne
// Felder. preis_gruppe dient dem Richtpreis-Match (Frontend, pricing.ts).
export interface PublicVehicle {
  id: string
  name: string
  preisGruppe: string | null
  /** Anhängerkupplung — als Rohwert aus metadata (true/false/"Maul"/…). */
  ahk: string | null
  sitze: number | null
}

// Ein Privat-Preislisten-Item, reduziert auf das, was der Richtpreis braucht.
export interface PublicPriceItem {
  priceListName: string
  itemName: string
  /** 24h-Tarif als Rohstring (z.B. "55" oder "50,42"). */
  tarif24std: string | null
}
