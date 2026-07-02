import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertTriangle, Info, UserPlus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResources } from '@/features/resources/hooks/useResources'
import { usePriceLists } from '@/features/pricing/hooks/usePriceLists'
import { usePriceListItems } from '@/features/pricing/hooks/usePriceListItems'
import { useDurationTariffMappings } from '../hooks/useDurationTariffMappings'
import { useBookingFieldDefinitions } from '../hooks/useBookingFieldDefinitions'
import { useCreateBooking, useUpdateBooking, useCancelBooking, useBookingsForRange } from '../hooks/useBookings'
import { bookingService } from '../service/bookingService'
import { ContractDataView } from './ContractDataView'
import { resourceCategory, matchPriceList, matchPriceClassItem, resolveTariff } from '../lib/pricing'
import { useConfirm } from '@/components/ConfirmDialog'
import { useCompanySettings, useWorkspace } from '@/features/workspace'
import { useCustomers, useCreateCustomer } from '@/features/customers'
import type { Booking, BookingFieldDefinition, BookingWithCreator } from '../types'
import type { Resource } from '@/features/resources/types'

function buildMetaSchema(definitions: BookingFieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const def of definitions) {
    let field: z.ZodTypeAny = def.field_type === 'number'
      ? z.coerce.number()
      : def.field_type === 'boolean'
        ? z.boolean()
        : z.string()
    if (!def.is_required) {
      field = field instanceof z.ZodString ? (field as z.ZodString).optional() : field.optional()
    } else if (def.field_type === 'text' || def.field_type === 'date') {
      field = (field as z.ZodString).min(1, `${def.label} ist erforderlich`)
    }
    shape[def.name] = field
  }
  return z.object(shape)
}

const KM_PACKAGES = [
  { key: 'km_100', label: '+100 km' },
  { key: 'km_300', label: '+300 km' },
  { key: 'km_500', label: '+500 km' },
  { key: 'km_1000', label: '+1000 km' },
] as const

// Mehrtagesbuchungen: aus dem 24h-Tarif werden virtuelle Zwischenstufen (2–6
// Tage) abgeleitet. Wert-Schema "<mappingId>×<faktor>" — der echte DB-Tarif
// bleibt unangetastet, Dauer und Preis werden mit dem Faktor multipliziert.
// 7 Tage / 30 Tage haben eigene (rabattierte) Tarife und kommen als echte
// Mappings aus der DB — diese werden NICHT über den Faktor abgebildet.
const MULTI_DAY_FACTORS = [2, 3, 4, 5, 6] as const
const DAY_MINUTES = 1440

function parseDurationValue(value: string): { mappingId: string; factor: number } {
  const [mappingId, factorStr] = value.split('×')
  const factor = factorStr ? Number(factorStr) : 1
  return { mappingId, factor: Number.isFinite(factor) && factor > 0 ? factor : 1 }
}

