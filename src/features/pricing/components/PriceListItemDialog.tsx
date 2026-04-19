import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePriceListItemFieldDefinitions } from '../hooks/usePriceListItemFieldDefinitions'
import { useCompanySettings } from '@/features/workspace'
import type { PriceListItem, PriceListItemFieldDefinition } from '../types'

function buildSchema(definitions: PriceListItemFieldDefinition[]) {
  const metadataShape: Record<string, z.ZodTypeAny> = {}
  for (const def of definitions) {
    let field: z.ZodTypeAny
    if (def.field_type === 'number') {
      field = z.coerce.number({ invalid_type_error: 'Muss eine Zahl sein' })
    } else if (def.field_type === 'boolean') {
      field = z.boolean()
    } else {
      field = z.string()
    }
    if (!def.is_required) {
      field = field instanceof z.ZodString ? (field as z.ZodString).optional() : field.optional()
    } else if (def.field_type === 'text' || def.field_type === 'date') {
      field = (field as z.ZodString).min(1, `${def.label} ist erforderlich`)
    }
    metadataShape[def.name] = field
  }
  return z.object({
    name: z.string().min(1, 'Name ist erforderlich').max(100),
    unit: z.string().min(1, 'Einheit ist erforderlich').max(30),
    price_per_unit: z.coerce.number({ invalid_type_error: 'Muss eine Zahl sein' }).min(0, 'Preis darf nicht negativ sein'),
    metadata: z.object(metadataShape),
  })
}

type FormValues = {
  name: string
  unit: string
  price_per_unit: number
  metadata: Record<string, unknown>
}

interface Props {
  open: boolean
  priceListId: string
  item?: PriceListItem
  onSubmit: (values: FormValues) => void
  onClose: () => void
  isLoading?: boolean
}

export function PriceListItemDialog({ open, priceListId, item, onSubmit, onClose, isLoading }: Props) {
  const { data: definitions = [] } = usePriceListItemFieldDefinitions(priceListId)
  const settings = useCompanySettings()
  const showUnitPrice = settings.pricing_show_unit_price !== false
  const schema = buildSchema(definitions)

  const existingMeta = (item?.metadata ?? {}) as Record<string, unknown>
  const defaultMetadata: Record<string, unknown> = {}
  for (const def of definitions) {
    defaultMetadata[def.name] = existingMeta[def.name] ?? (def.field_type === 'boolean' ? false : '')
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', unit: '', price_per_unit: 0, metadata: defaultMetadata },
  })

  useEffect(() => {
    const meta: Record<string, unknown> = {}
    for (const def of definitions) {
      meta[def.name] = existingMeta[def.name] ?? (def.field_type === 'boolean' ? false : '')
    }
    reset({
      name: item?.name ?? '',
      unit: item?.unit ?? '',
      price_per_unit: item?.price_per_unit ?? 0,
      metadata: meta,
    })
  }, [item, definitions]) // eslint-disable-line react-hooks/exhaustive-deps

  const metaErrors = (errors.metadata ?? {}) as Record<string, { message?: string }>

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background border border-border rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            {item ? 'Position bearbeiten' : 'Position anlegen'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="item-name">Bezeichnung</label>
            <input
              id="item-name"
              {...register('name')}
              placeholder="z.B. Tagesmiete"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                errors.name ? 'border-destructive' : 'border-input',
              )}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="unit">Einheit</label>
            <input
              id="unit"
              {...register('unit')}
              placeholder="z.B. Tag, Stunde, km"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                errors.unit ? 'border-destructive' : 'border-input',
              )}
            />
            {errors.unit && <p className="text-destructive text-xs">{errors.unit.message}</p>}
          </div>

          {showUnitPrice && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="price_per_unit">Preis pro Einheit (€)</label>
              <input
                id="price_per_unit"
                type="number"
                step="0.01"
                min="0"
                {...register('price_per_unit')}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                  errors.price_per_unit ? 'border-destructive' : 'border-input',
                )}
              />
              {errors.price_per_unit && <p className="text-destructive text-xs">{errors.price_per_unit.message}</p>}
            </div>
          )}

          {definitions.length > 0 && (
            <div className="border-t border-border pt-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Zusatzfelder</p>
              {definitions.map((def) => {
                const fieldError = metaErrors[def.name]?.message
                if (def.field_type === 'boolean') {
                  return (
                    <div key={def.id} className="flex items-center gap-2">
                      <input
                        id={`metadata.${def.name}`}
                        type="checkbox"
                        {...register(`metadata.${def.name}` as never)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <label className="text-sm font-medium" htmlFor={`metadata.${def.name}`}>{def.label}</label>
                    </div>
                  )
                }
                if (def.field_type === 'date') {
                  return (
                    <div key={def.id} className="space-y-1">
                      <label className="text-sm font-medium" htmlFor={`metadata.${def.name}`}>
                        {def.label}{def.is_required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      <input
                        id={`metadata.${def.name}`}
                        type="date"
                        {...register(`metadata.${def.name}` as never)}
                        className={cn(
                          'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background',
                          fieldError ? 'border-destructive' : 'border-input',
                        )}
                      />
                      {fieldError && <p className="text-destructive text-xs">{fieldError}</p>}
                    </div>
                  )
                }
                return (
                  <div key={def.id} className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={`metadata.${def.name}`}>
                      {def.label}{def.is_required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    <input
                      id={`metadata.${def.name}`}
                      type={def.field_type === 'number' ? 'number' : 'text'}
                      {...register(`metadata.${def.name}` as never)}
                      className={cn(
                        'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                        fieldError ? 'border-destructive' : 'border-input',
                      )}
                    />
                    {fieldError && <p className="text-destructive text-xs">{fieldError}</p>}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
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
      </div>
    </div>
  )
}
