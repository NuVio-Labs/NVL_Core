import { useEffect, useState } from 'react'
import { X, Printer, ChevronRight, ChevronLeft, ShieldAlert, ImagePlus, Camera, Trash2 } from 'lucide-react'
import { useCustomers } from '@/features/customers'
import { useResources } from '@/features/resources/hooks/useResources'
import { useCompanySettings } from '@/features/workspace'
import { cn } from '@/lib/utils'
import { getReturnInfo } from '../types'
import type { Booking, BookingWithCreator } from '../types'

/**
 * Vertrags-Wizard für PLT. PLT füllt Mietverträge auf einem vorgedruckten
 * Papierblock aus (kein PDF-Template). Dieser Wizard sammelt die Vertragsdaten
 * Schritt für Schritt, sodass der Mitarbeiter sie nur noch abschreiben/drucken
 * muss.
 *
 * Schritte: 1) Kundendaten · 2) Schadens-/Übernahmeprotokoll · 3) Abschluss.
 *
 * DSGVO: Ausweis-Nr., Führerschein-Nr. und Kreditkarte werden NICHT dauerhaft
 * gespeichert (PAuswG § 20) — sie leben nur in dieser Sitzung zum Abschreiben.
 * Unkritische Felder (Beruf, Geburtsdatum, Mieter 2) dürfen gespeichert werden.
 */

type Step = 1 | 2 | 3

interface Props {
  open: boolean
  booking: Booking | BookingWithCreator | null
  onClose: () => void
}

/** Alle im Wizard erfassten Felder. `sensitive`-Felder NICHT in DB speichern. */
interface ContractForm {
  // Mieter 1
  first_name: string
  last_name: string
  street: string
  city: string
  phone: string
  profession: string
  employer: string
  date_of_birth: string
  place_of_birth: string
  // sensibel — nur Sitzung/Druck
  id_number: string
  id_issued_at: string
  license_class: string
  license_number: string
  license_issued_at: string
  // Mieter 2
  r2_name: string
  r2_address: string
  r2_date_of_birth: string
  r2_id_number: string
  r2_license_class: string
  // Zahlung (sensibel)
  credit_card: string
  // Übernahme (Schritt 2)
  ho_km_start: string
  ho_damage_inside: '' | 'nein' | 'ja'
  ho_damage_inside_notes: string
  ho_damage_outside: '' | 'nein' | 'ja'
  ho_damage_outside_notes: string
  // Rückgabe (Schritt 2, unterer Block)
  rt_km_end: string
  rt_damage_inside: '' | 'nein' | 'ja'
  rt_damage_inside_notes: string
  rt_damage_outside: '' | 'nein' | 'ja'
  rt_damage_outside_notes: string
  // Schadens-Marker auf den Fahrzeug-Skizzen
  damage_markers: DamageMarker[]
  // Optionale Schadensfotos — NUR sitzungslokal (noch keine Ablage bestimmt)
  damage_photos: DamagePhoto[]
}

/**
 * Ein hochgeladenes Schadensfoto. Lebt vorerst NUR in dieser Sitzung
 * (Object-URL im Browser) — es wird bewusst noch NICHTS dauerhaft gespeichert,
 * bis der Ablageort (z.B. Storage-Bucket) + DSGVO-Konzept festgelegt sind.
 */
interface DamagePhoto {
  id: string
  name: string
  url: string // Object-URL, nur Sitzung
}

/** Ein gesetzter Schadensmarker auf dem Fahrzeug-Schaubild. */
interface DamageMarker {
  id: string
  x: number // 0..100 (% der Bildbreite)
  y: number // 0..100 (% der Bildhöhe)
  type: 'lack' | 'karosserie' // ✕ = Lack, ◯ = Karosserie
}

