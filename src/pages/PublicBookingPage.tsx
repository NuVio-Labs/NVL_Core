import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import {
  usePublicCompany,
  usePublicAvailableVehicles,
  usePublicPriceItems,
  usePublicStations,
  type PublicStation,
  type PublicVehicle,
  type PublicPriceItem,
} from '@/features/public-booking'
import { richtpreis24h } from '@/features/public-booking/lib/richtpreis'

// Öffentliche Endkunden-Buchungsseite (kein Login, eigenes schlankes Layout —
// KEIN AppShell/Sidebar/Header). Etappe 4: Zeitraumwahl (mit 72h-Vorlauf aus
// companies.settings) → im Fenster verfügbare Fahrzeuge via RPC + Richtpreis.
// Kontaktformular + Anfrage folgen in Etappe 5.
export function PublicBookingPage() {
  const { companySlug } = useParams<{ companySlug: string }>()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const companyQuery = usePublicCompany(companySlug)
  const stationsQuery = usePublicStations(companySlug)

  const stations = stationsQuery.data ?? []
  const selectedStation = useMemo(
    () => stations.find((s) => s.slug === selectedSlug) ?? null,
    [stations, selectedSlug],
  )

  if (companyQuery.isLoading) {
    return (
      <PublicShell>
        <CardMessage>Lädt…</CardMessage>
      </PublicShell>
    )
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <PublicShell>
        <CardMessage title="Anbieter nicht gefunden">
          Der Link ist ungültig oder die Online-Buchung ist für diesen Anbieter nicht verfügbar.
        </CardMessage>
      </PublicShell>
    )
  }

  return (
    <PublicShell subtitle={companyQuery.data.name}>
      {selectedStation ? (
        <StationDetail
          station={selectedStation}
          companySlug={companySlug!}
          leadHours={companyQuery.data.leadHours}
          onBack={() => setSelectedSlug(null)}
        />
      ) : (
        <StationPicker
          stations={stations}
          isLoading={stationsQuery.isLoading}
          onSelect={(s) => setSelectedSlug(s.slug)}
        />
      )}
    </PublicShell>
  )
}

// --- Layout-Rahmen (eigenständig, kein AppShell) -----------------------------

function PublicShell({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="login-mesh relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[34rem] w-[34rem] rounded-full bg-sky-300/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <img
            src="/assets/Icon.webp"
            alt="NuVio"
            className="mx-auto mb-4 h-14 w-14 rounded-xl object-cover shadow-lg shadow-slate-900/20"
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Online buchen</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl ring-1 ring-white/40">
      {children}
    </div>
  )
}

function CardMessage({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="text-center">
        {title && <h1 className="text-lg font-semibold text-slate-900">{title}</h1>}
        <p className="mt-2 text-sm text-slate-500">{children}</p>
      </div>
    </Card>
  )
}

// --- Stationswähler ----------------------------------------------------------

