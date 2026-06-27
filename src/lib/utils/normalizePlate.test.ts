import { describe, it, expect } from 'vitest'
import { normalizePlate, isLicensePlateField } from './normalizePlate'

describe('normalizePlate', () => {
  it('macht groß und setzt Bindestriche bei Leerzeichen-Eingabe', () => {
    expect(normalizePlate('kle pl 977')).toBe('KLE-PL-977')
    expect(normalizePlate('KLE PL 977')).toBe('KLE-PL-977')
  })

  it('lässt korrekt formatierte Kennzeichen unverändert (bis auf Groß)', () => {
    expect(normalizePlate('KLE-PL-977')).toBe('KLE-PL-977')
    expect(normalizePlate('kle-pl-977')).toBe('KLE-PL-977')
  })

  it('trimmt und kollabiert Mehrfach-Trenner', () => {
    expect(normalizePlate('  KLE   PL   977 ')).toBe('KLE-PL-977')
    expect(normalizePlate('KLE--PL  977')).toBe('KLE-PL-977')
  })

  it('respektiert vorhandene Trenner als Blockgrenzen (rät nicht)', () => {
    // 1-Buchstaben-Mittelblock muss erhalten bleiben
    expect(normalizePlate('kle a 7924')).toBe('KLE-A-7924')
    // 2-stelliger Ort + 2-stellige Erkennung
    expect(normalizePlate('B AB 1234')).toBe('B-AB-1234')
    expect(normalizePlate('HH CD 42E')).toBe('HH-CD-42E')
  })

  it('zerlegt trennerlose Eingabe nach deutschem Schema', () => {
    expect(normalizePlate('klepl977')).toBe('KLE-PL-977')
    expect(normalizePlate('KLEPL977')).toBe('KLE-PL-977')
  })

  it('hält die CD/DC-Unterscheidung auseinander (echter PLT-Fall)', () => {
    expect(normalizePlate('kle cd 146')).toBe('KLE-CD-146')
    expect(normalizePlate('kle dc 146')).toBe('KLE-DC-146')
  })

  it('behandelt E-Kennzeichen (Elektro) korrekt', () => {
    expect(normalizePlate('m a 1e')).toBe('M-A-1E')
  })

  it('gibt leere/whitespace-Eingaben unverändert (getrimmt) zurück', () => {
    expect(normalizePlate('')).toBe('')
    expect(normalizePlate('   ')).toBe('')
  })

  it('zerstört unklare Eingaben nicht — nur Großschreibung', () => {
    expect(normalizePlate('12345')).toBe('12345')
    // mit Trenner: wird zwar verbunden, aber nichts geht verloren
    expect(normalizePlate('foo bar')).toBe('FOO-BAR')
  })
})

describe('isLicensePlateField', () => {
  it('erkennt Kennzeichen-Felder datengetrieben', () => {
    expect(isLicensePlateField('kennzeichen')).toBe(true)
    expect(isLicensePlateField('Kennzeichen')).toBe(true)
    expect(isLicensePlateField('kz')).toBe(true)
    expect(isLicensePlateField('nummernschild')).toBe(true)
  })

  it('erkennt andere Felder NICHT als Kennzeichen', () => {
    expect(isLicensePlateField('standort')).toBe(false)
    expect(isLicensePlateField('preis_gruppe')).toBe(false)
    expect(isLicensePlateField('homebase')).toBe(false)
    expect(isLicensePlateField('sitze')).toBe(false)
  })
})
