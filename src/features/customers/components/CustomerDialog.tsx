import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers'
import type { Customer } from '../types'

const schema = z.object({
  first_name: z.string().min(1, 'Vorname erforderlich'),
  last_name: z.string().min(1, 'Nachname erforderlich'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  customer?: Customer | null
  onClose: () => void
}

export function CustomerDialog({ open, customer, onClose }: Props) {
  const isEdit = !!customer
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!open) return
    if (customer) {
      reset({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        street: customer.street ?? '',
        city: customer.city ?? '',
        notes: customer.notes ?? '',
      })
    } else {
      reset({ first_name: '', last_name: '', email: '', phone: '', street: '', city: '', notes: '' })
    }
  }, [open, customer, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email || null,
      phone: values.phone || null,
      street: values.street || null,
      city: values.city || null,
      notes: values.notes || null,
    }
    if (isEdit && customer) {
      await updateCustomer.mutateAsync({ id: customer.id, payload })
    } else {
      await createCustomer.mutateAsync(payload)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-background border border-border rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">{isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Vorname *</label>
              <input {...register('first_name')} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nachname *</label>
              <input {...register('last_name')} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">E-Mail</label>
              <input {...register('email')} type="email" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Telefon</label>
              <input {...register('phone')} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Straße</label>
              <input {...register('street')} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">PLZ & Ort</label>
              <input {...register('city')} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notizen</label>
            <textarea {...register('notes')} rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Speichern…' : isEdit ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
