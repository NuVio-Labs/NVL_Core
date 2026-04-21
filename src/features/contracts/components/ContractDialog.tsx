import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import { useResources } from '@/features/resources/hooks/useResources'
import { useCustomers } from '@/features/customers'
import { useCreateContract, useUpdateContract } from '../hooks/useContracts'
import { useFeatureOcrScan } from '../hooks/useFeatureOcrScan'
import { CompleteModal } from './CompleteModal'
import { PrintDialog } from './PrintDialog'
import { LicenseScanButton } from './LicenseScanButton'
import { ContractAuditLog } from './ContractAuditLog'
import type { ScannedLicenseData } from './LicenseScanButton'
import type { ContractWithDetails, ContractExtras, ContractSecondRenter } from '../types'
import type { BookingWithCreator } from '@/features/bookings/types'

// ─── Schema ──────────────────────────────────────────────────────────────────

const secondRenterSchema = z.object({
  first_name: z.string().min(1, 'Vorname erforderlich'),
  last_name: z.string().min(1, 'Nachname erforderlich'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  id_number: z.string().optional(),
  license_class: z.string().optional(),
  license_number: z.string().optional(),
})

const extrasSchema = z.object({
  vk_sb_reduction: z.boolean().optional(),
  vk_sb_amount: z.coerce.number().optional(),
  km_package_100: z.boolean().optional(),
  km_package_100_amount: z.coerce.number().optional(),
  km_package_300: z.boolean().optional(),
  km_package_300_amount: z.coerce.number().optional(),
  km_package_500: z.boolean().optional(),
  km_package_500_amount: z.coerce.number().optional(),
  km_package_1000: z.boolean().optional(),
  km_package_1000_amount: z.coerce.number().optional(),
})

const schema = z.object({
  customer_id: z.string().optional(),
  first_name: z.string().min(1, 'Vorname erforderlich'),
  last_name: z.string().min(1, 'Nachname erforderlich'),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  date_of_birth: z.string().optional(),
  id_number: z.string().optional(),
  license_class: z.string().optional(),
  license_number: z.string().optional(),

  has_second_renter: z.boolean().optional(),
  second_renter: secondRenterSchema.optional(),

  resource_id: z.string().optional(),
  handover_at: z.string().optional(),
  handover_location: z.string().optional(),
  return_agreed_at: z.string().optional(),
  return_location: z.string().optional(),
  km_start: z.coerce.number().optional(),
  km_end: z.coerce.number().optional(),
  km_free: z.coerce.number().optional(),

  price_per_day: z.coerce.number().optional(),
  price_base: z.coerce.number().optional(),
  price_per_km: z.coerce.number().optional(),
  tax_rate: z.coerce.number().optional(),
  advance_rent: z.coerce.number().optional(),
  advance_deposit: z.coerce.number().optional(),

  extras: extrasSchema.optional(),

  tank_full: z.boolean().optional(),
  loading_gate: z.boolean().optional(),
  tachograph: z.boolean().optional(),
  damage: z.boolean().optional(),
  damage_notes: z.string().optional(),

  payment_status: z.enum(['open', 'partial', 'paid']),
  payment_method: z.enum(['cash', 'card', 'transfer']).optional(),
  credit_card_last4: z.string().max(4).optional(),

  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function toIso(local: string): string | null {
  if (!local) return null
  return new Date(local).toISOString()
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function formatEur(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0
  const diff = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({
  label, error, children, span,
}: {
  label: string; error?: string; children: React.ReactNode; span?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-1', span && 'col-span-full')}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
const checkCls = 'w-4 h-4 rounded border-border'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 mt-2">
      {children}
    </h3>
  )
}

function Collapsible({ label, open, onToggle, children }: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="col-span-full border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium"
      >
        {label}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── PriceSummary ─────────────────────────────────────────────────────────────

function PriceSummary({ values }: { values: Partial<FormValues> }) {
  const days = daysBetween(values.handover_at ?? '', values.return_agreed_at ?? '')
  const pricePerDay = values.price_per_day ?? 0
  const priceBase = values.price_base ?? (days > 0 && pricePerDay > 0 ? days * pricePerDay : 0)
  const kmDriven = (values.km_end ?? 0) - (values.km_start ?? 0)
  const kmFree = values.km_free ?? 0
  const kmExtra = Math.max(0, kmDriven - kmFree)
  const pricePerKm = values.price_per_km ?? 0
  const kmCost = kmExtra * pricePerKm

  const extras = values.extras ?? {}
  let extrasTotal = 0
  if (extras.vk_sb_reduction) extrasTotal += extras.vk_sb_amount ?? 0
  if (extras.km_package_100) extrasTotal += extras.km_package_100_amount ?? 0
  if (extras.km_package_300) extrasTotal += extras.km_package_300_amount ?? 0
  if (extras.km_package_500) extrasTotal += extras.km_package_500_amount ?? 0
  if (extras.km_package_1000) extrasTotal += extras.km_package_1000_amount ?? 0

  const taxRate = values.tax_rate ?? 0
  const net = priceBase + kmCost + extrasTotal
  const tax = net * (taxRate / 100)
  const gross = net + tax

  if (net === 0) return null

  return (
    <div className="col-span-full rounded-md border border-border bg-muted/30 px-4 py-3 space-y-1.5 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preisübersicht</p>
      {days > 0 && pricePerDay > 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>{days} Tag{days !== 1 ? 'e' : ''} × {formatEur(pricePerDay)}</span>
          <span>{formatEur(days * pricePerDay)}</span>
        </div>
      )}
      {kmCost > 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>{kmExtra} km × {formatEur(pricePerKm)}</span>
          <span>{formatEur(kmCost)}</span>
        </div>
      )}
      {extrasTotal > 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>Extras</span>
          <span>{formatEur(extrasTotal)}</span>
        </div>
      )}
      {taxRate > 0 && (
        <div className="flex justify-between text-muted-foreground border-t border-border pt-1.5">
          <span>MwSt. {taxRate}%</span>
          <span>{formatEur(tax)}</span>
        </div>
      )}
      <div className="flex justify-between font-semibold border-t border-border pt-1.5">
        <span>Gesamt (brutto)</span>
        <span>{formatEur(gross)}</span>
      </div>
      {(values.advance_rent ?? 0) > 0 && (
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Vorauszahlung Miete</span>
          <span>−{formatEur(values.advance_rent ?? 0)}</span>
        </div>
      )}
      {(values.advance_deposit ?? 0) > 0 && (
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Kaution hinterlegt</span>
          <span>{formatEur(values.advance_deposit ?? 0)}</span>
        </div>
      )}
    </div>
  )
}

// ─── ContractDialog ───────────────────────────────────────────────────────────

interface Props {
  open: boolean
  contract?: ContractWithDetails
  prefillBooking?: BookingWithCreator
  onClose: () => void
}

export function ContractDialog({ open, contract, prefillBooking, onClose }: Props) {
  const isEdit = !!contract
  const isLocked = contract?.is_locked ?? false
  const canComplete = isEdit && !isLocked && contract.status !== 'cancelled' && contract.status !== 'completed'

  const [completeOpen, setCompleteOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [extrasOpen, setExtrasOpen] = useState(false)
  const [secondRenterOpen, setSecondRenterOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { user } = useAuth()
  const { data: resources = [] } = useResources()
  const { data: customers = [] } = useCustomers()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const ocrEnabled = useFeatureOcrScan()

  const ocrConsentLog = useRef<Array<{ profile_id: string; scanned_at: string; document_type: string; fields_extracted: string[] }>>([])

  // Reset consent log when dialog opens
  useEffect(() => {
    if (open) ocrConsentLog.current = []
  }, [open])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', payment_status: 'open' },
  })
  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors, isSubmitting } } = form

  function handleScanResult(data: ScannedLicenseData, mode: 'license_front' | 'id_back') {
    const extracted: string[] = []
    if (data.first_name) { setValue('first_name', data.first_name); extracted.push('first_name') }
    if (data.last_name) { setValue('last_name', data.last_name); extracted.push('last_name') }
    if (data.date_of_birth) { setValue('date_of_birth', data.date_of_birth); extracted.push('date_of_birth') }
    if (data.license_number) { setValue('license_number', data.license_number); extracted.push('license_number') }
    if (data.license_class) { setValue('license_class', data.license_class); extracted.push('license_class') }
    if (data.street) { setValue('street', data.street); extracted.push('street') }
    if (data.city) { setValue('city', data.city); extracted.push('city') }
    if (user && extracted.length > 0) {
      ocrConsentLog.current.push({
        profile_id: user.id,
        scanned_at: new Date().toISOString(),
        document_type: mode,
        fields_extracted: extracted,
      })
    }
  }

  // Live watch for price summary
  const watchedValues = useWatch({ control })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)

    if (contract) {
      const ext = (contract.extras ?? {}) as ContractExtras
      const sr = contract.second_renter as ContractSecondRenter | null

      reset({
        customer_id: (contract as { customer_id?: string | null }).customer_id ?? '',
        first_name: contract.first_name,
        last_name: contract.last_name,
        phone: contract.phone ?? '',
        street: contract.street ?? '',
        city: contract.city ?? '',
        date_of_birth: toDateInput(contract.date_of_birth),
        id_number: contract.id_number ?? '',
        license_class: contract.license_class ?? '',
        license_number: contract.license_number ?? '',
        has_second_renter: !!sr,
        second_renter: sr ? {
          first_name: sr.first_name ?? '',
          last_name: sr.last_name ?? '',
          phone: sr.phone ?? '',
          date_of_birth: sr.date_of_birth ?? '',
          id_number: sr.id_number ?? '',
          license_class: sr.license_class ?? '',
          license_number: sr.license_number ?? '',
        } : undefined,
        resource_id: contract.resource_id ?? '',
        handover_at: toDatetimeLocal(contract.handover_at),
        handover_location: contract.handover_location ?? '',
        return_agreed_at: toDatetimeLocal(contract.return_agreed_at),
        return_location: contract.return_location ?? '',
        km_start: contract.km_start ?? undefined,
        km_end: contract.km_end ?? undefined,
        km_free: contract.km_free ?? undefined,
        price_per_day: contract.price_per_day ?? undefined,
        price_base: contract.price_base ?? undefined,
        price_per_km: contract.price_per_km ?? undefined,
        tax_rate: contract.tax_rate ?? undefined,
        advance_rent: contract.advance_rent ?? undefined,
        advance_deposit: contract.advance_deposit ?? undefined,
        extras: {
          vk_sb_reduction: ext.vk_sb_reduction ?? false,
          vk_sb_amount: ext.vk_sb_amount ?? undefined,
          km_package_100: ext.km_package_100 ?? false,
          km_package_100_amount: ext.km_package_100_amount ?? undefined,
          km_package_300: ext.km_package_300 ?? false,
          km_package_300_amount: ext.km_package_300_amount ?? undefined,
          km_package_500: ext.km_package_500 ?? false,
          km_package_500_amount: ext.km_package_500_amount ?? undefined,
          km_package_1000: ext.km_package_1000 ?? false,
          km_package_1000_amount: ext.km_package_1000_amount ?? undefined,
        },
        tank_full: contract.tank_full ?? false,
        loading_gate: contract.loading_gate ?? false,
        tachograph: contract.tachograph ?? false,
        damage: contract.damage ?? false,
        damage_notes: contract.damage_notes ?? '',
        payment_status: (contract.payment_status as FormValues['payment_status']) ?? 'open',
        payment_method: (contract.payment_method as FormValues['payment_method']) ?? undefined,
        credit_card_last4: contract.credit_card_last4 ?? '',
        status: (contract.status as FormValues['status']) ?? 'draft',
        notes: contract.notes ?? '',
      })

      if (sr) setSecondRenterOpen(true)
      const hasExtras = Object.values(ext).some(Boolean)
      if (hasExtras) setExtrasOpen(true)
    } else if (prefillBooking) {
      reset({
        status: 'draft',
        payment_status: 'open',
        first_name: prefillBooking.first_name,
        last_name: prefillBooking.last_name,
        phone: prefillBooking.phone ?? '',
        resource_id: prefillBooking.resource_id,
        handover_at: toDatetimeLocal(prefillBooking.starts_at),
        return_agreed_at: toDatetimeLocal(prefillBooking.ends_at),
        price_base: prefillBooking.price_snapshot ?? undefined,
      })
    } else {
      reset({ status: 'draft', payment_status: 'open' })
    }
  }, [open, contract, prefillBooking, reset])

  const watchedCustomerId = watch('customer_id')
  const damageChecked = watch('damage')
  const paymentMethod = watch('payment_method')
  const hasSecondRenter = watch('has_second_renter')
  const extrasValues = watch('extras')

  useEffect(() => {
    if (!watchedCustomerId) return
    const c = customers.find((x) => x.id === watchedCustomerId)
    if (!c) return
    setValue('first_name', c.first_name)
    setValue('last_name', c.last_name)
    if (c.phone) setValue('phone', c.phone)
    if (c.street) setValue('street', c.street)
    if (c.city) setValue('city', c.city)
  }, [watchedCustomerId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    try {
      const sr = values.has_second_renter && values.second_renter
        ? { ...values.second_renter }
        : null

      const payload = {
        customer_id: values.customer_id || null,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || null,
        street: values.street || null,
        city: values.city || null,
        date_of_birth: values.date_of_birth || null,
        id_number: values.id_number || null,
        license_class: values.license_class || null,
        license_number: values.license_number || null,
        second_renter: sr,
        resource_id: values.resource_id || null,
        booking_id: prefillBooking?.id ?? contract?.booking_id ?? null,
        handover_at: toIso(values.handover_at ?? ''),
        handover_location: values.handover_location || null,
        return_agreed_at: toIso(values.return_agreed_at ?? ''),
        return_location: values.return_location || null,
        km_start: values.km_start ?? null,
        km_end: values.km_end ?? null,
        km_free: values.km_free ?? null,
        price_per_day: values.price_per_day ?? null,
        price_base: values.price_base ?? null,
        price_per_km: values.price_per_km ?? null,
        tax_rate: values.tax_rate ?? null,
        advance_rent: values.advance_rent ?? null,
        advance_deposit: values.advance_deposit ?? null,
        extras: values.extras ?? {},
        tank_full: values.tank_full ?? null,
        loading_gate: values.loading_gate ?? null,
        tachograph: values.tachograph ?? null,
        damage: values.damage ?? null,
        damage_notes: values.damage_notes || null,
        payment_status: values.payment_status,
        payment_method: values.payment_method ?? null,
        credit_card_last4: values.payment_method === 'card' ? (values.credit_card_last4 || null) : null,
        status: values.status,
        notes: values.notes || null,
        ...(ocrConsentLog.current.length > 0 ? { ocr_consent_log: ocrConsentLog.current } : {}),
      }

      if (isEdit && contract) {
        await updateContract.mutateAsync({ id: contract.id, payload })
      } else {
        await createContract.mutateAsync(payload)
      }
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    }
  }

  if (!open) return null

  const disabled = isLocked || isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-background border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] mx-4 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit
                ? `Vertrag #${String(contract.contract_number).padStart(4, '0')}`
                : prefillBooking
                  ? `Vertrag aus Buchung — ${prefillBooking.first_name} ${prefillBooking.last_name}`
                  : 'Neuer Vertrag'}
            </h2>
            {isLocked && (
              <p className="text-xs text-muted-foreground mt-0.5">Abgeschlossener Vertrag — nur lesbar</p>
            )}
            {isEdit && !isLocked && (
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                Status: <span className="font-medium text-foreground">{contract.status}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">

            {/* ── Kunde verknüpfen ── */}
            {customers.length > 0 && (
              <Field label="Kunde aus Kundenliste (optional)" span>
                <select
                  {...register('customer_id')}
                  disabled={disabled}
                  className={inputCls}
                >
                  <option value="">— Kein Kunde verknüpft —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.last_name}, {c.first_name}{c.phone ? ` · ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* ── Mieter 1 ── */}
            <SectionTitle>Mieter 1</SectionTitle>

            <Field label="Vorname *" error={errors.first_name?.message}>
              <input {...register('first_name')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Nachname *" error={errors.last_name?.message}>
              <input {...register('last_name')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Telefon">
              <input {...register('phone')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Geburtsdatum">
              <input type="date" {...register('date_of_birth')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Straße / Hausnummer" span>
              <input {...register('street')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Stadt / PLZ" span>
              <input {...register('city')} disabled={disabled} className={inputCls} />
            </Field>

            <SectionTitle>Führerschein</SectionTitle>

            <div className="col-span-full flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>PAuswG § 20:</strong> Keine Personalausweis-Seriennummer speichern. Führerschein-Nr. und Reisepass-Nr. sind erlaubt.
              </span>
            </div>

            {ocrEnabled && !disabled && (
              <LicenseScanButton onResult={handleScanResult} disabled={disabled} />
            )}

            <Field label="Führerscheinklasse">
              <select {...register('license_class')} disabled={disabled} className={inputCls}>
                <option value="">— wählen —</option>
                <option value="B">B</option>
                <option value="BE">BE</option>
                <option value="C">C</option>
                <option value="CE">CE</option>
                <option value="C1">C1</option>
                <option value="C1E">C1E</option>
                <option value="L">L</option>
                <option value="T">T</option>
              </select>
            </Field>
            <Field label="Führerscheinnummer">
              <input {...register('license_number')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Dokument-Nr. (kein PA)" span>
              <input {...register('id_number')} disabled={disabled} className={inputCls} placeholder="Reisepass-Nr. o.ä." />
            </Field>

            {/* ── Zweiter Mieter ── */}
            <Collapsible
              label={hasSecondRenter ? 'Zweiter Mieter (ausgefüllt)' : 'Zweiter Mieter hinzufügen'}
              open={secondRenterOpen}
              onToggle={() => setSecondRenterOpen((v) => !v)}
            >
              <div className="col-span-full">
                <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                  <input type="checkbox" {...register('has_second_renter')} disabled={disabled} className={checkCls} />
                  Zweiten Mieter eintragen
                </label>
              </div>

              {hasSecondRenter && (
                <>
                  <Field label="Vorname *" error={errors.second_renter?.first_name?.message}>
                    <input {...register('second_renter.first_name')} disabled={disabled} className={inputCls} />
                  </Field>
                  <Field label="Nachname *" error={errors.second_renter?.last_name?.message}>
                    <input {...register('second_renter.last_name')} disabled={disabled} className={inputCls} />
                  </Field>
                  <Field label="Telefon">
                    <input {...register('second_renter.phone')} disabled={disabled} className={inputCls} />
                  </Field>
                  <Field label="Geburtsdatum">
                    <input type="date" {...register('second_renter.date_of_birth')} disabled={disabled} className={inputCls} />
                  </Field>
                  <Field label="Führerscheinklasse">
                    <select {...register('second_renter.license_class')} disabled={disabled} className={inputCls}>
                      <option value="">— wählen —</option>
                      <option value="B">B</option>
                      <option value="BE">BE</option>
                      <option value="C">C</option>
                      <option value="CE">CE</option>
                      <option value="C1">C1</option>
                      <option value="C1E">C1E</option>
                      <option value="L">L</option>
                      <option value="T">T</option>
                    </select>
                  </Field>
                  <Field label="Führerscheinnummer">
                    <input {...register('second_renter.license_number')} disabled={disabled} className={inputCls} />
                  </Field>
                  <Field label="Dokument-Nr. (kein PA)" span>
                    <input {...register('second_renter.id_number')} disabled={disabled} className={inputCls} placeholder="Reisepass-Nr. o.ä." />
                  </Field>
                </>
              )}
            </Collapsible>

            {/* ── Fahrzeug & Zeiten ── */}
            <SectionTitle>Fahrzeug & Zeiten</SectionTitle>

            <Field label="Fahrzeug" span>
              <select {...register('resource_id')} disabled={disabled} className={inputCls}>
                <option value="">— Fahrzeug wählen —</option>
                {resources.map((r) => {
                  const meta = (r.metadata ?? {}) as Record<string, unknown>
                  const kz = meta.kennzeichen as string | undefined
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name}{kz ? ` (${kz})` : ''}
                    </option>
                  )
                })}
              </select>
            </Field>

            <Field label="Übergabe am">
              <input type="datetime-local" {...register('handover_at')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Übergabeort">
              <input {...register('handover_location')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Rückgabe vereinbart am">
              <input type="datetime-local" {...register('return_agreed_at')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Rückgabeort">
              <input {...register('return_location')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="KM-Stand Übergabe">
              <input type="number" {...register('km_start')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="KM-Stand Rückgabe">
              <input type="number" {...register('km_end')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Freie Kilometer">
              <input type="number" {...register('km_free')} disabled={disabled} className={inputCls} />
            </Field>

            {/* ── Preise ── */}
            <SectionTitle>Preise</SectionTitle>

            <Field label="Preis/Tag (€)">
              <input type="number" step="0.01" {...register('price_per_day')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Gesamtpreis Miete (€)">
              <input type="number" step="0.01" {...register('price_base')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Preis/km Mehrkilometer (€)">
              <input type="number" step="0.01" {...register('price_per_km')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="MwSt. (%)">
              <input type="number" step="0.01" {...register('tax_rate')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Vorauszahlung Miete (€)">
              <input type="number" step="0.01" {...register('advance_rent')} disabled={disabled} className={inputCls} />
            </Field>
            <Field label="Kaution (€)">
              <input type="number" step="0.01" {...register('advance_deposit')} disabled={disabled} className={inputCls} />
            </Field>

            {/* ── Extras ── */}
            <Collapsible
              label={Object.values(extrasValues ?? {}).some(Boolean) ? 'Extras (aktiv)' : 'Extras / Zusatzpakete'}
              open={extrasOpen}
              onToggle={() => setExtrasOpen((v) => !v)}
            >
              {([
                ['vk_sb_reduction', 'VK-SB Reduktion', 'vk_sb_amount'],
                ['km_package_100', '+100 km Paket', 'km_package_100_amount'],
                ['km_package_300', '+300 km Paket', 'km_package_300_amount'],
                ['km_package_500', '+500 km Paket', 'km_package_500_amount'],
                ['km_package_1000', '+1000 km Paket', 'km_package_1000_amount'],
              ] as const).map(([checkKey, label, amountKey]) => (
                <div key={checkKey} className="col-span-full flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      {...register(`extras.${checkKey}`)}
                      disabled={disabled}
                      className={checkCls}
                    />
                    {label}
                  </label>
                  {watch(`extras.${checkKey}`) && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Betrag €"
                        {...register(`extras.${amountKey}`)}
                        disabled={disabled}
                        className="w-28 px-2 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              ))}
            </Collapsible>

            {/* ── Preisübersicht ── */}
            <PriceSummary values={watchedValues as Partial<FormValues>} />

            {/* ── Fahrzeugzustand ── */}
            <SectionTitle>Fahrzeugzustand bei Übergabe</SectionTitle>

            <div className="col-span-full flex flex-wrap gap-5">
              {([
                ['tank_full', 'Tank voll'],
                ['loading_gate', 'Laderampe vorhanden'],
                ['tachograph', 'Tachograph vorhanden'],
                ['damage', 'Schäden vorhanden'],
              ] as const).map(([name, label]) => (
                <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register(name)} disabled={disabled} className={checkCls} />
                  {label}
                </label>
              ))}
            </div>

            {damageChecked && (
              <Field label="Schadensbeschreibung" error={errors.damage_notes?.message} span>
                <textarea
                  {...register('damage_notes')}
                  disabled={disabled}
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                />
              </Field>
            )}

            {/* ── Zahlung & Status ── */}
            <SectionTitle>Zahlung & Status</SectionTitle>

            <Field label="Zahlungsstatus" error={errors.payment_status?.message}>
              <select {...register('payment_status')} disabled={disabled} className={inputCls}>
                <option value="open">Offen</option>
                <option value="partial">Teilzahlung</option>
                <option value="paid">Bezahlt</option>
              </select>
            </Field>
            <Field label="Zahlungsart">
              <select {...register('payment_method')} disabled={disabled} className={inputCls}>
                <option value="">— wählen —</option>
                <option value="cash">Bar</option>
                <option value="card">Kreditkarte</option>
                <option value="transfer">Überweisung</option>
              </select>
            </Field>

            {paymentMethod === 'card' && (
              <Field label="Kreditkarte (letzte 4 Ziffern)">
                <input
                  {...register('credit_card_last4')}
                  maxLength={4}
                  disabled={disabled}
                  className={inputCls}
                  placeholder="0000"
                />
              </Field>
            )}

            <Field label="Vertragsstatus">
              <select {...register('status')} disabled={disabled} className={inputCls}>
                <option value="draft">Entwurf</option>
                <option value="active">Aktiv</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Storniert</option>
              </select>
            </Field>

            <Field label="Interne Notizen" span>
              <textarea
                {...register('notes')}
                disabled={disabled}
                rows={3}
                className={cn(inputCls, 'resize-none')}
              />
            </Field>

          </div>
        </form>

        {/* Verlauf */}
        {isEdit && contract?.id && (
          <details className="px-6 py-3 border-t border-border shrink-0">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
              Änderungsverlauf
            </summary>
            <div className="mt-3">
              <ContractAuditLog contractId={contract.id} />
            </div>
          </details>
        )}

        {/* Datenschutz */}
        <div className="px-6 py-2 border-t border-border shrink-0 text-xs text-muted-foreground">
          Mit dem Speichern bestätigen Sie, dass Sie die{' '}
          <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            Datenschutzerklärung
          </a>{' '}
          gelesen haben.
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3">
            {canComplete && (
              <button
                type="button"
                onClick={() => setCompleteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-green-600 text-green-700 hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Abschließen
              </button>
            )}
            {isEdit && (
              <button
                type="button"
                onClick={() => setPrintOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                <Printer className="w-4 h-4" />
                Drucken
              </button>
            )}
            {submitError && (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {submitError}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              {isLocked ? 'Schließen' : 'Abbrechen'}
            </button>
            {!isLocked && (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Speichern…' : isEdit ? 'Speichern' : 'Vertrag anlegen'}
              </button>
            )}
          </div>
        </div>
      </div>

      {completeOpen && contract && (
        <CompleteModal
          contract={contract}
          onClose={() => { setCompleteOpen(false); onClose() }}
        />
      )}
      {printOpen && contract && (
        <PrintDialog
          contract={contract}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  )
}
