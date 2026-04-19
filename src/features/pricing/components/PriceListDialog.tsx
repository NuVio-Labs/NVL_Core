import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PriceList } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  priceList?: PriceList
  onSubmit: (values: FormValues) => void
  onClose: () => void
  isLoading?: boolean
}

export function PriceListDialog({ open, priceList, onSubmit, onClose, isLoading }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', is_active: true },
  })

  useEffect(() => {
    reset({
      name: priceList?.name ?? '',
      description: priceList?.description ?? '',
      is_active: priceList?.is_active ?? true,
    })
  }, [priceList, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background border border-border rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            {priceList ? 'Preisliste bearbeiten' : 'Preisliste anlegen'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