const EMPTY_FORM: ContractForm = {
  first_name: '', last_name: '', street: '', city: '', phone: '',
  profession: '', employer: '', date_of_birth: '', place_of_birth: '',
  id_number: '', id_issued_at: '', license_class: '', license_number: '', license_issued_at: '',
  r2_name: '', r2_address: '', r2_date_of_birth: '', r2_id_number: '', r2_license_class: '',
  credit_card: '',
  ho_km_start: '', ho_damage_inside: '', ho_damage_inside_notes: '', ho_damage_outside: '', ho_damage_outside_notes: '',
  rt_km_end: '', rt_damage_inside: '', rt_damage_inside_notes: '', rt_damage_outside: '', rt_damage_outside_notes: '',
  damage_markers: [], damage_photos: [],
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/** Eingabefeld mit Label. `sensitive` markiert PAuswG-relevante Felder. */
function Input({ label, value, onChange, sensitive, type = 'text', placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  sensitive?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {label}
        {sensitive && <ShieldAlert className="w-3 h-3 text-amber-600" />}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background',
          sensitive ? 'border-amber-300' : 'border-input',
        )}
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wider text-foreground bg-muted px-2 py-1 rounded-sm">{children}</h3>
}

/** Übersichtszeile (nur anzeigen, wenn ein Wert da ist). */
function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (value === undefined || value === null || String(value).trim() === '') return null
  return (
    <div className="flex gap-2 py-0.5 text-sm">
      <span className="text-muted-foreground min-w-[8rem] shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

/** Ja/Nein-Auswahl (wie die Ankreuzkästchen auf dem Papier). */
function YesNo({ label, value, onChange }: {
  label: string
  value: '' | 'nein' | 'ja'
  onChange: (v: 'nein' | 'ja') => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground min-w-[9rem]">{label}</span>
      {(['nein', 'ja'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'px-3 py-1 rounded-md text-sm border transition-colors capitalize',
            value === opt
              ? opt === 'ja' ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-green-50 border-green-500 text-green-700'
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/**
 * Klickbares Fahrzeug-Schaubild (Seite/Front/Heck in einem Bild). Klick setzt
 * einen Marker (Typ aus `activeType`); Klick auf einen Marker entfernt ihn.
 * Marker-Position ist prozentual (0..100), damit sie unabhängig von der
 * Anzeigegröße korrekt sitzt — auch im Druck.
 */
function DamageDiagram({ markers, onAdd, onRemove, readonly }: {
  markers: DamageMarker[]
  onAdd?: (x: number, y: number) => void
  onRemove?: (id: string) => void
  readonly?: boolean
}) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readonly || !onAdd) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onAdd(x, y)
  }
  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative w-full border border-border rounded-md bg-white select-none',
        readonly ? '' : 'cursor-crosshair',
      )}
    >
      <img
        src="/assets/condition_report.webp"
        alt="Fahrzeug-Ansichten zum Markieren von Schäden"
        className="w-full h-auto pointer-events-none"
        draggable={false}
      />
      {markers.map((m) => (
        <span
          key={m.id}
          onClick={readonly ? undefined : (e) => { e.stopPropagation(); onRemove?.(m.id) }}
          title={readonly ? undefined : 'Marker entfernen'}
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 leading-none font-bold',
            readonly ? '' : 'cursor-pointer',
          )}
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          {m.type === 'lack'
            ? <span className="text-destructive text-lg">✕</span>
            : <span className="inline-block w-4 h-4 rounded-full border-2 border-blue-600" />}
        </span>
      ))}
    </div>
  )
}

