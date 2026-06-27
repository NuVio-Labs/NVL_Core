# Fahrzeug-Preisgruppen – Korrekturen (PLT)

> Stand: 27.06.2026 · DB gegen offizielle Preislisten (gültig ab 01.08.2024) geprüft.
>
> **✅ ABGESCHLOSSEN:** Alle Anhänger, LKW und der Tippfehler-Fall sind in der DB auf
> gültige Preisgruppen gesetzt. Kein Fahrzeug steht mehr auf einer nicht-existenten
> Gruppe (`A_Anhaenger` / `A_LKW` / `B_LKW`). Per service_role am 27.06.2026 verifiziert.
>
> **Wichtigstes Ergebnis (Ausgangslage):** Die Preis-Tarife in der DB stimmen **vollständig**
> mit den offiziellen Listen überein. Es fehlt **kein** Tarif. Das Problem waren **falsche
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

### ✅ Geklärt mit Kunde Peter — ERLEDIGT (7 Stück, am 27.06.2026 gesetzt)

Klein/groß über Anhänger-Gewicht entschieden (1300 kg → groß, 750 kg → klein),
Pferdeanhänger laut Peter zum Koffer-Preis.

| Fahrzeug | Kennzeichen | Gewicht | → gesetzte Gruppe |
|---|---|---|---|
| [x] Große Plane Alpen | GEL-PL-527 | — | `Anhaenger_Planegross` ✅ |
| [x] Große Plane Goch | KLE-PL-577 | — | `Anhaenger_Planegross` ✅ |
| [x] Plane Goch | KLE-PL-508 | 1300 kg | `Anhaenger_Planegross` ✅ |
| [x] Planenanhänger Uedem | KLE-PL-500 | 1300 kg | `Anhaenger_Planegross` ✅ |
| [x] Planenanhänger Kevelaer | KLE-PL-507 | 750 kg | `Anhaenger_Planeklein` ✅ |
| [x] Planenanhänger Weeze | GEL-PL-507 | 750 kg | `Anhaenger_Planeklein` ✅ |
| [x] Pferdeanhänger (2 Pferde) | (kein KZ) | — | `Anhaenger_Koffer` ✅ (= Koffer-Preis) |

> Hinweis: „Planenanhänger Kranenburg" (KLE-PL-506) steht weiterhin auf `Anhaenger_Planeklein`
> — war bereits vor dieser Runde gesetzt, von Peter nicht beanstandet.

---

## ✅ 3. Tippfehler-Fahrzeug korrigiert (1 Stück) — ERLEDIGT

| Fahrzeug | Kennzeichen | alt | → neu |
|---|---|---|---|
| [x] Ford Transit Transporter | `KLE DC 146` | `PKW E` | `C_Transporter` ✅ (lt. Vermietungs-Angestellter: normaler Transporter) |

> Hinweis: Kennzeichen ist in der DB als `KLE DC 146` (mit Leerzeichen) gespeichert,
> nicht `KLE-DC-146` (Bindestriche). Nur kosmetisch — Preisgruppe stimmt.

---

## Datendetails (zur Kontrolle) – Tarife stimmen alle

**PKW Privat:** A 45/225/675 · B 55/275/825 · C 75/325/975 · D(9-S.klein) 140/700/2100 · E(9-S.groß) 165/825/2475
**Transporter Privat:** C 120 · D 130 · E 150 · F 160 · G 225 (jeweils 24h)
**Anhänger Privat:** Planeklein 45 · Planegross 55 · Koffer 60 · Pritsche 45 · Autotrailer 85 (24h)
**Gewerbe-Listen:** identische Struktur, Netto-Werte ebenfalls geprüft ✅

---

## Checkliste zum Abschluss

- [x] 5 „LKW"-Fahrzeuge auf `G_Transporter` / `F_Transporter` umgestellt ✅
- [x] 16 Anhänger auf passende `Anhaenger_*`-Gruppe umgestellt (klein/groß + Pferdeanhänger geklärt) ✅
- [x] „Ford Transit Transporter" (`PKW E`) korrigiert ✅
- [x] DB-Stand am 27.06.2026 per service_role gegengeprüft — kein Fahrzeug mehr auf ungültiger Gruppe ✅
- [x] Preis erscheint für jedes Fahrzeug ✅ — am 27.06.2026 per Skript mit der ECHTEN Matching-Logik aus BookingDialog.tsx durchgerechnet: alle 49 aktiven Fahrzeuge × (Privat + Gewerbe) = 98 Kombis, **0 ohne Preis**, alle 16 Anhänger inkl. Plane/Koffer liefern Tarif. Kein „keine Preisgruppe" mehr.

---

## ✅ Geprüft & korrekt (war kurz verdächtig)

- **Citroen Jumper / KLE-PL-977 → `E_PKW` ist RICHTIG.** Laut Stammdatenblatt (AHK ja, **9 Sitze**,
  Homebase Kranenburg) ist dieses Fahrzeug ein **9-Sitzer**-Personentransporter, kein Kastenwagen.
  Der DB-Name „Citroen Jumper" (ohne „9-Sitzer") hatte einen Transporter vermuten lassen — falscher
  Verdacht. Gehört korrekt in die 9-Sitzer-Gruppe `E_PKW`. **Nicht ändern.** (Geklärt 27.06.2026.)

---

## 📋 Vollabgleich DB ↔ offizielle PLT-Fahrzeugliste (Stand Liste: 28.11.2024 · geprüft 27.06.2026)

Alle 48 Fahrzeuge der offiziellen Liste per Kennzeichen, Sitze und HU gegen die DB geprüft.
**Ergebnis: DB stimmt fast vollständig überein.** Nur 2 Punkte zum Klären — und zwar von
**PLT**, nicht durch Nachrecherche unsererseits (Liste/Realität entscheidet, nicht wir):

1. **Fiat Punto / KLE PL 147:** DB-HU = **09.2026**, Liste = **9/21**. Jemand hat in DB auf 2026
   hochgesetzt. PLT: welches stimmt? Nicht geändert.
2. **Fiat Ducato / KLE PL 547:** DB-HU = **12.2026**, Liste = **12/21**. Wie Punto. PLT klären.

**Entwarnt — `CD 146` / `DC 146` sind ZWEI echte Fahrzeuge (von Axel bestätigt):**
`KLE-CD-146` = Ford Transit Custom, **9-Sitzer** → `D_PKW` (= Liste Nr. 2) ✅ ·
`KLE DC 146` = Ford Transit **Transporter**, 3 Sitze → `C_Transporter` ✅. Beide korrekt in DB.
(Ein früherer Abgleich hatte sie versehentlich als ein Fahrzeug zusammengeworfen.) Einzig kosmetisch:
das eine KZ mit Bindestrichen, das andere mit Leerzeichen — unkritisch.

**Wichtig — „TÜV: 32 überfällig" im Dashboard ist KORREKT, kein Bug:** Die HU-Daten in der DB
entsprechen exakt der offiziellen Liste. Da diese vom 28.11.2024 ist und viele Termine aus
2021–2023 enthält, sind ~32 Fahrzeuge real HU-überfällig. **PLT muss aktuelle HU-Termine pflegen** —
das ist Stammdatenpflege beim Kunden, kein Softwarefehler. (14 Fahrzeuge haben gar kein HU-Datum
in der DB → ebenfalls von PLT nachzutragen.)
