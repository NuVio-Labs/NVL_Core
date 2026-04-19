import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/features/auth'
import { useWorkspace } from '@/features/workspace'
import { useStaffFieldDefinitions } from '@/features/staff/hooks/useStaff'
import { staffService } from '@/features/staff/service/staffService'
import { supabase } from '@/lib/supabase'
import type { StaffFieldDefinition } from '@/features/staff/types'

function buildSchema(definitions: StaffFieldDefinition[]) {
  const metaShape: Record<string, z.ZodTypeAny> = {}
  for (const def of definitions) {
    let field: z.ZodTypeAny =
      def.field_type === 'number'
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
    full_name: z.string().min(1, 'Name ist erforderlich'),
    password: z.string().min(8, 'Mindestens 8 Zeichen'),
    password_confirm: z.string(),
    location: z.string().optional(),
    metadata: z.object(metaShape),
  }).refine((d) => d.password === d.password_confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['password_confirm'],
  })
}

type FormValues = {
  full_name: string
  password: string
  password_confirm: string
  location?: string
  metadata: Record<string, unknown>
}

export function OnboardingPage() {
  const { user } = useAuth()
  const { activeMembership, activeCompanyId, refreshMemberships } = useWorkspace()
  const navigate = useNavigate()
  const { data: fieldDefinitions = [] } = useStaffFieldDefinitions()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = buildSchema(fieldDefinitions)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name ?? '',
      metadata: {},
    },
  })

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (activeMembership && activeMembership.status !== 'invited') {
      navigate('/', { replace: true })
    }
  }, [user, activeMembership, navigate])

  async function onSubmit(values: FormValues) {
    if (!activeMembership || !activeCompanyId || !user) return
    setServerError(null)
    try {
      // Passwort setzen
      const { error: pwError } = await supabase.auth.updateUser({ password: values.password })
      if (pwError) throw pwError

      // Profil-Name aktualisieren
      await supabase.from('profiles').update({ full_name: values.full_name }).eq('id', user.id)

      // Membership aktivieren + Felder speichern
      await staffService.updateMember(activeMembership.id, {
        status: 'active',
        location: values.location || null,
        metadata: values.metadata,
      })

      // Workspace-State neu laden damit der Guard den aktualisierten Status sieht
      await refreshMemberships()
      navigate('/', { replace: true })
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    }
  }

  const metaErrors = (errors.metadata ?? {}) as Record<string, { message?: string }>

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md space-y-6 p-8 border border-border rounded-lg bg-background shadow-sm mx-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Willkommen bei NuVio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bitte vervollständige dein Profil um fortzufahren.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Vollständiger Name</label>
            <input
              {...register('full_name')}
              type="text"
              placeholder="Max Mustermann"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Standort</label>
            <input
              {...register('location')}
              type="text"
              placeholder="z.B. Kranenburg"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Passwort festlegen</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Passwort bestätigen</label>
            <input
              {...register('password_confirm')}
              type="password"
              autoComplete="new-password"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.password_confirm && (
              <p className="text-xs text-destructive">{errors.password_confirm.message}</p>
            )}
          </div>

          {fieldDefinitions.length > 0 && (
            <div className="space-y-4 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Weitere Angaben
              </p>
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
                      type={
                        def.field_type === 'number'
                          ? 'number'
                          : def.field_type === 'date'
                          ? 'date'
                          : 'text'
                      }
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

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Speichern…' : 'Profil speichern & starten'}
          </button>
        </form>
      </div>
    </div>
  )
}
