import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/features/auth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await signIn(identifier, password)
      navigate('/', { replace: true })
    } catch {
      setError('Benutzername/E-Mail oder Passwort ungültig.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-mesh relative flex items-center justify-center min-h-screen overflow-hidden px-4">
      {/* Dekorative weiche Farbflächen für mehr Tiefe hinterm Glas */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-indigo-300/30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[34rem] w-[34rem] rounded-full bg-sky-300/30 blur-3xl animate-blob [animation-delay:4s]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-300/25 blur-3xl animate-blob [animation-delay:8s]" />
      {/* feines Grid-Overlay für cleane Struktur */}
      <div className="login-grid pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/60 bg-white/60 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-xl ring-1 ring-white/40">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-900/20">
              N
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">NuVio Core</h1>
            <p className="mt-1 text-sm text-slate-500">Melde dich an</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="identifier">
                Benutzername oder E-Mail
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900/20 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Passwort
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900/20 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50/80 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Noch kein Konto?{' '}
            <Link to="/signup" className="font-medium text-slate-900 underline-offset-4 hover:underline">
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
