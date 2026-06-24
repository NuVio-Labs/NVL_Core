import { useMemo, useState } from 'react'
import { Plus, Car, CalendarDays, Users, AlertTriangle, ChevronRight, MapPin, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useWorkspace, useCan } from '@/features/workspace'
import { useBookingsForRange } from '@/features/bookings/hooks/useBookings'
import { useResources, useUpdateResource } from '@/features/resources/hooks/useResources'
import { useStaffMembers } from '@/features/staff/hooks/useStaff'
import { BookingDialog } from '@/features/bookings/components/BookingDialog'
import { cn } from '@/lib/utils'
import type { Booking } from '@/features/bookings/types'
import type { Resource } from '@/features/resources/types'
import type { StaffMembership } from '@/features/staff/types'

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
        <p className="text-sm font-medium truncate">
          {booking.first_name} {booking.last_name}
        </p>
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
  if (!huStr) return null

  const huDate = new Date(huStr)
  const now = new Date()
  const daysLeft = Math.ceil((huDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const expired = daysLeft < 0

  const [confirming, setConfirming] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const updateResource = useUpdateResource()

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
            <button
              onClick={() => { setConfirming(false); setNewDate('') }}
              className="text-muted-foreground hover:text-foreground"
            >
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
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            HU erneuern
          </button>
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { activeCompany, activeMembership } = useWorkspace()
  const can = useCan()
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingPeriod, setBookingPeriod] = useState<'today' | 'week' | 'month'>('today')

  const isAdmin = can('company.settings', 'read')

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

  const canManage = can('bookings', 'create')

  // Fleet status
  const fleetStatus = useMemo(() => {
    // "Vermietet" = Fahrzeuge, die HEUTE (irgendwann am Tag) gebucht sind,
    // nicht nur exakt im aktuellen Moment. Überlappung mit dem heutigen Tag.
    const activeBookings = todayBookings.filter((b) => {
      const s = new Date(b.starts_at)
      const e = new Date(b.ends_at)
      return s <= todayEnd && e >= todayStart
    })
    const bookedIds = new Set(activeBookings.map((b) => b.resource_id))

    let verfuegbar = 0
    let vermietet = 0
    let werkstatt = 0

    for (const r of resources) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>
      const standort = String(meta.standort ?? '').toLowerCase()
      if (standort === 'werkstatt') {
        werkstatt++
      } else if (bookedIds.has(r.id)) {
        vermietet++
      } else {
        verfuegbar++
      }
    }
    return { verfuegbar, vermietet, werkstatt }
  }, [todayBookings, resources, todayStart, todayEnd])

  // Umsatz Monat (price_snapshot)
  const monatsumsatz = useMemo(() => {
    return monthBookings.reduce((sum, b) => sum + (b.price_snapshot ?? 0), 0)
  }, [monthBookings])

  // HU-Warnungen
  const huWarnungen = useMemo(() => {
    const warnDate = new Date(now.getTime() + HU_WARN_DAYS * 24 * 60 * 60 * 1000)
    return resources
      .filter((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        const huStr = meta.hauptuntersuchung as string | undefined
        if (!huStr) return false
        const huDate = new Date(huStr)
        return huDate <= warnDate
      })
      .sort((a, b) => {
        const ma = (a.metadata ?? {}) as Record<string, unknown>
        const mb = (b.metadata ?? {}) as Record<string, unknown>
        return new Date(ma.hauptuntersuchung as string).getTime() - new Date(mb.hauptuntersuchung as string).getTime()
      })
  }, [resources])

  // Buchungen heute — Admin sieht alle, Mitarbeiter nur eigene
  const todayEvents = useMemo(() => {
    const filtered = isAdmin
      ? todayBookings
      : todayBookings.filter((b) => b.created_by === activeMembership?.profile_id)
    return [...filtered].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [todayBookings, isAdmin, activeMembership])

  // Staff nach Standort gruppiert mit Namen
  const staffByLocation = useMemo(() => {
    const map = new Map<string, typeof staffMembers>()
    for (const m of staffMembers) {
      const loc = m.location ?? 'Kein Standort'
      if (!map.has(loc)) map.set(loc, [])
      map.get(loc)!.push(m)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [staffMembers])

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookingDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Neue Buchung
            </button>
          </div>
        )}
      </div>

      {/* KPIs — Admin sieht alle 4, Mitarbeiter nur Fahrzeugstatus + eigene Buchungen */}
      {isAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-blue-50 shrink-0">
                <CalendarDays className="w-5 h-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Buchungen</p>
                <p className="text-2xl font-bold mt-0.5">
                  {bookingPeriod === 'today' ? todayBookings.length : bookingPeriod === 'week' ? weekBookings.length : monthBookings.length}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {(['today', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setBookingPeriod(p)}
                  className={cn(
                    'flex-1 text-xs py-1 rounded font-medium transition-colors',
                    bookingPeriod === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p === 'today' ? 'Heute' : p === 'week' ? 'Woche' : 'Monat'}
                </button>
              ))}
            </div>
          </div>
          <KpiCard
            label="Verfügbar"
            value={fleetStatus.verfuegbar}
            sub={`${fleetStatus.vermietet} vermietet · ${fleetStatus.werkstatt} Werkstatt`}
            icon={Car}
            accent="bg-green-50"
          />
          <KpiCard
            label="Umsatz Monat"
            value={formatPrice(monatsumsatz)}
            sub={`${monthBookings.length} Buchungen`}
            icon={ChevronRight}
            accent="bg-purple-50"
          />
          <KpiCard
            label="Mitarbeiter"
            value={staffMembers.length}
            sub={`${staffByLocation.length} Standort${staffByLocation.length !== 1 ? 'e' : ''}`}
            icon={Users}
            accent="bg-orange-50"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            label="Meine Buchungen heute"
            value={todayEvents.length}
            sub={activeMembership?.location ?? undefined}
            icon={CalendarDays}
            accent="bg-blue-50"
          />
          <KpiCard
            label="Verfügbar"
            value={fleetStatus.verfuegbar}
            sub={`${fleetStatus.vermietet} vermietet · ${fleetStatus.werkstatt} Werkstatt`}
            icon={Car}
            accent="bg-green-50"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buchungen heute */}
        <div className="space-y-3">
          <SectionHeader title={isAdmin ? 'Buchungen heute' : 'Meine Buchungen heute'} />
          <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
            {todayEvents.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                {isAdmin ? 'Keine Buchungen heute.' : 'Keine eigenen Buchungen heute.'}
              </p>
            ) : (
              todayEvents.map((b) => (
                <BookingRow key={b.id} booking={b} resources={resources} />
              ))
            )}
          </div>
        </div>

        {/* HU-Warnungen — nur Admin */}
        {isAdmin && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="HU fällig / überfällig" />
              {huWarnungen.length > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  {huWarnungen.length} Meldung{huWarnungen.length !== 1 ? 'en' : ''}
                </span>
              )}
            </div>
            <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
              {huWarnungen.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Keine HU-Warnungen.</p>
              ) : (
                <div className="overflow-y-auto max-h-[220px]">
                  {huWarnungen.map((r) => <HuRow key={r.id} resource={r} />)}
                </div>
              )}
            </div>
          </div>
        )}

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
                staffByLocation.map(([loc, members]) => (
                  <div key={loc}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{loc}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{members.length} MA</span>
                    </div>
                    {members.map((m: StaffMembership) => (
                      <div key={m.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.profile.full_name ?? m.profile.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{m.profile.email}</p>
                        </div>
                        <span className="ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {ROLE_LABELS[m.role] ?? m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Flotte Übersicht */}
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
                  {resources.length > 0 ? Math.round((value / resources.length) * 100) : 0}%
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-muted/30">
              <span className="text-xs text-muted-foreground flex-1">Gesamt</span>
              <span className="text-sm font-semibold tabular-nums">{resources.length}</span>
            </div>
          </div>
        </div>
      </div>

      <BookingDialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} />
    </div>
  )
}
