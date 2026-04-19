import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { authService } from '@/features/auth/service/authService'

export function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const data = await authService.signUp(email, password, fullName)
      if (data.session) {
        navigate('/', { replace: true })
      } else {
        setDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen.')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-sm space-y-4 p-8 border border-border rounded-lg bg-background shadow-sm text-center">
          <h2 className="text-xl font-bold">Fast geschafft!</h2>
          <p className="text-muted-foreground text-sm">
            Wir haben dir eine Bestätigungs-E-Mail an <strong>{email}</strong> geschickt.
            Bitte bestätige deine Adresse, dann kannst du dich anmelden.
          </p>
          <Link to="/login" className="text-sm underline underline-offset-4">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border border-border rounded-lg bg-background shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Konto erstellen</h1>
          <p className="text-muted-foreground text-sm mt-1">Registriere dich für NuVio Core</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="fullName">Name</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

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

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? 'Registrieren…' : 'Registrieren'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{' '}
          <Link to="/login" className="underline underline-offset-4 text-foreground">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
