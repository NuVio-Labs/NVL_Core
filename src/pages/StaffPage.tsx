import { useState } from 'react'
import { Pencil, Trash2, UserCog, UserPlus } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { useCan } from '@/features/workspace'
import { useStaffMembers, useDeleteStaffMember, useStaffFieldDefinitions } from '@/features/staff/hooks/useStaff'
import { StaffDialog } from '@/features/staff/components/StaffDialog'
import { StaffInviteDialog } from '@/features/staff/components/StaffInviteDialog'
import type { StaffMembership } from '@/features/staff/types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Bearbeiter',
  user: 'Mitarbeiter',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  invited: 'Eingeladen',
  suspended: 'Gesperrt',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-700',
  invited: 'text-amber-600',
  suspended: 'text-destructive',
}

export function StaffPage() {
  const can = useCan()
  const { data: members = [], isLoading } = useStaffMembers()
  const { data: fieldDefinitions = [] } = useStaffFieldDefinitions()
  const deleteMember = useDeleteStaffMember()

  function renderFieldValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'boolean') return value ? 'Ja' : '—'
    return String(value)
  }

  const [editingMember, setEditingMember] = useState<StaffMembership | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const canManage = can('users', 'manage_roles')

  function handleDelete(member: StaffMembership) {
    if (!confirm(`${member.profile.full_name ?? member.profile.email} wirklich entfernen?`)) return
    deleteMember.mutate(member.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="text-muted-foreground text-sm mt-1">Alle Mitglieder dieses Mandanten</p>
        </div>
        {canManage && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            Mitarbeiter einladen
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : members.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Noch keine Mitarbeiter vorhanden"
          description="Lade Mitarbeiter ein um ihnen Zugang zu diesem Mandanten zu geben."
          action={canManage ? (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-4 h-4" />
              Ersten Mitarbeiter einladen
            </button>
          ) : undefined}
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium w-32">Rolle</th>
                <th className="text-left px-4 py-3 font-medium w-28">Standort</th>
                {fieldDefinitions.map((def) => (
                  <th key={def.id} className="text-left px-4 py-3 font-medium whitespace-nowrap">{def.label}</th>
                ))}
                <th className="text-left px-4 py-3 font-medium w-24">Status</th>
                {canManage && <th className="px-4 py-3 w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.profile?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ROLE_LABELS[m.role] ?? m.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.location ?? '—'}</td>
                  {fieldDefinitions.map((def) => (
                    <td key={def.id} className="px-4 py-3 text-muted-foreground">
                      {renderFieldValue((m.metadata as Record<string, unknown> | null)?.[def.name])}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${STATUS_COLORS[m.status] ?? ''}`}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingMember(m)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StaffDialog
        open={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
      />

      <StaffInviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  )
}
