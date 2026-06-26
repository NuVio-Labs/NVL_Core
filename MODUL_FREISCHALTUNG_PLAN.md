# Modul-Freischaltung pro Mandant — Umsetzungsplan

> NuVioLabs (Plattform-Owner) schaltet pro Kunde frei, welche Module er nutzen darf
> (Fleet, Sales, Verträge, …). Kern des SaaS-Geschäftsmodells / White-Label.
> Stand: 26.06.2026 · an Core-Architektur angepasst.

---

## Vorhandene Bausteine (darauf aufbauen, nichts Parallel erfinden)

- **`profiles.platform_role`** (= 'owner') + **`isPlatformOwner()`** (src/lib/permissions.ts)
  + DB-Funktion **`is_platform_owner()`** → das „als NuVioLabs"-Recht existiert bereits.
- **`companies.settings`** (JSONB) — hier kommt der Modul-Status rein.
- **`useCompanySettings()` / `useUpdateCompanySettings()`** (src/features/workspace).
- **Nav-Config** (src/app/navigation/config.ts) ist datengetrieben mit `roles?`-Filter
  → wird um Modul-Filter erweitert.
- Vorbild Feature-Flag: `feature_ocr_scan` in settings (gleiche Mechanik).

---

## Entscheidungen (final)
1. **Speicherung:** `companies.settings.modules` als JSONB-Objekt, z.B.
   `{ "fleet": true, "sales": false, "contracts": true }`. Kein DB-Umbau.
2. **Berechtigung:** NUR Plattform-Owner (platform_role='owner') darf zuweisen.
   Mandanten-Admins können es NICHT selbst.
3. **UI:** Neuer Plattform-Admin-Bereich **`/admin/companies`** (nur Owner sichtbar).

---

## Modul-Registry (zentrale Wahrheit, welche Module es gibt)

Neue Datei `src/lib/modules.ts`:
```
export interface ModuleDef { key: string; label: string; description: string }
export const MODULES: ModuleDef[] = [
  { key: 'bookings',  label: 'Buchungen & Kalender', description: '...' },
  { key: 'pricing',   label: 'Preislisten',          description: '...' },
  { key: 'contracts', label: 'Verträge',             description: '...' },
  { key: 'sales',     label: 'Vertrieb / CRM',       description: '...' },
  // Kernmodule (Dashboard, Kunden, Ressourcen, Einstellungen) sind IMMER an.
]
```
Default-Verhalten: Modul gilt als aktiv, wenn `settings.modules[key] === true`.
Kernmodule (immer an) NICHT über Flags steuern, sonst sperrt man Kunden aus.

---

## Helper / Hook

`useModuleEnabled(key)` (oder `useEnabledModules()`):
- liest `companySettings.modules`
- Plattform-Owner sieht optional alles (zum Testen) — oder strikt nach Flag (entscheiden)
- Fallback: unbekanntes/fehlendes Flag = aus (außer Kernmodule)

---

## Umsetzungsschritte

### 1. Modul-Registry + Hook
- `src/lib/modules.ts` (MODULES-Liste)
- `useModuleEnabled(key)` in workspace

### 2. Nav nach Modulen filtern
- NavItem um optionales `module?: string` erweitern
- Sidebar filtert: Item nur zeigen, wenn `module` fehlt ODER Modul aktiv
- (bestehender `roles?`-Filter bleibt)

### 3. Routen absichern
- Routen zu modul-gebundenen Seiten hinter Guard `ModuleGuard` (wie ProtectedRoute):
  Modul aus → Redirect/„nicht verfügbar". Sonst käme man per URL doch rein.

### 4. Plattform-Admin-Bereich `/admin/companies`
- Route nur für Plattform-Owner (Guard via isPlatformOwner)
- Liste aller companies (Owner darf cross-tenant lesen — RLS-Policy prüfen/ergänzen!)
- Pro Company: Toggles je Modul aus MODULES → schreibt `settings.modules[key]`
- Speichern via update auf companies.settings (Merge, nicht überschreiben!)

### 5. Nav-Eintrag „Plattform" (nur Owner)
- eigener Nav-Bereich, nur sichtbar wenn isPlatformOwner

---

## WICHTIG / Fallstricke
- **RLS:** Plattform-Owner muss companies anderer Mandanten lesen/schreiben dürfen.
  Aktuell sehen Member nur ihre eigene company. Policy für `is_platform_owner()` ergänzen
  (SELECT + UPDATE auf companies). Sensibel — sauber testen.
- **settings-Merge:** Beim Schreiben von modules das übrige settings-JSON erhalten
  (wie beim PriceListItem-label-Fix gemacht), sonst gehen feature_ocr_scan etc. verloren.
- **Kernmodule nie sperrbar** machen (Dashboard/Einstellungen/Kunden/Ressourcen).
- **Sales-Modul** (siehe SALES_MODUL_PLAN.md) wird ein modul-gebundenes Feature →
  taucht erst auf, wenn `modules.sales = true`. Gut zusammen planen.

---

## Reihenfolge-Empfehlung
Dieses Modul-System ist die **Grundlage**, damit Fleet/Sales/Verträge sauber pro Kunde
schaltbar sind. Sinnvoll, es VOR oder ZUSAMMEN mit dem Sales-Modul zu bauen.

In **frischer Session** bauen (/clear) — eigenständiges Feature, nicht im vollen Kontext.
