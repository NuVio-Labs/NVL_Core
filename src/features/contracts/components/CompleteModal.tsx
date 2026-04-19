import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertCircle } from 'lucide-react'
import { useCompleteContract } from '../hooks/useContracts'
import type { ContractWithDetails } from '../types'

const completeSchema = z.object({
  return_actual_at: z.string().min(1, 'Rückgabedatum erforderlich'),
  km_end: z.coerce.number().optional(),
  tank_return_full: z.boolean().optional(),
  returned_by: z.string().optional(),
  payment_status: z.enum(['open', 'partial', 'paid']),
  payment_method: z.enum(['cash', 'card', 'transfer']).optional(),
})

type CompleteValues = z.infer<typeof completeSchema>

const inputCls = 'w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
const checkCls = 'w-4 h-4 rounded border-border'

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16)
}

function toIso(local: string): string | null {
  if (!local) return null
  return new Date(local).toISOString()
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface Props {
  contract: ContractWithDetails
  onClose: () => void
}

export function CompleteModal({ contract, onClose }: Props) {
  const completeContract = useCompleteContract()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompleteValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      return_actual_at: toDatetimeLocal(new Date().toISOString()),
      km_end: contract.km_end ?? undefined,
      tank_return_full: false,
      payment_status: (contract.payment_status as CompleteValues['payment_status']) ?? 'open',
      payment_method: (contract.payment_method as CompleteValues['payment_method']) ?? undefined,
    },
  })

  async function onSubmit(values: CompleteValues) {
    setError(null)
    try {
      await completeContract.mutateAsync({
        id: contract.id,
        payload: {
          return_actual_at: toIso(values.return_actual_at),
          km_end: values.km_end ?? null,
          tank_return_full: values.tank_return_full ?? null,
          returned_by: values.returned_by || null,
          payment_status: values.payment_status,
          payment_method: values.payment_method ?? null,
        },
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background border border-border rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Vertrag abschließen</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Vertrag <span className="font-medium text-foreground">#{String(contract.contract_number).padStart(4, '0')}</span> wird auf <em>Abgeschlossen</em> gesetzt und gesperrt.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Field label="Tatsächliche Rückgabe *" error={errors.return_actual_at?.message}>
            <input type="datetime-local" {...register('return_actual_at')} className={inputCls} />
          </Field>
          <Field label="KM-Stand Rückgabe">
            <input type="number" {...register('km_end')} className={inputCls} />
          </Field>
          <Field label="Rückgabe entgegengenommen von">
            <input {...register('returned_by')} className={inputCls} placeholder="Name des Mitarbeiters" />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('tank_return_full')} className={checkCls} />
            Tank voll zurückgegeben
          </label>
          <Field label="Zahlungsstatus" error={errors.payment_status?.message}>
            <select {...register('payment_status')} className={inputCls}>
              <option value="open">Offen</option>
              <option value="partial">Teilzahlung</option>
              <option value="paid">Bezahlt</option>
            </select>
          </Field>
          <Field label="Zahlungsart">
            <select {...register('payment_method')} className={inputCls}>
              <option value="">— wählen —</option>
              <option value="cash">Bar</option>
              <option value="card">Kreditkarte</option>
              <option value="transfer">Überweisung</option>
            </select>
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">
              Abbrechen
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Abschließen…' : 'Vertrag abschließen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
