import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { FIELD_TYPE_LABELS } from '../types'
import type { ResourceFieldDefinition, ResourceFieldType } from '../types'

const FIELD_TYPES: ResourceFieldType[] = ['text', 'number', 'boolean', 'date']

const schema = z.object({
  label: z.string().min(1, 'Bezeichnung erforderlich').max(80),
  name: z
    .string()
    .min(1, 'Feldname erforderlich')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Nur Kleinbuchstaben, Zahlen und _ erlaubt'),
  field_type: z.enum(['text', 'number', 'boolean', 'date']),
  is_required: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  definition?: ResourceFieldDefinition
  onSubmit: (values: FormValues) => void
  onCancel: () => void
  isLoading?: boolean
}

export function FieldDefinitionForm({ definition, onSubmit, onCancel, isLoading }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: definition?.label ?? '',
      name: definition?.name ?? '',
      field_type: definition?.field_type ?? 'text',
      is_required: definition?.is_required ?? false,
    },
  })

  useEffect(() => {
    reset({
      label: definition?.label ?? '',
      name: definition?.name ?? '',
      field_type: definition?.field_type ?? 'text',
      is_required: definition?.is_required ?? false,
    })
  }, [definition, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="label">Bezeichnung</label>
        <input
          id="label"
          {...register('label')}
          placeholder="z.B. Kennzeichen"
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
            errors.label ? 'border-destructive' : 'border-input',
          )}
        />
        {errors.label && <p className="text-destructive text-xs">{errors.label.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="name">
          Feldname <span className="text-muted-foreground font-normal">(intern, unveränderlich)</span>
        </label>
        <input
          id="name"
          {...register('name')}
          placeholder="z.B. kennzeichen"
          disabled={!!definition}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
            definition ? 'bg-muted text-muted-foreground cursor-not-allowed' : '',
            errors.name ? 'border-destructive' : 'border-input',
          )}
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="field_type">Typ</label>
        <select
          id="field_type"
          {...register('field_type')}
          disabled={!!definition}
          className={cn(
            'w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background',
            definition ? 'bg-muted text-muted-foreground cursor-not-allowed' : '',
          )}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_required"
          type="checkbox"
          {...register('is_required')}
          className="h-4 w-4 rounded border-input"
        />
        <label className="text-sm font-medium" htmlFor="is_required">Pflichtfeld</label>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
