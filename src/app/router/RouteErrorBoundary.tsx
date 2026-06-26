import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router'
import { AlertTriangle } from 'lucide-react'

// Router-weites errorElement: fängt Fehler aus Routen, lazy-Imports und Loadern
// (auch außerhalb der AppShell, z.B. Login/Onboarding) und zeigt eine saubere
// Fehlerseite statt der React-Router-Default-Ansicht.
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'Etwas ist schiefgelaufen.'
  let detail = ''

  if (isRouteErrorResponse(error)) {
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
          onClick={() => navigate(0)}
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
