# Fahrzeug-Preisgruppen – Korrekturen (PLT)

> Stand: 26.06.2026 · DB gegen offizielle Preislisten (gültig ab 01.08.2024) geprüft.
>
> **Wichtigstes Ergebnis:** Die Preis-Tarife in der DB stimmen **vollständig** mit den
> offiziellen Listen überein. Es fehlt **kein** Tarif. Das Problem sind **falsche
> Preisgruppen an einzelnen Fahrzeugen** – reine Fahrzeug-Stammdatenpflege.

---

## Hintergrund: Die offizielle Liste kennt kein „LKW"

Laut Papier-Preisliste gibt es nur die Gruppen **A–G** (Transporter/Lkw) bzw. **A–E** (Pkw)
und die Anhänger-Typen. Dabei gilt:

- **Gruppe F** = „Transporter 3,5t Ladebordwand"
- **Gruppe G** = „LKW 7,49t Ladebordwand"

→ Die in der DB stehenden Gruppen `A_LKW` / `B_LKW` existieren in der echten Preisliste **gar nicht**.
Die betroffenen Fahrzeuge gehören in **G** (7,5-Tonner) bzw. **F** (3,5t Transporter).

Die Zuordnung im System läuft über den **Klassenbuchstaben** (Kategorie-Wort wird ignoriert):
`G_Transporter` → Tarif `Transporter_G` ✅

---

## ✅ Bereits korrekt (kein Handlungsbedarf)

| Preisgruppe | Tarif | Werte stimmen mit Liste |
|---|---|---|
| `A_PKW`…`C_PKW` | A / B / C | ✅ |
| `D_PKW` (9-Sitzer klein) | PKW_D | ✅ 140€ / 700€ / 2100€ |
| `E_PKW` (9-Sitzer groß) | PKW_E | ✅ 165€ / 825€ / 2475€ |
| `C_Transporter` | Transporter_C | ✅ 120€ |
| `Transporter_E` | Transporter_E | ✅ |
| `Transporter_F` | Transporter_F | ✅ |

---

## ✅ 1. „LKW"-Fahrzeuge umgestellt (5 Stück) — ERLEDIGT

Bereits durch Claude per service_role gesetzt:

| Fahrzeug | Kennzeichen | alt | → neu |
|---|---|---|---|
| [x] Iveco 7,5t | KLE-PL-357 | `A_LKW` | `G_Transporter` ✅ |
| [x] MAN 7,5t | KLE-PL-557 | `A_LKW` | `G_Transporter` ✅ |
| [x] MAN 7,5t | KLE-PL-457 | `A_LKW` | `G_Transporter` ✅ |
| [x] MAN 7,5t | KLE-PL-657 | `A_LKW` | `G_Transporter` ✅ |
| [x] Ford Transit LKW 3,5t | GEL-PL-437 | `B_LKW` | `F_Transporter` ✅ |

> ⚠️ Bitte gegenprüfen: 7,5-Tonner = „LKW 7,49t" (Gruppe G), Ford Transit = „Transporter 3,5t
> Ladebordwand" (Gruppe F). Falls eine Klasse anders ist, in der UI korrigieren.

---

## 2. Anhänger auf richtige Typ-Gruppe umstellen (15 Stück)

Aktuell hatten alle pauschal `A_Anhaenger` (existiert nicht). Vorhandene Tarife:
`Anhaenger_Planeklein`, `Anhaenger_Planegross`, `Anhaenger_Koffer`,
`Anhaenger_Pritsche`, `Anhaenger_Autotrailer`.

### ✅ Eindeutig — ERLEDIGT (8 Stück, von Claude gesetzt)

| Fahrzeug | Kennzeichen | → Gruppe |
|---|---|---|
| [x] Autotrailer Hochlader | KLE-PL-605 | `Anhaenger_Autotrailer` ✅ |
| [x] Autotrailer Kevelaer | KLE-PL-505 | `Anhaenger_Autotrailer` ✅ |
| [x] Autotrailer Kranenburg | KLE-PL-503 | `Anhaenger_Autotrailer` ✅ |
| [x] Autotrailer Xanten | KLE-PL-504 | `Anhaenger_Autotrailer` ✅ |
| [x] Kofferanhänger Kalkar | KLE-PL-587 | `Anhaenger_Koffer` ✅ |
| [x] Kofferanhänger Kevelaer | KLE-PL-517 | `Anhaenger_Koffer` ✅ |
| [x] Kofferanhänger Weeze | KLE-PL-527 | `Anhaenger_Koffer` ✅ |
| [x] Offene Pritsche | KLE-PL-537 | `Anhaenger_Pritsche` ✅ |

### ❓ Deine Entscheidung nötig (7 Stück) — NOCH OFFEN

Du musst je Fahrzeug die Klasse wählen. Mögliche Werte:
`Anhaenger_Planeklein` · `Anhaenger_Planegross` · `Anhaenger_Autotrailer` · `Anhaenger_Koffer` · `Anhaenger_Pritsche`

| Fahrzeug | Kennzeichen | Tendenz | → deine Wahl |
|---|---|---|---|
| [x] Große Plane Alpen | GEL-PL-527 | `Anhaenger_Planegross` | **`Anhaenger_Planegross`** ✅ |
| [x] Große Plane Goch | KLE-PL-577 | `Anhaenger_Planegross` | **`Anhaenger_Planegross`** ✅ |
| [ ] Plane Goch | KLE-PL-508 | klein **oder** groß? | ____________ |
| [ ] Planenanhänger Kevelaer | KLE-PL-507 | klein **oder** groß? | ____________ |
| [ ] Planenanhänger Uedem | KLE-PL-500 | klein **oder** groß? | ____________ |
| [ ] Planenanhänger Weeze | GEL-PL-507 | klein **oder** groß? | ____________ |
| [ ] Pferdeanhänger | (kein KZ) | kein direkter Tarif – welcher passt? | ____________ |

> Sobald du die 7 Werte nennst, setze ich sie ebenfalls per service_role.

---

## ✅ 3. Tippfehler-Fahrzeug korrigiert (1 Stück) — ERLEDIGT

| Fahrzeug | Kennzeichen | alt | → neu |
|---|---|---|---|
| [x] Ford Transit Transporter | KLE-DC-146 | `PKW E` | `C_Transporter` ✅ (lt. Vermietungs-Angestellter: normaler Transporter) |

---

## Datendetails (zur Kontrolle) – Tarife stimmen alle

**PKW Privat:** A 45/225/675 · B 55/275/825 · C 75/325/975 · D(9-S.klein) 140/700/2100 · E(9-S.groß) 165/825/2475
**Transporter Privat:** C 120 · D 130 · E 150 · F 160 · G 225 (jeweils 24h)
**Anhänger Privat:** Planeklein 45 · Planegross 55 · Koffer 60 · Pritsche 45 · Autotrailer 85 (24h)
**Gewerbe-Listen:** identische Struktur, Netto-Werte ebenfalls geprüft ✅

---

## Checkliste zum Abschluss

- [ ] 5 „LKW"-Fahrzeuge auf `G_Transporter` / `F_Transporter` umgestellt
- [ ] 15 Anhänger auf passende `Anhaenger_*`-Gruppe umgestellt (klein/groß + Pferdeanhänger geklärt)
- [ ] „Ford Transit Transporter" (`PKW E`) korrigiert
- [ ] Im Buchungsformular je 1 Fahrzeug pro Gruppe getestet → Preis erscheint, kein „keine Preisgruppe"
- [ ] Bescheid geben → dann committen wir die Code-Fixes
