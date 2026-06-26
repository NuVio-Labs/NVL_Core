import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { useFieldDefinitions } from '../hooks/useFieldDefinitions'
import { useResourceClasses } from '@/features/pricing/hooks/usePriceListItems'
import { useLocations } from '@/features/locations/hooks/useLocations'
import type { Resource, ResourceFieldDefinition } from '../types'

// Felder anhand des Feldnamens erkennen (datengetrieben, kein Hardcoding auf
// genau einen Namen).
function isPriceGroupField(name: string) {
  const n = name.toLowerCase()
  return n.includes('preis') && n.includes('grupp')
}
function isLocationField(name: string) {
  const n = name.toLowerCase()
  return n.includes('standort') || n.includes('homebase')
}

function buildSchema(definitions: ResourceFieldDefinition[]) {
  const metadataShape: Record<string, z.ZodTypeAny> = {}

  for (const def of definitions) {
    let field: z.ZodTypeAny

    if (def.field_type === 'number') {
      field = z.coerce.number({ invalid_type_error: 'Muss eine Zahl sein' })
    } else if (def.field_type === 'boolean') {
      field = z.boolean()
    } else if (def.field_type === 'date') {
      field = z.string()
    } else {
      field = z.string()
    }

    if (!def.is_required) {
      field = field instanceof z.ZodString
        ? (field as z.ZodString).optional()
        : field.optional()
    } else if (def.field_type === 'text' || def.field_type === 'date') {
      field = (field as z.ZodString).min(1, `${def.label} ist erforderlich`)
    }

    metadataShape[def.name] = field
  }

  return z.object({
    name: z.string().min(1, 'Name ist erforderlich').max(100),
    description: z.string().max(500).optional(),
    is_active: z.boolean(),
    metadata: z.object(metadataShape),
  })
}

type FormValues = {
  name: string
  description?: string
  is_active: boolean
  metadata: Record<string, unknown>
}

interface Props {
  resource?: Resource
  onSubmit: (values: FormValues) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ResourceForm({ resource, onSubmit, onCancel, isLoading }: Props) {
  const { data: definitions = [] } = useFieldDefinitions()
  const { data: priceClasses = [] } = useResourceClasses()
  const { data: locations = [] } = useLocations()
  const locationNames = locations.filter((l) => l.is_active).map((l) => l.name)
  const schema = buildSchema(definitions)

  const existingMeta = (resource?.metadata ?? {}) as Record<string, unknown>

  const defaultMetadata: Record<string, unknown> = {}
  for (const def of definitions) {
    defaultMetadata[def.name] = existingMeta[def.name] ?? (def.field_type === 'boolean' ? false : '')
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: resource?.name ?? '',
      description: resource?.description ?? '',
      is_active: resource?.is_active ?? true,
      metadata: defaultMetadata,
    },
  })

  useEffect(() => {
    const meta: Record<string, unknown> = {}
    for (const def of definitions) {
      meta[def.name] = existingMeta[def.name] ?? (def.field_type === 'boolean' ? false : '')
    }
    reset({
      name: resource?.name ?? '',
      description: resource?.description ?? '',
      is_active: resource?.is_active ?? true,
      metadata: meta,
    })
  }, [resource, definitions]) // eslint-disable-line react-hooks/exhaustive-deps

  const metaErrors = (errors.metadata ?? {}) as Record<string, { message?: string }>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Basisfelder */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="name">Name</label>
        <input
          id="name"
          {...register('name')}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
            errors.name ? 'border-destructive' : 'border-input',
          )}
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="description">Beschreibung</label>
        <textarea
          id="description"
          rows={2}
          {...register('description')}
          className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input id="is_active" type="checkbox" {...register('is_active')} className="h-4 w-4 rounded border-input" />
        <label className="text-sm font-medium" htmlFor="is_active">Aktiv</label>
      </div>

      {/* Dynamische Felder */}
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
                  <label className="text-sm font-medium" htmlFor={`metadata.${def.name}`}>
                    {def.label}
                  </label>
                </div>
              )
            }

            // Preisgruppe als Dropdown aus den Preislisten-Klassen (verhindert
            // Tippfehler wie "A_LKW"/"PKW E"). Angezeigt wird der sprechende
            // Anzeigename, gespeichert der technische Klassen-Code. Aktueller
            // Wert bleibt wählbar, auch wenn er keiner gültigen Klasse entspricht.
            if (isPriceGroupField(def.name)) {
              const current = String(existingMeta[def.name] ?? '')
              const known = priceClasses.some((c) => c.name === current)
              // Klassen nach Kategorie gruppieren (Reihenfolge kommt schon
              // sortiert aus dem Service: PKW → Transporter → Anhänger → …).
              const groups: { category: string; items: typeof priceClasses }[] = []
              for (const cls of priceClasses) {
                let g = groups.find((x) => x.category === cls.category)
                if (!g) { g = { category: cls.category, items: [] }; groups.push(g) }
                g.items.push(cls)
              }
              return (
                <div key={def.id} className="space-y-1">
                  <label className="text-sm font-medium" htmlFor={`metadata.${def.name}`}>
                    {def.label}{def.is_required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <select
                    id={`metadata.${def.name}`}
                    {...register(`metadata.${def.name}` as never)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background',
                      fieldError ? 'border-destructive' : 'border-input',
                    )}
                  >
                    <option value="">— Preisgruppe wählen —</option>
                    {current && !known && (
                      <option value={current}>{current} (unbekannt)</option>
                    )}
                    {groups.map((g) => (
                      <optgroup key={g.category} label={g.category}>
                        {g.items.map((cls) => (
                          <option key={cls.name} value={cls.name}>{cls.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {priceClasses.length === 0 && (
                    <p className="text-xs text-amber-700">
                      Keine Preisgruppen gefunden. Bitte zuerst Preislisten-Einträge anlegen.
                    </p>
                  )}
                  {fieldError && <p className="text-destructive text-xs">{fieldError}</p>}
                </div>
              )
            }

            // Homebase / Aktueller Standort als Dropdown aus den Standorten
            // (verhindert Tippfehler/Schreibvarianten). Aktueller Wert bleibt
            // wählbar, auch wenn er (noch) kein gepflegter Standort ist.
            if (isLocationField(def.name)) {
              const current = String(existingMeta[def.name] ?? '')
              const options = current && !locationNames.includes(current)
                ? [current, ...locationNames]
                : locationNames
              return (
                <div key={def.id} className="space-y-1">
                  <label className="text-sm font-medium" htmlFor={`metadata.${def.name}`}>
                    {def.label}{def.is_required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <select
                    id={`metadata.${def.name}`}
                    {...register(`metadata.${def.name}` as never)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background',
                      fieldError ? 'border-destructive' : 'border-input',
                    )}
                  >
                    <option value="">— Standort wählen —</option>
                    {options.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}{current === loc && !locationNames.includes(loc) ? ' (unbekannt)' : ''}
                      </option>
                    ))}
                  </select>
                  {locationNames.length === 0 && (
                    <p className="text-xs text-amber-700">
                      Keine Standorte gefunden. Bitte zuerst unter „Standorte" anlegen.
                    </p>
                  )}
                  {fieldError && <p className="text-destructive text-xs">{fieldError}</p>}
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
