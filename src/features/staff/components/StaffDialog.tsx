import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useStaffMembers, useUpdateStaffMember, useStaffFieldDefinitions } from '../hooks/useStaff'
import type { StaffMembership } from '../types'
import type { StaffFieldDefinition } from '../types'
import type { Enums } from '@/lib/supabase/database.types'

const ROLES: Enums<'membership_role'>[] = ['admin', 'editor', 'user']
const ROLE_LABELS: Record<Enums<'membership_role'>, string> = {
  admin: 'Administrator',
  editor: 'Bearbeiter',
  user: 'Mitarbeiter',
}

function buildSchema(definitions: StaffFieldDefinition[]) {
  const metaShape: Record<string, z.ZodTypeAny> = {}
  for (const def of definitions) {
    let field: z.ZodTypeAny = def.field_type === 'number'
      ? z.coerce.number({ invalid_type_error: 'Muss eine Zahl sein' })
      : def.field_type === 'boolean'
      ? z.boolean()
      : z.string()
    if (!def.is_required) field = field.optional()
    else if (def.field_type === 'text' || def.field_type === 'date')
      field = (field as z.ZodString).min(1, `${def.label} ist erforderlich`)
    metaShape[def.name] = field
  }
  return z.object({
    location: z.string().optional(),
    role: z.enum(['admin', 'editor', 'user'] as const),
    status: z.enum(['active', 'invited', 'suspended'] as const),
    metadata: z.object(metaShape),
  })
}

type FormValues = {
  location?: string
  role: Enums<'membership_role'>
  status: Enums<'membership_status'>
  metadata: Record<string, unknown>
}

interface Props {
  open: boolean
  member: StaffMembership | null
  onClose: () => void
}

export function StaffDialog({ open, member, onClose }: Props) {
  const { data: fieldDefinitions = [] } = useStaffFieldDefinitions()
  const updateMember = useUpdateStaffMember()

  const schema = buildSchema(fieldDefinitions)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!open) return
    if (member) {
      const meta = (member.metadata ?? {}) as Record<string, unknown>
      const metaDefaults: Record<string, unknown> = {}
      for (const def of fieldDefinitions) {
        metaDefaults[def.name] = meta[def.name] ?? (def.field_type === 'boolean' ? false : '')
      }
      reset({
        location: member.location ?? '',
        role: member.role,
        status: member.status,
        metadata: metaDefaults,
      })
    }
  }, [open, member, fieldDefinitions]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !member) return null

  async function onSubmit(values: FormValues) {
    if (!member) return
    await updateMember.mutateAsync({
      id: member.id,
      payload: {
        location: values.location || null,
        role: values.role,
        status: values.status,
        metadata: values.metadata,
      },
    })
    reset({ location: '', role: 'member', status: 'active', metadata: {} })
    onClose()
  }

  const metaErrors = (errors.metadata ?? {}) as Record<string, { message?: string }>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold">Mitarbeiter bearbeiten</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {member.profile.full_name ?? member.profile.email}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Stammdaten read-only */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/40 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Name</p>
                <p className="font-medium">{member.profile.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">E-Mail</p>
                <p className="font-medium truncate">{member.profile.email}</p>
              </div>
            </div>

            {/* Rolle */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Rolle</label>
              <select
                {...register('role')}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                {...register('status')}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="active">Aktiv</option>
                <option value="invited">Eingeladen</option>
                <option value="suspended">Gesperrt</option>
              </select>
            </div>

            {/* Standort */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Standort</label>
              <input
                {...register('location')}
                type="text"
                placeholder="z.B. Kranenburg"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Dynamische Felder */}
            {fieldDefinitions.length > 0 && (
              <div className="space-y-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zusatzfelder</p>
                {fieldDefinitions.map((def) => (
                  <div key={def.id} className="space-y-1">
                    <label className="text-sm font-medium">
                      {def.label}
                      {def.is_required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    {def.field_type === 'boolean' ? (
                      <div className="flex items-center gap-2">
                        <input
                          {...register(`metadata.${def.name}` as const)}
                          type="checkbox"
                          className="w-4 h-4 rounded border-border accent-primary"
                        />
                        <span className="text-sm text-muted-foreground">{def.label}</span>
                      </div>
                    ) : (
                      <input
                        {...register(`metadata.${def.name}` as const)}
                        type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                    {metaErrors[def.name] && (
                      <p className="text-xs text-destructive">{metaErrors[def.name].message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
