import { useMemo, useState } from 'react'
import { Plus, Car, CalendarDays, Users, AlertTriangle, MapPin, CheckCircle2, X, ArrowDownToLine, ArrowUpFromLine, Clock, Euro, Undo2 } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useWorkspace } from '@/features/workspace'
import { useBookingsForRange, useMarkReturned, useUndoReturn } from '@/features/bookings/hooks/useBookings'
import { useResources, useUpdateResource } from '@/features/resources/hooks/useResources'
import { useStaffMembers } from '@/features/staff/hooks/useStaff'
import { useLocations } from '@/features/locations'
import { BookingDialog } from '@/features/bookings/components/BookingDialog'
import { getReturnInfo } from '@/features/bookings/types'
import { cn } from '@/lib/utils'
import type { Booking } from '@/features/bookings/types'
import type { Resource } from '@/features/resources/types'
import type { StaffMembership } from '@/features/staff/types'
import type { Location } from '@/features/locations'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Bearbeiter',
  user: 'Mitarbeiter',
}

const HU_WARN_DAYS = 60

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff))
}

function endOfWeek(d: Date) {
  const s = startOfWeek(d)
  return endOfDay(new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6))
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function formatPrice(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex items-start gap-4">
      <div className={cn('p-2.5 rounded-lg', accent ?? 'bg-muted')}>
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
}

/** Liste mit Buchungen, deren Abhol- ODER Rückgabezeit fokussiert wird. */
function MovementRow({ booking, resources, mode }: { booking: Booking; resources: Resource[]; mode: 'pickup' | 'return' }) {
  const resource = resources.find((r) => r.id === booking.resource_id)
  const time = mode === 'pickup' ? booking.starts_at : booking.ends_at
  const overdue = mode === 'return' && new Date(booking.ends_at) < new Date()
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{booking.first_name} {booking.last_name}</p>
        <p className="text-xs text-muted-foreground truncate">{resource?.name ?? '—'}</p>
      </div>
      <span className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
        overdue ? 'bg-red-100 text-destructive' : 'bg-muted text-muted-foreground',
      )}>
        {formatTime(time)}{overdue ? ' · überfällig' : ''}
      </span>
    </div>
  )
}

/**
 * Zeile in „Überfällige Rückgaben": ermöglicht das Eintragen der Rückgabe
 * (Standort-Pflicht per Dropdown). Mitarbeiter + Uhrzeit werden im Log
 * festgehalten. Bereits eingetragene Rückgaben verschwinden aus dieser Liste,
 * werden hier also nur im Eintrag-Zustand gerendert.
 */
