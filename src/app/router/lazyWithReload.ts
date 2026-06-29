/**
 * Wrapper für React-Router `lazy()`-Imports, der „stale chunk"-Fehler nach
 * einem neuen Deployment abfängt.
 *
 * Problem: Nach einem Deploy ändern sich die Asset-Hashes (z.B.
 * `BookingsPage-CaO8ZXXF.js`). Eine bereits offene Seite hält aber noch die
 * alte `index.html`/den alten Service-Worker-Cache und versucht beim Navigieren
 * den nicht mehr existierenden alten Chunk zu laden → „error loading
 * dynamically imported module".
 *
 * Lösung: Schlägt der dynamische Import fehl, laden wir die Seite EINMAL hart
 * neu (holt die frische index.html mit korrekten Hashes). Ein Guard im
 * sessionStorage verhindert eine Endlosschleife, falls der Fehler eine andere
 * Ursache hat (z.B. echter Netzwerkausfall).
 */

const RELOAD_GUARD_KEY = 'nvl_chunk_reload'

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /error loading dynamically imported module/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  )
}

type LazyResult = { Component: React.ComponentType }

/**
 * Erzeugt eine `lazy`-kompatible Funktion, die das default- oder benannte
 * Modul-Member als Route-Component zurückgibt und bei Chunk-Fehlern neu lädt.
 */
export function lazyWithReload<M extends Record<string, unknown>>(
  importer: () => Promise<M>,
  pick: (module: M) => React.ComponentType,
): () => Promise<LazyResult> {
  return async () => {
    try {
      const module = await importer()
      // Erfolgreich geladen → Guard zurücksetzen, damit ein späterer
      // Deploy-Wechsel wieder einen Reload auslösen darf.
      sessionStorage.removeItem(RELOAD_GUARD_KEY)
      return { Component: pick(module) }
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_GUARD_KEY)) {
        sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
        window.location.reload()
        // Reload läuft — Promise nie auflösen, damit kein Fehler-UI aufblitzt.
        return new Promise<LazyResult>(() => {})
      }
      throw error
    }
  }
}
