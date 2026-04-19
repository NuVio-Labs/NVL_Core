import { useState } from 'react'
import { X } from 'lucide-react'
import { staffService } from '../service/staffService'
import { useWorkspace } from '@/features/workspace'
import { useQueryClient } from '@tanstack/react-query'
import type { Enums } from '@/lib/supabase/database.types'

const ROLES: { value: Enums<'membership_role'>; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Bearbeiter' },
  { value: 'member', label: 'Mitarbeiter' },
  { value: 'viewer', label: 'Lesezugriff' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function StaffInviteDialog({ open, onClose }: Props) {
  const { activeCompanyId } = useWorkspace()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Enums<'membership_role'>>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  async function handleInvite() {
    if (!email || !activeCompanyId) return
    setLoading(true)
    setError(null)
    try {
      await staffService.inviteMember(
        activeCompanyId,
        email,
        role,
        window.location.origin + '/onboarding',
      )
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['staff_members', activeCompanyId] })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Einladen')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setEmail('')
    setRole('member')
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Mitarbeiter einladen</h2>
          <button onClick={handleClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
              Einladung an <strong>{email}</strong> gesendet. Der Mitarbeiter erhält eine E-Mail zur Registrierung.
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">E-Mail-Adresse</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mitarbeiter@beispiel.de"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Rolle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Enums<'membership_role'>)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={handleClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
            {success ? 'Schließen' : 'Abbrechen'}
          </button>
          {!success && (
            <button
              onClick={handleInvite}
              disabled={loading || !email}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Einladen…' : 'Einladung senden'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