function ReturnRow({ booking, resources, locations, currentUserId, currentUserName }: {
  booking: Booking
  resources: Resource[]
  locations: Location[]
  currentUserId: string
  currentUserName: string
}) {
  const resource = resources.find((r) => r.id === booking.resource_id)
  const activeLocations = locations.filter((l) => l.is_active)
  const [open, setOpen] = useState(false)
  const [locationId, setLocationId] = useState('')
  const markReturned = useMarkReturned()

  async function handleConfirm() {
    const location = activeLocations.find((l) => l.id === locationId)
    if (!location) return
    await markReturned.mutateAsync({
      id: booking.id,
      input: {
        returnedBy: currentUserId,
        returnedByName: currentUserName,
        locationId: location.id,
        locationName: location.name,
      },
    })
    // Buchung fällt nach Invalidierung aus der Liste — kein lokales Reset nötig.
  }

  return (
    <div className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{booking.first_name} {booking.last_name}</p>
          <p className="text-xs text-muted-foreground truncate">{resource?.name ?? '—'}</p>
        </div>
        {!open && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-destructive">
              {formatTime(booking.ends_at)} · überfällig
            </span>
            <button
              onClick={() => setOpen(true)}
              className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Zurück
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="flex items-center gap-1.5 mt-2">
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={markReturned.isPending}
            className="flex-1 min-w-0 text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Standort wählen…</option>
            {activeLocations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button
            onClick={handleConfirm}
            disabled={markReturned.isPending || !locationId}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <CheckCircle2 className="w-3 h-3" />
            {markReturned.isPending ? '…' : 'Eintragen'}
          </button>
          <button
            onClick={() => { setOpen(false); setLocationId('') }}
            disabled={markReturned.isPending}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Zeile in „Heute zurückgenommen": zeigt den Rückgabe-Log (wer/wann/wo) und
 * erlaubt das Widerrufen einer fälschlich eingetragenen Rückgabe.
 */
function ReturnedRow({ booking, resources }: { booking: Booking; resources: Resource[] }) {
  const resource = resources.find((r) => r.id === booking.resource_id)
  const info = getReturnInfo(booking)
  const undoReturn = useUndoReturn()
  if (!info) return null
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{booking.first_name} {booking.last_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {resource?.name ?? '—'} · {info.returned_by_name} · {formatTime(info.returned_at)} · {info.returned_location_name}
        </p>
      </div>
      <button
        onClick={() => undoReturn.mutate(booking.id)}
        disabled={undoReturn.isPending}
        title="Rückgabe widerrufen"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 disabled:opacity-50"
      >
        <Undo2 className="w-3.5 h-3.5" />
        {undoReturn.isPending ? '…' : 'Rückgängig'}
      </button>
    </div>
  )
}

function BookingRow({ booking, resources }: { booking: Booking; resources: Resource[] }) {
  const resource = resources.find((r) => r.id === booking.resource_id)
  const now = new Date()
  const starts = new Date(booking.starts_at)
  const ends = new Date(booking.ends_at)
  const isActive = starts <= now && ends >= now
  const isStartingToday = startOfDay(starts) <= now && now <= endOfDay(starts)
  const isEndingToday = startOfDay(ends) <= now && now <= endOfDay(ends)

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{booking.first_name} {booking.last_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {resource?.name ?? '—'} · {formatDate(booking.starts_at)} {formatTime(booking.starts_at)} – {formatDate(booking.ends_at)} {formatTime(booking.ends_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          isActive ? 'bg-green-100 text-green-700' :
          isStartingToday ? 'bg-blue-100 text-blue-700' :
          isEndingToday ? 'bg-orange-100 text-orange-700' :
          'bg-muted text-muted-foreground'
        )}>
          {isActive ? 'Aktiv' : isStartingToday ? 'Startet heute' : isEndingToday ? 'Endet heute' : '—'}
        </span>
      </div>
    </div>
  )
}

function HuRow({ resource }: { resource: Resource }) {
  const meta = (resource.metadata ?? {}) as Record<string, unknown>
  const huStr = meta.hauptuntersuchung as string | undefined

  const [confirming, setConfirming] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const updateResource = useUpdateResource()

  if (!huStr) return null

  const huDate = new Date(huStr)
  const now = new Date()
  const daysLeft = Math.ceil((huDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const expired = daysLeft < 0

  async function handleSave() {
    if (!newDate) return
    setSaving(true)
    await updateResource.mutateAsync({
      id: resource.id,
      payload: { metadata: { ...meta, hauptuntersuchung: newDate } },
    })
    setSaving(false)
    setConfirming(false)
    setNewDate('')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <AlertTriangle className={cn('w-4 h-4 shrink-0', expired ? 'text-destructive' : 'text-yellow-500')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{resource.name}</p>
        <p className="text-xs text-muted-foreground">
          {meta.kennzeichen as string} · HU: {huDate.toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
        </p>
        {confirming && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              type="month"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="text-xs border border-border rounded px-2 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={saving}
            />
            <button
              onClick={handleSave}
              disabled={saving || !newDate}
              className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {saving ? '…' : 'Speichern'}
            </button>
            <button onClick={() => { setConfirming(false); setNewDate('') }} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {!confirming && (
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            expired ? 'bg-red-100 text-destructive' : 'bg-yellow-100 text-yellow-700'
          )}>
            {expired ? `${Math.abs(daysLeft)}T überfällig` : `${daysLeft}T`}
          </span>
          <button onClick={() => setConfirming(true)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            HU erneuern
          </button>
        </div>
      )}
    </div>
  )
}

/** Wiederverwendbarer Listen-Container mit Titel + Badge + Leer-Text. */
function ListCard({ title, badge, empty, children }: {
  title: string
  badge?: number
  empty: string
  children?: React.ReactNode
}) {
  const hasContent = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader title={title} />
        {badge !== undefined && badge > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{badge}</span>
        )}
      </div>
      <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
        {hasContent ? <div className="max-h-[260px] overflow-y-auto">{children}</div> : (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">{empty}</p>
        )}
      </div>
    </div>
  )
}

function FleetOverview({ fleetStatus, total }: { fleetStatus: { verfuegbar: number; vermietet: number; werkstatt: number }; total: number }) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Flotte Übersicht" />
      <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
        {[
          { label: 'Verfügbar', value: fleetStatus.verfuegbar, color: 'bg-green-500' },
          { label: 'Vermietet', value: fleetStatus.vermietet, color: 'bg-blue-500' },
          { label: 'Werkstatt', value: fleetStatus.werkstatt, color: 'bg-yellow-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', color)} />
            <span className="text-sm flex-1">{label}</span>
            <span className="text-sm font-semibold tabular-nums">{value}</span>
            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
              {total > 0 ? Math.round((value / total) * 100) : 0}%
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground flex-1">Gesamt</span>
          <span className="text-sm font-semibold tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const { activeCompany, activeMembership, activeRole } = useWorkspace()
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingPeriod, setBookingPeriod] = useState<'today' | 'week' | 'month'>('today')

  // Rollen — Umsatzdaten NUR für Admin. Owner zählt als Admin.
  const role = activeRole
  const isAdmin = role === 'admin' || role === 'owner'
  const isEditor = role === 'editor'
  const isStaff = role === 'user' || role === 'member' || role === 'viewer'
  const canManage = isAdmin || isEditor

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const { data: todayBookings = [] } = useBookingsForRange(todayStart, todayEnd)
  const { data: weekBookings = [] } = useBookingsForRange(weekStart, weekEnd)
  const { data: monthBookings = [] } = useBookingsForRange(monthStart, monthEnd)
  const { data: resources = [] } = useResources()
  const { data: staffMembers = [] } = useStaffMembers()
  const { data: locations = [] } = useLocations()

  // Anzeigename des quittierenden Mitarbeiters für den Rückgabe-Log.
  const currentUserId = user?.id ?? ''
  const currentUserName = profile?.full_name?.trim() || profile?.email || 'Unbekannt'

  // Flottenstatus (heute gebucht = vermietet). Abgeschlossene (zurückgegebene)
  // Buchungen zählen nicht mehr als vermietet — das Fahrzeug ist wieder frei.
  const fleetStatus = useMemo(() => {
    const bookedIds = new Set(
      todayBookings
        .filter((b) => b.status !== 'completed' && new Date(b.starts_at) <= todayEnd && new Date(b.ends_at) >= todayStart)
        .map((b) => b.resource_id),
    )
    let verfuegbar = 0, vermietet = 0, werkstatt = 0
    for (const r of resources) {
      const standort = String(((r.metadata ?? {}) as Record<string, unknown>).standort ?? '').toLowerCase()
      if (standort === 'werkstatt') werkstatt++
      else if (bookedIds.has(r.id)) vermietet++
      else verfuegbar++
    }
    return { verfuegbar, vermietet, werkstatt }
  }, [todayBookings, resources, todayStart, todayEnd])

  // Heutige Abholungen / Rückgaben (aus Wochendaten, damit auch heute startende/endende sicher dabei sind)
  const todayPickups = useMemo(
    () => weekBookings
      .filter((b) => b.status !== 'cancelled' && isSameDay(new Date(b.starts_at), now))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [weekBookings],
  )
  const todayReturns = useMemo(
    () => weekBookings
      .filter((b) => b.status !== 'cancelled' && isSameDay(new Date(b.ends_at), now))
      .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()),
    [weekBookings],
  )

  // Aktive Vermietungen (läuft gerade) — abgeschlossene (zurückgegebene) raus.
  const activeRentals = useMemo(
    () => todayBookings.filter((b) => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.starts_at) <= now && new Date(b.ends_at) >= now),
    [todayBookings],
  )

  // Überfällige Rückgaben (Endzeit in Vergangenheit, nicht storniert, noch nicht
  // zurückgegeben). Sobald die Rückgabe eingetragen ist (metadata.return), fällt
  // die Buchung aus dieser Liste — das ist der eigentliche Nutzen.
  const overdueReturns = useMemo(
    () => monthBookings
      .filter((b) => b.status !== 'cancelled' && new Date(b.ends_at) < now && !getReturnInfo(b))
      .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()),
    [monthBookings],
  )

  // Heute zurückgenommene Buchungen — für Log-Sicht + Widerruf. Nach
  // Rückgabezeit absteigend (zuletzt zurückgenommen oben).
  const returnedToday = useMemo(
    () => monthBookings
      .filter((b) => {
        const info = getReturnInfo(b)
        return b.status !== 'cancelled' && info && isSameDay(new Date(info.returned_at), now)
      })
      .sort((a, b) => {
        const ta = new Date(getReturnInfo(a)!.returned_at).getTime()
        const tb = new Date(getReturnInfo(b)!.returned_at).getTime()
        return tb - ta
      }),
    [monthBookings],
  )

  // Umsätze — nur für Admin berechnet (gar nicht erst für andere Rollen)
  const monatsumsatz = useMemo(
    () => isAdmin ? monthBookings.reduce((sum, b) => sum + (b.price_snapshot ?? 0), 0) : 0,
    [monthBookings, isAdmin],
  )
  const tagesumsatz = useMemo(
    () => isAdmin ? todayBookings.reduce((sum, b) => sum + (b.price_snapshot ?? 0), 0) : 0,
    [todayBookings, isAdmin],
  )

  // HU-/Wartungs-Warnungen
  const huWarnungen = useMemo(() => {
    const warnDate = new Date(now.getTime() + HU_WARN_DAYS * 24 * 60 * 60 * 1000)
    return resources
      .filter((r) => {
        const huStr = ((r.metadata ?? {}) as Record<string, unknown>).hauptuntersuchung as string | undefined
        return huStr ? new Date(huStr) <= warnDate : false
      })
      .sort((a, b) => {
        const ha = ((a.metadata ?? {}) as Record<string, unknown>).hauptuntersuchung as string
        const hb = ((b.metadata ?? {}) as Record<string, unknown>).hauptuntersuchung as string
        return new Date(ha).getTime() - new Date(hb).getTime()
      })
  }, [resources])

  // Termine für Mitarbeiter — eigene heutige Buchungen
  const myToday = useMemo(() => {
    return [...todayBookings]
      .filter((b) => b.created_by === activeMembership?.profile_id)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [todayBookings, activeMembership])

  // Mitarbeiter nach Standort (Admin)
  const staffByLocation = useMemo(() => {
    const map = new Map<string, typeof staffMembers>()
    for (const m of staffMembers) {
      const loc = m.location ?? 'Kein Standort'
      if (!map.has(loc)) map.set(loc, [])
      map.get(loc)!.push(m)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [staffMembers])

  const periodCount = bookingPeriod === 'today' ? todayBookings.length : bookingPeriod === 'week' ? weekBookings.length : monthBookings.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Willkommen zurück, {profile?.full_name ?? profile?.email} · {activeCompany?.name}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setBookingDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Neue Buchung
          </button>
        )}
      </div>

      {/* ===== KPI-Karten je Rolle ===== */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Umsatz Monat" value={formatPrice(monatsumsatz)} sub={`${monthBookings.length} Buchungen`} icon={Euro} accent="bg-purple-50" />
          <KpiCard label="Umsatz heute" value={formatPrice(tagesumsatz)} sub={`${todayBookings.length} heute`} icon={Euro} accent="bg-purple-50" />
          <KpiCard label="Verfügbar" value={fleetStatus.verfuegbar} sub={`${fleetStatus.vermietet} vermietet · ${fleetStatus.werkstatt} Werkstatt`} icon={Car} accent="bg-green-50" />
          <KpiCard label="Mitarbeiter" value={staffMembers.length} sub={`${staffByLocation.length} Standort${staffByLocation.length !== 1 ? 'e' : ''}`} icon={Users} accent="bg-orange-50" />
        </div>
      )}

      {isEditor && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Abholungen heute" value={todayPickups.length} icon={ArrowUpFromLine} accent="bg-blue-50" />
          <KpiCard label="Rückgaben heute" value={todayReturns.length} icon={ArrowDownToLine} accent="bg-blue-50" />
          <KpiCard label="Aktive Vermietungen" value={activeRentals.length} icon={Clock} accent="bg-green-50" />
          <KpiCard label="Verfügbar" value={fleetStatus.verfuegbar} sub={`${fleetStatus.werkstatt} in Wartung`} icon={Car} accent="bg-green-50" />
        </div>
      )}

      {isStaff && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Meine Termine heute" value={myToday.length} sub={activeMembership?.location ?? undefined} icon={CalendarDays} accent="bg-blue-50" />
          <KpiCard label="Abholungen heute" value={todayPickups.length} icon={ArrowUpFromLine} accent="bg-blue-50" />
          <KpiCard label="Rückgaben heute" value={todayReturns.length} icon={ArrowDownToLine} accent="bg-blue-50" />
          <KpiCard label="Verfügbar" value={fleetStatus.verfuegbar} sub={`${fleetStatus.werkstatt} in Wartung`} icon={Car} accent="bg-green-50" />
        </div>
      )}

      {/* Buchungen-Periode (Admin) als eigener Block */}
      {isAdmin && (
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2.5 rounded-lg bg-blue-50 shrink-0"><CalendarDays className="w-5 h-5 text-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Buchungen</p>
              <p className="text-2xl font-bold mt-0.5">{periodCount}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setBookingPeriod(p)}
                className={cn('px-3 text-xs py-1.5 rounded font-medium transition-colors',
                  bookingPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
              >
                {p === 'today' ? 'Heute' : p === 'week' ? 'Woche' : 'Monat'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== Widget-Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mitarbeiter: eigene Termine zuerst */}
        {isStaff && (
          <ListCard title="Meine Termine heute" badge={myToday.length} empty="Keine eigenen Termine heute.">
            {myToday.map((b) => <BookingRow key={b.id} booking={b} resources={resources} />)}
          </ListCard>
        )}

        {/* Abholungen heute — alle Rollen */}
        <ListCard title="Abholungen heute" badge={todayPickups.length} empty="Keine Abholungen heute.">
          {todayPickups.map((b) => <MovementRow key={b.id} booking={b} resources={resources} mode="pickup" />)}
        </ListCard>

        {/* Rückgaben heute — alle Rollen */}
        <ListCard title="Rückgaben heute" badge={todayReturns.length} empty="Keine Rückgaben heute.">
          {todayReturns.map((b) => <MovementRow key={b.id} booking={b} resources={resources} mode="return" />)}
        </ListCard>

        {/* Aktive Vermietungen — Admin + Bearbeiter */}
        {canManage && (
          <ListCard title="Aktive Vermietungen" badge={activeRentals.length} empty="Keine aktiven Vermietungen.">
            {activeRentals.map((b) => <BookingRow key={b.id} booking={b} resources={resources} />)}
          </ListCard>
        )}

        {/* Überfällige Rückgaben — Admin + Bearbeiter. Rückgabe direkt eintragbar. */}
        {canManage && (
          <ListCard title="Überfällige Rückgaben" badge={overdueReturns.length} empty="Keine überfälligen Rückgaben.">
            {overdueReturns.map((b) => (
              <ReturnRow
                key={b.id}
                booking={b}
                resources={resources}
                locations={locations}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
            ))}
          </ListCard>
        )}

        {/* Heute zurückgenommen — Admin + Bearbeiter. Log + Widerruf. */}
        {canManage && returnedToday.length > 0 && (
          <ListCard title="Heute zurückgenommen" badge={returnedToday.length} empty="Noch keine Rückgaben heute eingetragen.">
            {returnedToday.map((b) => <ReturnedRow key={b.id} booking={b} resources={resources} />)}
          </ListCard>
        )}

        {/* TÜV / Wartung — Admin + Bearbeiter */}
        {canManage && (
          <ListCard title="TÜV fällig / überfällig" badge={huWarnungen.length} empty="Keine TÜV-Warnungen.">
            {huWarnungen.map((r) => <HuRow key={r.id} resource={r} />)}
          </ListCard>
        )}

        {/* Flotte — alle Rollen */}
        <FleetOverview fleetStatus={fleetStatus} total={resources.length} />

        {/* Mitarbeiter nach Standort — nur Admin */}
        {isAdmin && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="Mitarbeiter" />
              <span className="text-xs text-muted-foreground">{staffMembers.length} gesamt</span>
            </div>
            <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
              {staffByLocation.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Keine Mitarbeiter.</p>
              ) : (
                <div className="max-h-[260px] overflow-y-auto">
                  {staffByLocation.map(([loc, members]) => (
                    <div key={loc}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{loc}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{members.length} MA</span>
                      </div>
                      {members.map((m: StaffMembership) => (
                        <div key={m.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.profile.full_name ?? m.profile.email}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.profile.email}</p>
                          </div>
                          <span className="ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {ROLE_LABELS[m.role] ?? m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {canManage && <BookingDialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} />}
    </div>
  )
}