const baseSchema = z.object({
  customer_id: z.string().optional(),
  first_name: z.string().min(1, 'Vorname erforderlich'),
  last_name: z.string().min(1, 'Nachname erforderlich'),
  phone: z.string().min(1, 'Telefonnummer erforderlich'),
  date: z.string().min(1, 'Datum erforderlich'),
  time: z.string().min(1, 'Uhrzeit erforderlich'),
  resource_id: z.string().min(1, 'Fahrzeug erforderlich'),
  duration_mapping_id: z.string().min(1, 'Dauer erforderlich'),
  price_list_id: z.string().optional(),
  km_package: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

type FormValues = z.infer<typeof baseSchema>

interface Props {
  open: boolean
  booking?: Booking | BookingWithCreator
  initialDate?: Date
  /**
   * Beim Speichern zusätzlich status='confirmed' setzen. Für Online-Anfragen
   * (status='pending'): erst das Speichern bestätigt die Buchung verbindlich —
   * ein Abbruch lässt sie 'pending' (bleibt in der Anfragen-Liste).
   */
  confirmOnSave?: boolean
  onClose: () => void
}

function formatPrice(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}

export function BookingDialog({ open, booking, initialDate, confirmOnSave, onClose }: Props) {
  const { data: resources = [] } = useResources()
  const { data: priceLists = [] } = usePriceLists()
  const { data: durationMappings = [] } = useDurationTariffMappings()
  const { data: fieldDefinitions = [] } = useBookingFieldDefinitions()

  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()
  const cancelBooking = useCancelBooking()
  const companySettings = useCompanySettings()
  const { activeMembership } = useWorkspace()
  const preisgruppeFeld = (companySettings.booking_field_preisgruppe as string) ?? 'preisgruppe'
  const standortFeld = (companySettings.booking_field_standort as string) ?? 'aktueller_standort'

  const { data: customers = [] } = useCustomers()
  const [availability, setAvailability] = useState<boolean | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [customerType, setCustomerType] = useState<'privat' | 'gewerbe'>('privat')
  const [savedAsCustomer, setSavedAsCustomer] = useState(false)
  const [showContractData, setShowContractData] = useState(false)
  const createCustomer = useCreateCustomer()
  const confirm = useConfirm()

  const metaSchema = buildMetaSchema(fieldDefinitions)
  const schema = baseSchema

  const defaultDate = initialDate
    ? `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}`
    : ''

  const existingMeta = (booking?.metadata ?? {}) as Record<string, unknown>
  const defaultMeta: Record<string, unknown> = {}
  for (const def of fieldDefinitions) {
    defaultMeta[def.name] = existingMeta[def.name] ?? (def.field_type === 'boolean' ? false : '')
  }

  const { register, handleSubmit, reset, control, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: '',
      first_name: '', last_name: '', phone: '',
      date: defaultDate, time: '08:00',
      resource_id: '', duration_mapping_id: '', price_list_id: '',
      km_package: '', notes: '', metadata: defaultMeta,
    },
  })

  useEffect(() => {
    if (!open) return
    const meta: Record<string, unknown> = {}
    for (const def of fieldDefinitions) {
      meta[def.name] = existingMeta[def.name] ?? (def.field_type === 'boolean' ? false : '')
    }
    if (booking) {
      const start = new Date(booking.starts_at)
      // Dauer-Auswahl rekonstruieren — inkl. Mehrtages-Faktor aus dem
      // gespeicherten Zeitraum (z.B. 24h-Tarif über 3 Tage → "<id>×3").
      const baseMapping = durationMappings.find((m) => m.field_name === (booking as { duration_field?: string | null }).duration_field)
      const spanMinutes = (new Date(booking.ends_at).getTime() - start.getTime()) / 60000
      let durationValue = baseMapping?.id ?? ''
      if (baseMapping && baseMapping.duration_minutes > 0) {
        const factor = Math.round(spanMinutes / baseMapping.duration_minutes)
        if (factor >= 2 && (MULTI_DAY_FACTORS as readonly number[]).includes(factor)) {
          durationValue = `${baseMapping.id}×${factor}`
        }
      }
      reset({
        customer_id: (booking as { customer_id?: string | null }).customer_id ?? '',
        first_name: booking.first_name,
        last_name: booking.last_name,
        phone: booking.phone,
        date: start.toISOString().slice(0, 10),
        time: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        resource_id: booking.resource_id,
        duration_mapping_id: durationValue,
        price_list_id: booking.price_list_id ?? '',
        km_package: (booking as { km_package?: string | null }).km_package ?? '',
        notes: booking.notes ?? '',
        metadata: meta,
      })
    } else {
      reset({
        customer_id: '',
        first_name: '', last_name: '', phone: '',
        date: defaultDate, time: '08:00',
        resource_id: '', duration_mapping_id: '', price_list_id: '',
        km_package: '', notes: '', metadata: meta,
      })
    }
    setAvailability(null)
    setSavedAsCustomer(false)
  }, [open, booking, fieldDefinitions, durationMappings]) // eslint-disable-line react-hooks/exhaustive-deps

  const watchedCustomerId = useWatch({ control, name: 'customer_id' })
  const watchedFirstName = useWatch({ control, name: 'first_name' })
  const watchedLastName = useWatch({ control, name: 'last_name' })
  const watchedResourceId = useWatch({ control, name: 'resource_id' })
  const watchedDurationId = useWatch({ control, name: 'duration_mapping_id' })
  const watchedDate = useWatch({ control, name: 'date' })
  const watchedTime = useWatch({ control, name: 'time' })
  const watchedPriceListId = useWatch({ control, name: 'price_list_id' })
  const watchedKmPackage = useWatch({ control, name: 'km_package' })

  const selectedResource = resources.find((r) => r.id === watchedResourceId)
  const { mappingId: selectedMappingId, factor: durationFactor } = parseDurationValue(watchedDurationId ?? '')
  const selectedMapping = durationMappings.find((m) => m.id === selectedMappingId)

  // 24h-Tarif als Basis für virtuelle Mehrtages-Stufen
  const dayBaseMapping = durationMappings.find((m) => m.duration_minutes === DAY_MINUTES)

  // Filter price lists by customer type and resource category.
  // Preisgruppen sind uneinheitlich geschrieben (z.B. "C_Transporter" UND
  // "Transporter_F" UND "G_Transporter") → mit includes statt startsWith
  // prüfen, sonst landet ein Transporter fälschlich in der PKW-Liste.
  const category = selectedResource ? resourceCategory(selectedResource, preisgruppeFeld) : null

  const matchingPriceList = (!selectedResource || !category)
    ? null
    : matchPriceList(priceLists, category, customerType === 'gewerbe')

  // Auto-set price list when resource or customer type changes
  useEffect(() => {
    if (matchingPriceList) {
      setValue('price_list_id', matchingPriceList.id)
    } else {
      setValue('price_list_id', '')
    }
  }, [matchingPriceList?.id, setValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill contact fields from selected customer
  useEffect(() => {
    if (!watchedCustomerId) return
    const c = customers.find((x) => x.id === watchedCustomerId)
    if (!c) return
    setValue('first_name', c.first_name)
    setValue('last_name', c.last_name)
    if (c.phone) setValue('phone', c.phone)
  }, [watchedCustomerId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute starts_at / ends_at (Dauer × Faktor für Mehrtagesbuchungen)
  const { startsAt, endsAt } = (() => {
    if (!watchedDate || !watchedTime || !selectedMapping) return { startsAt: null, endsAt: null }
    const start = new Date(`${watchedDate}T${watchedTime}:00`)
    const end = new Date(start.getTime() + selectedMapping.duration_minutes * durationFactor * 60 * 1000)
    return { startsAt: start, endsAt: end }
  })()

  // Belegte Fahrzeuge zum gewählten Startzeitpunkt ermitteln, damit das
  // Dropdown sie rot + gesperrt anzeigen kann (idiotensicher: man kann ein
  // belegtes Fahrzeug gar nicht erst auswählen). Geprüft wird der gewählte
  // Start (Datum + Uhrzeit); die eigene Buchung beim Bearbeiten zählt nicht.
  const startMoment = (watchedDate && watchedTime) ? new Date(`${watchedDate}T${watchedTime}:00`) : null
  // Stabile Tagesgrenzen (Mitternacht) → konstanter Query-Key, keine Refetches
  // bei jedem Render. Ohne gewähltes Datum ein fester Epoch-Tag (Query läuft
  // zwar, liefert nichts Relevantes — occupiedAt bleibt leer, weil startMoment null).
  const dayStart = startMoment
    ? new Date(startMoment.getFullYear(), startMoment.getMonth(), startMoment.getDate())
    : new Date(0)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const { data: dayBookings = [] } = useBookingsForRange(dayStart, dayEnd)

  // Set der Fahrzeug-IDs, die den gewählten Startzeitpunkt belegen.
  const occupiedAt = (() => {
    const set = new Set<string>()
    if (!startMoment) return set
    for (const b of dayBookings) {
      if (booking && b.id === booking.id) continue // eigene Buchung ignorieren
      const bStart = new Date(b.starts_at)
      const bEnd = new Date(b.ends_at)
      if (bStart <= startMoment && bEnd > startMoment) {
        set.add(b.resource_id)
      }
    }
    return set
  })()

  // Check availability when resource + time changes
  useEffect(() => {
    if (!watchedResourceId || !startsAt || !endsAt) { setAvailability(null); return }
    setCheckingAvailability(true)
    bookingService
      .checkAvailability(watchedResourceId, startsAt.toISOString(), endsAt.toISOString(), booking?.id)
      .then(setAvailability)
      .finally(() => setCheckingAvailability(false))
  }, [watchedResourceId, startsAt?.toISOString(), endsAt?.toISOString()]) // eslint-disable-line react-hooks/exhaustive-deps

  // Find matching price list item by resource's Preisgruppe.
  // Daten sind uneinheitlich (z.B. Gruppe "B_PKW"/"C_Transporter", Items "B"/
  // "PKW_E"/"Transporter_C"). Deterministische Zuordnung mit klarer Priorität —
  // KEIN unscharfes Teil-Token-Matching, das die falsche Gruppe treffen kann.
  const { data: priceListItems = [] } = usePriceListItems(watchedPriceListId || undefined)
  const resourceMeta = (selectedResource?.metadata ?? {}) as Record<string, unknown>
  const preisgruppe = resourceMeta[preisgruppeFeld] as string | undefined
  const matchingItem = matchPriceClassItem(priceListItems, preisgruppe)

  // Nur die Dauern anbieten, für die das gewählte Fahrzeug (= matchingItem)
  // tatsächlich einen Tarif hat. So ergibt sich die Mindestmiete automatisch
  // aus dem kürzesten hinterlegten Tarif (z.B. PKW erst ab 24h). Ohne Fahrzeug
  // werden alle Dauern gezeigt.
  const availableDurations = (() => {
    if (!matchingItem) return durationMappings
    const meta = (matchingItem.metadata ?? {}) as Record<string, unknown>
    return durationMappings.filter((m) => {
      const v = meta[m.field_name]
      return v !== undefined && v !== null && v !== ''
    })
  })()
  // 24h-Tarif vorhanden? Nur dann Mehrtage-Stufen anbieten.
  const hasDayTarif = !!(dayBaseMapping &&
    matchingItem &&
    ((matchingItem.metadata ?? {}) as Record<string, unknown>)[dayBaseMapping.field_name] != null &&
    ((matchingItem.metadata ?? {}) as Record<string, unknown>)[dayBaseMapping.field_name] !== '')

  // Anzeigename der Preisklasse (Fallback: technischer Code)
  const matchingItemLabel = (() => {
    if (!matchingItem) return ''
    const meta = (matchingItem.metadata ?? {}) as Record<string, unknown>
    return typeof meta.label === 'string' && meta.label.trim() ? meta.label : matchingItem.name
  })()

  // Calculate price
  const { basePrice, kmPrice, calculatedPrice } = resolveTariff(
    matchingItem,
    selectedMapping?.field_name,
    durationFactor,
    watchedKmPackage || undefined,
  )

  // Fahrzeug + Dauer gewählt, aber kein Preis ermittelbar (fehlende Preisgruppe
  // ODER kein Tarifwert für diese Dauer) → klar anzeigen statt still Null buchen.
  const priceUnavailable = !!(selectedResource && selectedMapping && calculatedPrice === null)
  const missingTariff = !!(selectedResource && selectedMapping && matchingItem && calculatedPrice === null)

  // Standort warning: resource's current location vs. logged-in staff member's location
  const resourceStandort = standortFeld ? resourceMeta[standortFeld] as string | undefined : undefined
  const staffStandort = activeMembership?.location ?? undefined
  const standortMismatch = !!(
    selectedResource &&
    resourceStandort &&
    staffStandort &&
    resourceStandort.trim().toLowerCase() !== staffStandort.trim().toLowerCase()
  )

  const metaErrors = (errors.metadata ?? {}) as Record<string, { message?: string }>

  function resetForm() {
    reset({
      customer_id: '',
      first_name: '', last_name: '', phone: '',
      date: '', time: '08:00',
      resource_id: '', duration_mapping_id: '', price_list_id: '',
      km_package: '', notes: '', metadata: {},
    })
    setAvailability(null)
    setCustomerType('privat')
  }

  // Aktuelle Kontaktdaten der Buchung direkt als Kunde übernehmen + verknüpfen.
  async function handleSaveAsCustomer() {
    const v = getValues()
    if (!v.first_name?.trim() || !v.last_name?.trim()) return
    const created = await createCustomer.mutateAsync({
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      phone: v.phone?.trim() || null,
      email: null,
      street: null,
      city: null,
      notes: null,
    })
    setValue('customer_id', created.id)
    setSavedAsCustomer(true)
  }

  async function onSubmit(values: FormValues) {
    if (!startsAt || !endsAt) return

    const payload = {
      customer_id: values.customer_id || null,
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone,
      resource_id: values.resource_id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_field: selectedMapping?.field_name ?? null,
      price_list_id: values.price_list_id || null,
      price_list_item_id: matchingItem?.id ?? null,
      price_snapshot: calculatedPrice ?? null,
      notes: values.notes || null,
      metadata: values.metadata ?? {},
    }

    const me = activeMembership?.profile_id ?? null
    if (booking) {
      // Bearbeiten: nur updated_by setzen — created_by (Ersteller) bleibt unberührt.
      // Bei einer bestätigten Online-Anfrage zusätzlich status='confirmed' — erst
      // das Speichern macht die pending-Anfrage verbindlich.
      const statusPatch = confirmOnSave ? { status: 'confirmed' as const } : {}
      await updateBooking.mutateAsync({ id: booking.id, payload: { ...payload, ...statusPatch, updated_by: me } })
    } else {
      // Neu: created_by = Ersteller.
      await createBooking.mutateAsync({ ...payload, created_by: me })
    }
    resetForm()
    onClose()
  }

  async function handleCancel() {
    if (!booking) return
    const ok = await confirm({
      title: 'Buchung stornieren',
      message: 'Buchung wirklich stornieren?',
      confirmLabel: 'Stornieren',
    })
    if (!ok) return
    await cancelBooking.mutateAsync(booking.id)
    resetForm()
    onClose()
  }

  const isMutating = createBooking.isPending || updateBooking.isPending || cancelBooking.isPending

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Hintergrund schließt das Modal bewusst NICHT (Klick neben Modal /
          Fokuswechsel soll Eingaben nicht verwerfen) — nur X / Abbrechen. */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-background border border-border rounded-lg shadow-lg p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">
              {booking ? 'Buchung bearbeiten' : 'Buchung anlegen'}
            </h2>
            {booking && (() => {
              const b = booking as BookingWithCreator
              const fmt = (iso?: string | null) =>
                iso ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
              const name = (p: BookingWithCreator['creator']) => p ? (p.full_name ?? p.email) : null
              const creatorName = 'creator' in b ? name(b.creator) : null
              const updaterName = 'updater' in b ? name(b.updater) : null
              return (
                <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                  {creatorName && <p>Angelegt von {creatorName}{b.created_at ? ` · ${fmt(b.created_at)}` : ''}</p>}
                  {updaterName && <p>Zuletzt bearbeitet von {updaterName}{b.updated_at ? ` · ${fmt(b.updated_at)}` : ''}</p>}
                </div>
              )
            })()}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Kunde verknüpfen */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Kunde aus Kundenliste (optional)</label>
            <div className="flex items-center gap-2">
              {customers.length > 0 ? (
                <select
                  {...register('customer_id')}
                  className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  <option value="">— Kein Kunde verknüpft —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.last_name}, {c.first_name}{c.phone ? ` · ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="flex-1 text-sm text-muted-foreground">Noch keine Kunden angelegt.</p>
              )}
              <button
                type="button"
                onClick={handleSaveAsCustomer}
                disabled={!watchedFirstName?.trim() || !watchedLastName?.trim() || createCustomer.isPending || savedAsCustomer}
                title="Eingegebene Daten als Kunden speichern"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md border border-input text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {createCustomer.isPending ? 'Speichern…' : savedAsCustomer ? 'Gespeichert' : 'Als Kunde'}
                </span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Übernimmt Vorname, Nachname und Telefon als neuen Kunden und verknüpft ihn.
            </p>
          </div>

          {/* Kundendaten */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Vorname</label>
              <input
                {...register('first_name')}
                className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.first_name ? 'border-destructive' : 'border-input')}
              />
              {errors.first_name && <p className="text-destructive text-xs">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nachname</label>
              <input
                {...register('last_name')}
                className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.last_name ? 'border-destructive' : 'border-input')}
              />
              {errors.last_name && <p className="text-destructive text-xs">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Telefonnummer</label>
            <input
              {...register('phone')}
              type="tel"
              className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.phone ? 'border-destructive' : 'border-input')}
            />
            {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
          </div>

          {/* Datum + Uhrzeit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Datum Start</label>
              <input
                {...register('date')}
                type="date"
                className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background', errors.date ? 'border-destructive' : 'border-input')}
              />
              {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Uhrzeit Start</label>
              <input
                {...register('time')}
                type="time"
                className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background', errors.time ? 'border-destructive' : 'border-input')}
              />
            </div>
          </div>

          {/* Fahrzeug */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Fahrzeug</label>
            <select
              {...register('resource_id')}
              className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background', errors.resource_id ? 'border-destructive' : 'border-input')}
            >
              <option value="">— Fahrzeug wählen —</option>
              {(() => {
                const active = resources.filter((r) => r.is_active)
                const byGroup = (r: Resource) => {
                  const m = (r.metadata ?? {}) as Record<string, unknown>
                  return String(m.preis_gruppe ?? m[preisgruppeFeld] ?? 'Z')
                }
                const typ = (r: Resource) => {
                  const m = (r.metadata ?? {}) as Record<string, unknown>
                  const sitze = Number(m.sitze)
                  if (Number.isFinite(sitze) && sitze >= 8) return `${sitze}-Sitzer`
                  // preis_gruppe ist z.B. "C_Transporter" / "A_Anhaenger" — Teil nach "_" ist der Typ
                  const suffix = String(m.preis_gruppe ?? '').split('_').pop() ?? ''
                  const map: Record<string, string> = {
                    Anhaenger: 'Anhänger',
                    LKW: 'LKW',
                    Transporter: 'Transporter',
                    PKW: 'PKW',
                  }
                  return map[suffix] ?? ''
                }
                const label = (r: Resource) => {
                  const m = (r.metadata ?? {}) as Record<string, unknown>
                  const kz = m.kennzeichen ? ` (${m.kennzeichen})` : ''
                  const loc = m.standort ? ` — ${m.standort}` : ''
                  const t = typ(r)
                  const tStr = t ? ` · ${t}` : ''
                  const occStr = occupiedAt.has(r.id) ? ' — belegt' : ''
                  return `${r.name}${kz}${tStr}${loc}${occStr}`
                }
                // Eine Fahrzeug-Option rendern — belegte sind gesperrt + rot.
                const opt = (r: Resource) => {
                  const isOccupied = occupiedAt.has(r.id)
                  return (
                    <option
                      key={r.id}
                      value={r.id}
                      disabled={isOccupied}
                      style={isOccupied ? { color: '#dc2626' } : undefined}
                    >
                      {label(r)}
                    </option>
                  )
                }
                const sorted = [...active].sort((a, b) => byGroup(a).localeCompare(byGroup(b)))

                const myStandort = staffStandort?.trim().toLowerCase()
                const here = sorted.filter((r) => {
                  const m = (r.metadata ?? {}) as Record<string, unknown>
                  return myStandort && String(m.standort ?? '').trim().toLowerCase() === myStandort
                })
                const other = sorted.filter((r) => !here.includes(r))

                const renderGroup = (list: Resource[]) => {
                  const groups = new Map<string, Resource[]>()
                  for (const r of list) {
                    const g = byGroup(r)
                    if (!groups.has(g)) groups.set(g, [])
                    groups.get(g)!.push(r)
                  }
                  return Array.from(groups.entries()).map(([g, items]) => (
                    <optgroup key={g} label={g.replace(/_/g, ' ')}>
                      {items.map((r) => opt(r))}
                    </optgroup>
                  ))
                }

                return (
                  <>
                    {here.length > 0 && (
                      <optgroup label={`── Mein Standort (${staffStandort}) ──`}>
                        {here.map((r) => opt(r))}
                      </optgroup>
                    )}
                    {renderGroup(other)}
                  </>
                )
              })()}
            </select>
            {errors.resource_id && <p className="text-destructive text-xs">{errors.resource_id.message}</p>}
            {watchedResourceId && occupiedAt.has(watchedResourceId) && (
              <div className="flex items-start gap-2 px-3 py-2 mt-1 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Dieses Fahrzeug ist zum gewählten Startzeitpunkt bereits belegt — bitte ein anderes wählen.</span>
              </div>
            )}
          </div>

          {/* Standort-Warnung */}
          {standortMismatch && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Standort-Abweichung — Fahrzeug in <strong>{resourceStandort}</strong>, dein Standort ist <strong>{staffStandort}</strong>.</span>
            </div>
          )}

          {/* Dauer — nur Stufen mit hinterlegtem Tarif für das gewählte Fahrzeug */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Dauer</label>
            {durationMappings.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine Dauer-Tarife konfiguriert. Bitte zuerst in Einstellungen anlegen.</p>
            ) : selectedResource && availableDurations.length === 0 ? (
              <p className="text-xs text-amber-700">Für dieses Fahrzeug ist kein Tarif hinterlegt.</p>
            ) : (
              <select
                {...register('duration_mapping_id')}
                className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background', errors.duration_mapping_id ? 'border-destructive' : 'border-input')}
              >
                <option value="">— Dauer wählen —</option>
                {availableDurations.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
                {hasDayTarif && (
                  <optgroup label="Mehrere Tage">
                    {MULTI_DAY_FACTORS.map((f) => (
                      <option key={`${dayBaseMapping!.id}×${f}`} value={`${dayBaseMapping!.id}×${f}`}>
                        {f} Tage
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
            {errors.duration_mapping_id && <p className="text-destructive text-xs">{errors.duration_mapping_id.message}</p>}
          </div>

          {/* Kundentyp */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Kundentyp</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCustomerType('privat')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium border transition-colors',
                  customerType === 'privat'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted',
                )}
              >
                Privat
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('gewerbe')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium border transition-colors',
                  customerType === 'gewerbe'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted',
                )}
              >
                Gewerblich
              </button>
            </div>
            {selectedResource && !matchingPriceList && (
              <p className="text-xs text-amber-700">Keine passende Preisliste für dieses Fahrzeug gefunden.</p>
            )}
            {matchingPriceList && (
              <p className="text-xs text-muted-foreground">{matchingPriceList.name}</p>
            )}
          </div>

          {/* km-Paket */}
          {selectedResource && matchingItem && (
            <div className="space-y-1">
              <label className="text-sm font-medium">km-Paket</label>
              <select
                {...register('km_package')}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">— kein km-Paket —</option>
                {KM_PACKAGES.filter((p) => {
                  const meta = (matchingItem.metadata ?? {}) as Record<string, unknown>
                  return meta[p.key] !== undefined
                }).map((p) => {
                  const meta = (matchingItem.metadata ?? {}) as Record<string, unknown>
                  const price = String(meta[p.key]).replace(',', '.')
                  return (
                    <option key={p.key} value={p.key}>
                      {p.label} — {formatPrice(Number(price))}
                    </option>
                  )
                })}
              </select>
              {(() => {
                const meta = (matchingItem.metadata ?? {}) as Record<string, unknown>
                const mehrKm = meta['mehr_km']
                if (!mehrKm) return null
                return (
                  <p className="text-xs text-muted-foreground">
                    Mehr-km: {String(mehrKm).replace('.', ',')} € / km
                  </p>
                )
              })()}
            </div>
          )}

          {/* Info-Box: von/bis + Preis + Verfügbarkeit */}
          {(startsAt || calculatedPrice !== null || availability !== null) && (
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-2 text-sm">
              {startsAt && endsAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">
                      {startsAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' '}
                      {startsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {' '}bis{' '}
                    <span className="font-medium text-foreground">
                      {endsAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' '}
                      {endsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
              )}

              {basePrice !== null && matchingItem && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Tarif ({matchingItemLabel}){durationFactor > 1 ? ` · ${durationFactor} Tage` : ''}:
                    </span>
                    <span className="tabular-nums">{formatPrice(basePrice)}</span>
                  </div>
                  {kmPrice !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        km-Paket ({KM_PACKAGES.find((p) => p.key === watchedKmPackage)?.label}):
                      </span>
                      <span className="tabular-nums">+ {formatPrice(kmPrice)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-1.5 mt-0.5">
                    <span className="font-medium">Gesamt:</span>
                    <span className="font-semibold text-foreground">{formatPrice(calculatedPrice!)}</span>
                  </div>
                </>
              )}

              {!matchingItem && selectedResource && watchedPriceListId && (
                <div className="flex items-start gap-1.5 text-amber-700 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Keine Preisgruppe für „{preisgruppe}" in der Preisliste gefunden — bitte Tarif prüfen.</span>
                </div>
              )}

              {missingTariff && (
                <div className="flex items-start gap-1.5 text-amber-700 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Für „{matchingItemLabel}" ist kein Preis für die Dauer „{selectedMapping!.label}" hinterlegt.</span>
                </div>
              )}

              {checkingAvailability && (
                <p className="text-xs text-muted-foreground">Verfügbarkeit wird geprüft…</p>
              )}
              {!checkingAvailability && availability === false && (
                <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Fahrzeug ist in diesem Zeitraum bereits gebucht!
                </div>
              )}
              {!checkingAvailability && availability === true && (
                <p className="text-xs text-green-700 font-medium">✓ Fahrzeug ist verfügbar</p>
              )}
            </div>
          )}

          {/* Notizen */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Notizen</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Dynamische Zusatzfelder */}
          {fieldDefinitions.length > 0 && (
            <div className="border-t border-border pt-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Zusatzfelder</p>
              {fieldDefinitions.map((def) => {
                const fieldError = metaErrors[def.name]?.message
                if (def.field_type === 'boolean') {
                  return (
                    <div key={def.id} className="flex items-center gap-2">
                      <input id={`meta-${def.name}`} type="checkbox" {...register(`metadata.${def.name}` as never)} className="h-4 w-4 rounded border-input" />
                      <label className="text-sm font-medium" htmlFor={`meta-${def.name}`}>{def.label}</label>
                    </div>
                  )
                }
                return (
                  <div key={def.id} className="space-y-1">
                    <label className="text-sm font-medium" htmlFor={`meta-${def.name}`}>
                      {def.label}{def.is_required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    <input
                      id={`meta-${def.name}`}
                      type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                      {...register(`metadata.${def.name}` as never)}
                      className={cn('w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring', fieldError ? 'border-destructive' : 'border-input')}
                    />
                    {fieldError && <p className="text-destructive text-xs">{fieldError}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-between pt-2">
            <div className="flex gap-2">
              {booking && booking.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isMutating}
                  className="px-4 py-2 text-sm rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  Stornieren
                </button>
              )}
              {booking && (
                <button
                  type="button"
                  onClick={() => setShowContractData(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                  title="Vertragsdaten zum Abschreiben anzeigen"
                >
                  <FileText className="w-4 h-4" /> Vertragsdaten
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isMutating || availability === false || priceUnavailable || (!!watchedResourceId && occupiedAt.has(watchedResourceId))}
                title={
                  watchedResourceId && occupiedAt.has(watchedResourceId)
                    ? 'Fahrzeug ist zum Startzeitpunkt belegt.'
                    : priceUnavailable ? 'Kein Preis ermittelbar — bitte Preisgruppe/Tarif prüfen.' : undefined
                }
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isMutating ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ContractDataView
        open={showContractData}
        booking={booking ?? null}
        onClose={() => setShowContractData(false)}
      />
    </div>
  )
}
