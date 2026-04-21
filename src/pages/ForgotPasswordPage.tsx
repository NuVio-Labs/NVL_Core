import { useState } from 'react'
import { Link } from 'react-router'
import { authService } from '@/features/auth/service/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      await authService.resetPassword(email, redirectTo)
      setSent(true)
    } catch {
      setError('Fehler beim Senden. Bitte E-Mail-Adresse prüfen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border border-border rounded-lg bg-background shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Passwort zurücksetzen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wir senden dir einen Link per E-Mail.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">
              E-Mail gesendet. Bitte prüfe deinen Posteingang und klicke auf den Link.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="underline underline-offset-4 text-foreground">
                Zurück zum Login
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? 'Senden…' : 'Link senden'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="underline underline-offset-4 text-foreground">
                Zurück zum Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