function StationPicker({
  stations,
  isLoading,
  onSelect,
}: {
  stations: PublicStation[]
  isLoading: boolean
  onSelect: (station: PublicStation) => void
}) {
  return (
    <Card>
      <h2 className="mb-1 text-base font-semibold text-slate-900">Station wählen</h2>
      <p className="mb-5 text-sm text-slate-500">
        Wählen Sie die Station, an der Sie ein Fahrzeug mieten möchten.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-500">Stationen werden geladen…</p>
      ) : stations.length === 0 ? (
        <p className="text-sm text-slate-500">Derzeit sind keine Stationen verfügbar.</p>
      ) : (
        <ul className="space-y-2">
          {stations.map((station) => (
            <li key={station.slug}>
              <button
                type="button"
                onClick={() => onSelect(station)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:border-slate-900/20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900">{station.name}</span>
                  {station.address && (
                    <span className="block truncate text-xs text-slate-500">{station.address}</span>
                  )}
                </span>
                <span className="text-slate-400" aria-hidden>
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// --- Stationsdetail: Pilot-Weiche --------------------------------------------

function StationDetail({
  station,
  companySlug,
  leadHours,
  onBack,
}: {
  station: PublicStation
  companySlug: string
  leadHours: number
  onBack: () => void
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
      >
        ← Andere Station
      </button>

      <h2 className="text-base font-semibold text-slate-900">{station.name}</h2>
      {station.address && <p className="mt-1 text-sm text-slate-500">{station.address}</p>}

      {station.onlineBookingEnabled ? (
        <BookingFlow companySlug={companySlug} station={station} leadHours={leadHours} />
      ) : (
        <BetaNotice phone={station.phone} />
      )}
    </Card>
  )
}

function BetaNotice({ phone }: { phone: string | null }) {
  return (
    <div className="mt-5 space-y-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
        Die Online-Buchung für diese Station ist in Kürze verfügbar — wir arbeiten daran.
      </p>
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.99]"
        >
          Station anrufen: {phone}
        </a>
      )}
    </div>
  )
}

// --- Buchungs-Flow: Zeitraum wählen → verfügbare Fahrzeuge (Pilot-Pfad) -------

function BookingFlow({
  companySlug,
  station,
  leadHours,
}: {
  companySlug: string
  station: PublicStation
  leadHours: number
}) {
  // Frühester erlaubter Start = jetzt + Vorlauf. Wird serverseitig in der RPC
  // erneut geprüft — hier nur, um den Datepicker sinnvoll zu begrenzen.
  const minStart = useMemo(() => new Date(Date.now() + leadHours * 3_600_000), [leadHours])
  const [fromStr, setFromStr] = useState('')
  const [toStr, setToStr] = useState('')

  const from = fromStr ? new Date(fromStr) : null
  const to = toStr ? new Date(toStr) : null

  // Lokale Validierung fürs UI (die RPC ist die verbindliche Prüfung).
  const rangeError =
    from && to
      ? to <= from
        ? 'Das Ende muss nach dem Start liegen.'
        : from < minStart
          ? `Bitte mindestens ${leadHours} Stunden Vorlauf einplanen.`
          : null
      : null
  const rangeValid = !!from && !!to && !rangeError

  return (
    <div className="mt-5 space-y-5">
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Wählen Sie Ihren Mietzeitraum (frühester Start: {formatDateTime(minStart)}).
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DateTimeField
            label="Von"
            value={fromStr}
            min={toLocalInput(minStart)}
            onChange={setFromStr}
          />
          <DateTimeField
            label="Bis"
            value={toStr}
            min={fromStr || toLocalInput(minStart)}
            onChange={setToStr}
          />
        </div>
        {rangeError && <p className="text-sm text-red-600">{rangeError}</p>}
      </div>

      {rangeValid && (
        <AvailableVehicles
          companySlug={companySlug}
          station={station}
          from={from!}
          to={to!}
        />
      )}
    </div>
  )
}

function DateTimeField({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: string
  min: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="datetime-local"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-900/20 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      />
    </label>
  )
}

function AvailableVehicles({
  companySlug,
  station,
  from,
  to,
}: {
  companySlug: string
  station: PublicStation
  from: Date
  to: Date
}) {
  const vehiclesQuery = usePublicAvailableVehicles(companySlug, station.slug, from, to)
  const priceItemsQuery = usePublicPriceItems(companySlug)

  const vehicles = vehiclesQuery.data ?? []
  const priceItems = priceItemsQuery.data ?? []

  if (vehiclesQuery.isLoading) {
    return <p className="text-sm text-slate-500">Verfügbare Fahrzeuge werden geladen…</p>
  }

  if (vehicles.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-100">
          Für diesen Zeitraum ist an dieser Station kein Fahrzeug verfügbar.
        </p>
        {station.phone && (
          <a
            href={`tel:${station.phone.replace(/[^\d+]/g, '')}`}
            className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Telefonisch buchen: {station.phone}
          </a>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">Verfügbare Fahrzeuge im gewählten Zeitraum:</p>
      <ul className="space-y-2">
        {vehicles.map((v) => (
          <VehicleRow key={v.id} vehicle={v} priceItems={priceItems} />
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-400">
        Richtpreise sind unverbindlich. Der genaue Preis wird bei der Bestätigung mitgeteilt.
      </p>
    </div>
  )
}

function VehicleRow({
  vehicle,
  priceItems,
}: {
  vehicle: PublicVehicle
  priceItems: PublicPriceItem[]
}) {
  const price = richtpreis24h(vehicle, priceItems)
  const details = [
    vehicle.sitze ? `${vehicle.sitze} Sitze` : null,
    vehicle.ahk && vehicle.ahk !== 'false' ? 'AHK' : null,
  ].filter(Boolean)

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-900">{vehicle.name}</span>
        {details.length > 0 && (
          <span className="block text-xs text-slate-500">{details.join(' · ')}</span>
        )}
      </span>
      {price !== null && (
        <span className="shrink-0 text-right text-sm font-medium text-slate-900">
          ab {formatEuro(price)}
          <span className="block text-xs font-normal text-slate-400">/ 24 h</span>
        </span>
      )}
    </li>
  )
}

function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/** Date → "YYYY-MM-DDTHH:mm" in LOKALER Zeit (Format für <input datetime-local>). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}