export function ContractDataView({ open, booking, onClose }: Props) {
  const { data: customers = [] } = useCustomers()
  const { data: resources = [] } = useResources()
  const companySettings = useCompanySettings()

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM)
  const [activeMarkerType, setActiveMarkerType] = useState<'lack' | 'karosserie'>('lack')

  const customer = booking && (booking as { customer_id?: string | null }).customer_id
    ? customers.find((c) => c.id === (booking as { customer_id?: string | null }).customer_id)
    : undefined

  // Beim Öffnen: Schritt zurücksetzen + vorhandene Daten aus Buchung/Kunde
  // vorausfüllen (nur die unkritischen — sensibles bleibt leer). Beim Schließen
  // alle Foto-Object-URLs freigeben (kein Memory-Leak).
  useEffect(() => {
    if (!open || !booking) return
    setStep(1)
    setForm({
      ...EMPTY_FORM,
      first_name: customer?.first_name ?? booking.first_name ?? '',
      last_name: customer?.last_name ?? booking.last_name ?? '',
      street: customer?.street ?? '',
      city: customer?.city ?? '',
      phone: customer?.phone ?? booking.phone ?? '',
    })
    return () => {
      setForm((f) => {
        f.damage_photos.forEach((p) => URL.revokeObjectURL(p.url))
        return f
      })
    }
  }, [open, booking?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !booking) return null

  const resource = resources.find((r) => r.id === booking.resource_id)
  const resMeta = (resource?.metadata ?? {}) as Record<string, unknown>
  const preisgruppeFeld = (companySettings.booking_field_preisgruppe as string) ?? 'preisgruppe'
  const gruppe = String(resMeta[preisgruppeFeld] ?? resMeta.preis_gruppe ?? '')
  const kennzeichen = String(resMeta.kennzeichen ?? '')
  const ret = getReturnInfo(booking)

  const set = (k: keyof ContractForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  function addMarker(x: number, y: number) {
    setForm((f) => ({
      ...f,
      damage_markers: [
        ...f.damage_markers,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, x, y, type: activeMarkerType },
      ],
    }))
  }
  function removeMarker(id: string) {
    setForm((f) => ({ ...f, damage_markers: f.damage_markers.filter((m) => m.id !== id) }))
  }

  function addPhotos(files: FileList | null) {
    if (!files) return
    const next: DamagePhoto[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })
    }
    if (next.length) setForm((f) => ({ ...f, damage_photos: [...f.damage_photos, ...next] }))
  }
  function removePhoto(id: string) {
    setForm((f) => {
      const photo = f.damage_photos.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.url)
      return { ...f, damage_photos: f.damage_photos.filter((p) => p.id !== id) }
    })
  }

  const STEP_LABELS: Record<Step, string> = {
    1: 'Kundendaten',
    2: 'Schadensprotokoll',
    3: 'Abschluss',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block print:overflow-visible">
      <div className="bg-background text-foreground border border-border rounded-lg shadow-xl w-full max-w-3xl my-4 print:my-0 print:border-0 print:shadow-none print:max-w-none">

        {/* Kopf mit Schritt-Anzeige */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border print:hidden">
          <div>
            <h2 className="text-base font-semibold">Mietvertrag — {STEP_LABELS[step]}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {([1, 2, 3] as Step[]).map((s) => (
                <span
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    s === step ? 'w-6 bg-primary' : s < step ? 'w-3 bg-primary/50' : 'w-3 bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fahrzeug-Kontext (immer sichtbar) */}
        <div className="px-5 py-2.5 bg-muted/50 border-b border-border text-xs flex flex-wrap gap-x-4 gap-y-1 print:hidden">
          <span><strong>Fahrzeug:</strong> {resource?.name ?? '—'}</span>
          {kennzeichen && <span><strong>Kennz.:</strong> {kennzeichen}</span>}
          {gruppe && <span><strong>Gruppe:</strong> {gruppe}</span>}
          <span><strong>Übergabe:</strong> {formatDate(booking.starts_at)} {formatTime(booking.starts_at)}</span>
          <span><strong>Rückgabe:</strong> {formatDate(booking.ends_at)} {formatTime(booking.ends_at)}</span>
          {ret && <span className="text-green-700"><strong>Zurück:</strong> {formatDate(ret.returned_at)} {formatTime(ret.returned_at)}</span>}
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-4">
              <SectionTitle>Mieter (1)</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Vorname" value={form.first_name} onChange={set('first_name')} />
                <Input label="Nachname" value={form.last_name} onChange={set('last_name')} />
                <Input label="Straße" value={form.street} onChange={set('street')} />
                <Input label="Ort" value={form.city} onChange={set('city')} />
                <Input label="Telefon" value={form.phone} onChange={set('phone')} />
                <Input label="Beruf" value={form.profession} onChange={set('profession')} />
                <Input label="Beschäftigt bei" value={form.employer} onChange={set('employer')} />
                <Input label="Geburtsdatum" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                <Input label="Geburtsort" value={form.place_of_birth} onChange={set('place_of_birth')} />
              </div>

              <SectionTitle>Ausweis & Führerschein</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Pers.-Ausw.-Nr." value={form.id_number} onChange={set('id_number')} sensitive />
                <Input label="Ausgestellt am" type="date" value={form.id_issued_at} onChange={set('id_issued_at')} />
                <Input label="FS.-Klasse" value={form.license_class} onChange={set('license_class')} />
                <Input label="FS.-Nr." value={form.license_number} onChange={set('license_number')} sensitive />
                <Input label="FS. ausgestellt am" type="date" value={form.license_issued_at} onChange={set('license_issued_at')} />
              </div>

              <SectionTitle>Mieter (2) — optional</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Name" value={form.r2_name} onChange={set('r2_name')} />
                <Input label="Adresse" value={form.r2_address} onChange={set('r2_address')} />
                <Input label="Geburtsdatum" type="date" value={form.r2_date_of_birth} onChange={set('r2_date_of_birth')} />
                <Input label="Pers.-Ausw.-Nr." value={form.r2_id_number} onChange={set('r2_id_number')} sensitive />
                <Input label="FS.-Klasse" value={form.r2_license_class} onChange={set('r2_license_class')} />
              </div>

              <SectionTitle>Zahlung</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Kreditkarte (Nr.)" value={form.credit_card} onChange={set('credit_card')} sensitive placeholder="nur zum Abschreiben" />
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Mit <ShieldAlert className="w-3 h-3 inline" /> markierte Felder (Ausweis-, Führerschein-Nr., Kreditkarte)
                  werden <strong>nicht gespeichert</strong> (PAuswG § 20) — nur zum Abschreiben auf den Papiervertrag.
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <SectionTitle>Übernahme — Zustand bei Abfahrt</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="km-Stand bei Abfahrt" type="number" value={form.ho_km_start} onChange={set('ho_km_start')} />
              </div>
              <YesNo label="Schäden im Innenraum" value={form.ho_damage_inside} onChange={(v) => set('ho_damage_inside')(v)} />
              {form.ho_damage_inside === 'ja' && (
                <Input label="Innenraum — Beschreibung" value={form.ho_damage_inside_notes} onChange={set('ho_damage_inside_notes')} />
              )}
              <YesNo label="Schäden außen" value={form.ho_damage_outside} onChange={(v) => set('ho_damage_outside')(v)} />
              {form.ho_damage_outside === 'ja' && (
                <Input label="Außen — Beschreibung" value={form.ho_damage_outside_notes} onChange={set('ho_damage_outside_notes')} />
              )}

              {/* Schadens-Skizzen */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground">
                    Auf die Skizze klicken, um einen Schaden zu markieren. Marker erneut anklicken = entfernen.
                  </p>
                  <div className="flex items-center gap-1.5">
                    {([
                      { key: 'lack' as const, label: '✕ Lackschaden', cls: 'text-destructive border-destructive' },
                      { key: 'karosserie' as const, label: '◯ Karosserie', cls: 'text-blue-600 border-blue-600' },
                    ]).map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveMarkerType(t.key)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs border transition-colors',
                          activeMarkerType === t.key ? `${t.cls} bg-muted font-medium` : 'border-border text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <DamageDiagram
                  markers={form.damage_markers}
                  onAdd={addMarker}
                  onRemove={removeMarker}
                />
                {form.damage_markers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {form.damage_markers.filter((m) => m.type === 'lack').length} Lack- ·{' '}
                    {form.damage_markers.filter((m) => m.type === 'karosserie').length} Karosserieschäden markiert.
                  </p>
                )}
              </div>

              {/* Optionale Schadensfotos — sitzungslokal, noch keine Ablage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <SectionTitle>Schadensfotos (optional)</SectionTitle>
                  <div className="flex items-center gap-1.5">
                    {/* Kamera erzwingen (Tablet/Handy) — capture ohne multiple,
                        sonst ignorieren Browser das capture und öffnen die Galerie. */}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors cursor-pointer">
                      <Camera className="w-4 h-4" /> Kamera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }}
                      />
                    </label>
                    {/* Galerie / Dateien — mehrere ohne capture. */}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors cursor-pointer">
                      <ImagePlus className="w-4 h-4" /> Galerie
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }}
                      />
                    </label>
                  </div>
                </div>
                {form.damage_photos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Noch keine Fotos. (Optional — z.B. zur eigenen Dokumentation.)</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {form.damage_photos.map((p) => (
                      <div key={p.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          title="Foto entfernen"
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="flex items-start gap-1.5 text-xs text-amber-700">
                  <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Fotos werden derzeit <strong>nicht gespeichert</strong> — sie bleiben nur in dieser Sitzung sichtbar.
                  Eine dauerhafte Ablage ist noch nicht festgelegt.
                </p>
              </div>

              <SectionTitle>Rückgabe — Zustand bei Ankunft</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="km-Stand bei Ankunft" type="number" value={form.rt_km_end} onChange={set('rt_km_end')} />
              </div>
              <YesNo label="Schäden im Innenraum" value={form.rt_damage_inside} onChange={(v) => set('rt_damage_inside')(v)} />
              {form.rt_damage_inside === 'ja' && (
                <Input label="Innenraum — Beschreibung" value={form.rt_damage_inside_notes} onChange={set('rt_damage_inside_notes')} />
              )}
              <YesNo label="Schäden außen" value={form.rt_damage_outside} onChange={(v) => set('rt_damage_outside')(v)} />
              {form.rt_damage_outside === 'ja' && (
                <Input label="Außen — Beschreibung" value={form.rt_damage_outside_notes} onChange={set('rt_damage_outside_notes')} />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Druck-Kopf — nur im Druck sichtbar */}
              <div className="hidden print:block mb-4">
                <h1 className="text-lg font-bold">PLT Mietvertrag — Datenblatt</h1>
                <p className="text-xs text-muted-foreground">
                  {resource?.name ?? '—'} · {kennzeichen} · Übergabe {formatDate(booking.starts_at)} {formatTime(booking.starts_at)}
                </p>
              </div>

              <SectionTitle>Fahrzeug & Zeitraum</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-x-6">
                <SummaryRow label="Wagentyp" value={resource?.name} />
                <SummaryRow label="Kennzeichen" value={kennzeichen} />
                <SummaryRow label="Gruppe" value={gruppe} />
                <SummaryRow label="Übergabe" value={`${formatDate(booking.starts_at)} ${formatTime(booking.starts_at)} Uhr`} />
                <SummaryRow label="Vereinb. Rückgabe" value={`${formatDate(booking.ends_at)} ${formatTime(booking.ends_at)} Uhr`} />
                {ret && <SummaryRow label="Rückgabe (tatsächl.)" value={`${formatDate(ret.returned_at)} ${formatTime(ret.returned_at)} Uhr`} />}
              </div>

              <SectionTitle>Mieter (1)</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-x-6">
                <SummaryRow label="Name" value={[form.first_name, form.last_name].filter(Boolean).join(' ')} />
                <SummaryRow label="Straße" value={form.street} />
                <SummaryRow label="Ort" value={form.city} />
                <SummaryRow label="Telefon" value={form.phone} />
                <SummaryRow label="Beruf" value={form.profession} />
                <SummaryRow label="Beschäftigt bei" value={form.employer} />
                <SummaryRow label="Geburtsdatum" value={form.date_of_birth} />
                <SummaryRow label="Geburtsort" value={form.place_of_birth} />
                <SummaryRow label="Pers.-Ausw.-Nr." value={form.id_number} />
                <SummaryRow label="Ausw. ausgest. am" value={form.id_issued_at} />
                <SummaryRow label="FS.-Klasse" value={form.license_class} />
                <SummaryRow label="FS.-Nr." value={form.license_number} />
                <SummaryRow label="FS. ausgest. am" value={form.license_issued_at} />
              </div>

              {(form.r2_name || form.r2_address) && (
                <>
                  <SectionTitle>Mieter (2)</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-x-6">
                    <SummaryRow label="Name" value={form.r2_name} />
                    <SummaryRow label="Adresse" value={form.r2_address} />
                    <SummaryRow label="Geburtsdatum" value={form.r2_date_of_birth} />
                    <SummaryRow label="Pers.-Ausw.-Nr." value={form.r2_id_number} />
                    <SummaryRow label="FS.-Klasse" value={form.r2_license_class} />
                  </div>
                </>
              )}

              {form.credit_card && (
                <>
                  <SectionTitle>Zahlung</SectionTitle>
                  <SummaryRow label="Kreditkarte" value={form.credit_card} />
                </>
              )}

              <SectionTitle>Übernahme / Rückgabe</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-x-6">
                <SummaryRow label="km Abfahrt" value={form.ho_km_start} />
                <SummaryRow label="km Ankunft" value={form.rt_km_end} />
                <SummaryRow label="Schäden innen (Übergabe)" value={form.ho_damage_inside === 'ja' ? `Ja — ${form.ho_damage_inside_notes || 'siehe Skizze'}` : form.ho_damage_inside === 'nein' ? 'Nein' : ''} />
                <SummaryRow label="Schäden außen (Übergabe)" value={form.ho_damage_outside === 'ja' ? `Ja — ${form.ho_damage_outside_notes || 'siehe Skizze'}` : form.ho_damage_outside === 'nein' ? 'Nein' : ''} />
                <SummaryRow label="Schäden innen (Rückgabe)" value={form.rt_damage_inside === 'ja' ? `Ja — ${form.rt_damage_inside_notes || 'siehe Skizze'}` : form.rt_damage_inside === 'nein' ? 'Nein' : ''} />
                <SummaryRow label="Schäden außen (Rückgabe)" value={form.rt_damage_outside === 'ja' ? `Ja — ${form.rt_damage_outside_notes || 'siehe Skizze'}` : form.rt_damage_outside === 'nein' ? 'Nein' : ''} />
              </div>

              {form.damage_markers.length > 0 && (
                <div className="space-y-1">
                  <SectionTitle>Schadens-Skizze</SectionTitle>
                  <div className="max-w-md">
                    <DamageDiagram markers={form.damage_markers} readonly />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.damage_markers.filter((m) => m.type === 'lack').length} Lack- ·{' '}
                    {form.damage_markers.filter((m) => m.type === 'karosserie').length} Karosserieschäden · ✕ Lack, ◯ Karosserie
                  </p>
                </div>
              )}

              {form.damage_photos.length > 0 && (
                <div className="space-y-1 print:hidden">
                  <SectionTitle>Schadensfotos ({form.damage_photos.length})</SectionTitle>
                  <div className="grid grid-cols-4 gap-2 max-w-md">
                    {form.damage_photos.map((p) => (
                      <img key={p.id} src={p.url} alt={p.name} className="aspect-square object-cover rounded-md border border-border" />
                    ))}
                  </div>
                  <p className="text-xs text-amber-700">Fotos nur in dieser Sitzung — nicht gespeichert, nicht im Druck.</p>
                </div>
              )}

              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs print:hidden">
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Dieses Datenblatt dient zum Abschreiben/Drucken auf den Papiervertrag. Ausweis-/Führerschein-Nr.
                  und Kreditkarte werden <strong>nicht gespeichert</strong>. (PDF-Vertrag mit Formular-Layout folgt später.)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border print:hidden">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as Step) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            {step > 1 ? <><ChevronLeft className="w-4 h-4" /> Zurück</> : 'Abbrechen'}
          </button>
          <div className="flex items-center gap-2">
            {step === 3 && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                <Printer className="w-4 h-4" /> Drucken
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep((step + 1) as Step)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Weiter <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
