import { useEffect } from 'react'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router'
import { AlertTriangle } from 'lucide-react'

const RELOAD_GUARD_KEY = 'nvl_chunk_reload'

// Erkennt „stale chunk"-Fehler nach einem Deploy (alter Asset-Hash nicht mehr
// vorhanden). Wird sowohl im Router-Wrapper als auch hier als Auffangnetz genutzt.
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /error loading dynamically imported module/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  )
}

// Router-weites errorElement: fängt Fehler aus Routen, lazy-Imports und Loadern
// (auch außerhalb der AppShell, z.B. Login/Onboarding) und zeigt eine saubere
// Fehlerseite statt der React-Router-Default-Ansicht.
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  // Auffangnetz: Rutscht doch ein Chunk-Fehler bis hierher durch, einmalig hart
  // neu laden (holt die frische index.html). Guard verhindert Endlosschleife.
  const chunkError = isChunkLoadError(error)
  useEffect(() => {
    if (chunkError && !sessionStorage.getItem(RELOAD_GUARD_KEY)) {
      sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
      window.location.reload()
    }
  }, [chunkError])

  // Während der automatische Reload greift, kein verwirrendes Fehler-UI zeigen.
  if (chunkError && !sessionStorage.getItem(RELOAD_GUARD_KEY)) {
    return null
  }

  let title = 'Etwas ist schiefgelaufen.'
  let detail = ''

  if (chunkError) {
    title = 'Neue Version verfügbar.'
    detail = 'Die App wurde aktualisiert. Bitte einmal neu laden.'
  } else if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Seite nicht gefunden.' : `Fehler ${error.status}`
    detail = error.statusText || ''
  } else if (error instanceof Error) {
    detail = error.message
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {detail && <p className="mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          Neu laden
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
        >
          Zur Startseite
        </button>
      </div>
    </div>
  )
}
