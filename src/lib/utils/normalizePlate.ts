/**
 * Normalisiert ein Kfz-Kennzeichen auf einheitliche Schreibweise:
 * GROSSBUCHSTABEN und Bindestriche zwischen den Blöcken (z.B. "kle pl 977"
 * oder "KLE PL 977" → "KLE-PL-977").
 *
 * Hintergrund: Kennzeichen wurden teils mit Leerzeichen, teils mit Bindestrich
 * erfasst (z.B. "KLE DC 146" vs. "KLE-CD-146"). Uneinheitliche Schreibweisen
 * erschweren Abgleich und Suche. Diese Funktion erzwingt ein konsistentes
 * Format an der Eingabequelle (Ressourcen-Formular).
 *
 * Bestehende Trenner (Leerzeichen/Bindestrich) werden als Blockgrenzen
 * respektiert — es wird NICHT geraten, wo Ort/Erkennung/Nummer liegen, solange
 * der Nutzer es durch Trenner vorgegeben hat. Nur bei komplett trennerloser
 * Eingabe ("klepl977") wird das deutsche Standardschema (Ort 1–3, Erkennung
 * 1–2, Nummer 1–4 + optional "E") herangezogen. Lässt sich kein Schema
 * erkennen, wird der Wert nur großgeschrieben — niemals zerstört.
 */
export function normalizePlate(value: string): string {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  // Hat bereits Trenner → diese als Blockgrenzen übernehmen.
  if (/[\s-]/.test(trimmed)) {
    return trimmed.toUpperCase().split(/[\s-]+/).filter(Boolean).join('-')
  }

  // Trennerlos → nach deutschem Schema in drei Blöcke zerlegen.
  const upper = trimmed.toUpperCase()
  const match = upper.match(/^([A-ZÄÖÜ]{1,3})([A-Z]{1,2})(\d{1,4}E?)$/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`

  // Unklares Format → wenigstens großschreiben, Wert beibehalten.
  return upper
}

/** Feldname-Heuristik: Erkennt das Kennzeichen-Feld datengetrieben. */
export function isLicensePlateField(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('kennzeichen') || n === 'kz' || n.includes('nummernschild')
}
