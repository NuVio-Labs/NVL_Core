import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Search, X, LayoutList, CalendarDays, FileText, CheckCircle } from 'lucide-react'
import { useBookingsByMonth } from '@/features/bookings/hooks/useBookings'
import { BookingDialog } from '@/features/bookings/components/BookingDialog'
import { ContractDialog } from '@/features/contracts/components/ContractDialog'
import { useContracts } from '@/features/contracts'
import type { BookingWithCreator } from '@/features/bookings/types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  // Monday-based: 0=Mo, 6=So
  const startPad = (first.getDay() + 6) % 7
  const days: (Date | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month - 1, d))
  }
  // pad to full weeks
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

type BookingStatus = 'overdue' | 'ending-today' | 'active'

function getBookingStatus(booking: BookingWithCreator, today: Date): BookingStatus {
  const end = new Date(booking.ends_at)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  if (end < todayStart) return 'overdue'
  if (end >= todayStart && end < todayEnd) return 'ending-today'
  return 'active'
}

const STATUS_CHIP: Record<BookingStatus, string> = {
  'active':       'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'ending-today': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  'overdue':      'bg-red-100 text-red-800 hover:bg-red-200',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function BookingChip({ booking, today, hasContract, contractNumber, onClick }: {
  booking: BookingWithCreator
  today: Date
  hasContract?: boolean
  contractNumber?: number
  onClick: (b: BookingWithCreator, e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)
  const status = getBookingStatus(booking, today)

  return (
    <div className="relative">
      <div
        onClick={(e) => onClick(booking, e)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors flex items-center gap-1',
          STATUS_CHIP[status],
        )}
      >
        <span className="truncate">{booking.first_name} {booking.last_name}</span>
        {hasContract && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />}
      </div>
      {hovered && (
        <div
          className="absolute z-50 left-0 top-full mt-1 w-56 bg-popover border border-border rounded-md shadow-lg p-3 space-y-1 text-xs pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-semibold text-foreground">{booking.first_name} {booking.last_name}</p>
          {(booking.metadata as Record<string, unknown>)?.kennzeichen && (
            <p className="text-muted-foreground">Kennzeichen: <span className="text-foreground font-medium">{String((booking.metadata as Record<string, unknown>).kennzeichen)}</span></p>
          )}
          <p className="text-muted-foreground">Von: {formatDateTime(booking.starts_at)}</p>
          <p className="text-muted-foreground">Bis: {formatDateTime(booking.ends_at)}</p>
          {hasContract && contractNumber !== undefined && (
            <p className="text-green-700 font-medium pt-1 border-t border-border">
              Vertrag #{String(contractNumber).padStart(4, '0')} vorhanden
            </p>
          )}
          {booking.creator && (
            <p className="text-muted-foreground pt-1 border-t border-border">
              Angelegt von: {booking.creator.full_name ?? booking.creator.email}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function bookingsForDay(bookings: BookingWithCreator[], day: Date): BookingWithCreator[] {
  return bookings.filter((b) => {
    const start = new Date(b.starts_at)
    const end = new Date(b.ends_at)
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    return start < dayEnd && end > dayStart
  })
}

export function BookingsPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [editingBooking, setEditingBooking] = useState<BookingWithCreator | undefined>()
  const [contractPrefill, setContractPrefill] = useState<BookingWithCreator | undefined>()
  const [contractDialogOpen, setContractDialogOpen] = useState(false)

  const { data: bookings = [], isLoading } = useBookingsByMonth(year, month)
  const { data: contracts = [] } = useContracts()

  const contractByBooking = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contracts) {
      if (c.booking_id) map.set(c.booking_id, c.contract_number)
    }
    return map
  }, [contracts])

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'alle' | 'active' | 'ending-today' | 'overdue'>('alle')

  const filteredBookings = useMemo(() => {
    let list = bookings
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) => {
        const resourceMeta = (b.resource?.metadata ?? {}) as Record<string, unknown>
        return (
          `${b.first_name} ${b.last_name}`.toLowerCase().includes(q) ||
          String(resourceMeta.kennzeichen ?? '').toLowerCase().includes(q)
        )
      })
    }
    if (filterStatus !== 'alle') {
      list = list.filter((b) => getBookingStatus(b, today) === filterStatus)
    }
    return list
  }, [bookings, search, filterStatus])

  const hasFilter = search || filterStatus !== 'alle'

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function handleDayClick(day: Date) {
    setSelectedDate(day)
    setEditingBooking(undefined)
    setDialogOpen(true)
  }

  function handleBookingClick(booking: BookingWithCreator, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingBooking(booking)
    setSelectedDate(new Date(booking.starts_at))
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditingBooking(undefined)
    setSelectedDate(undefined)
  }

  const calendarDays = getCalendarDays(year, month)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buchungen</h1>
          <p className="text-muted-foreground text-sm mt-1">Kalenderübersicht aller Buchungen</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={cn('px-3 py-2 text-sm flex items-center gap-1.5 transition-colors', view === 'calendar' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}
            >
              <CalendarDays className="w-4 h-4" />
              Kalender
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-3 py-2 text-sm flex items-center gap-1.5 border-l border-border transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}
            >
              <LayoutList className="w-4 h-4" />
              Liste
            </button>
          </div>
          <button
            onClick={() => { setSelectedDate(today); setEditingBooking(undefined); setDialogOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Buchung anlegen
          </button>
        </div>
      </div>

      {/* Suche + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Kennzeichen suchen…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="alle">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="ending-today">Endet heute</option>
          <option value="overdue">Überfällig</option>
        </select>
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('alle') }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Filter zurücksetzen
          </button>
        )}
        {hasFilter && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredBookings.length} von {bookings.length}
          </span>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-base font-semibold min-w-[160px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }}
          className="ml-2 px-3 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
        >
          Heute
        </button>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          {isLoading ? (
            <p className="p-10 text-center text-muted-foreground text-sm">Laden…</p>
          ) : filteredBookings.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground text-sm">Keine Buchungen gefunden.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Kennzeichen</th>
                  <th className="text-left px-4 py-3 font-medium">Von</th>
                  <th className="text-left px-4 py-3 font-medium">Bis</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Angelegt von</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((b) => {
                  const status = getBookingStatus(b, today)
                  const statusLabel = { active: 'Aktiv', 'ending-today': 'Endet heute', overdue: 'Überfällig' }[status]
                  const statusClass = { active: 'bg-blue-100 text-blue-800', 'ending-today': 'bg-orange-100 text-orange-800', overdue: 'bg-red-100 text-red-800' }[status]
                  return (
                    <tr
                      key={b.id}
                      onClick={(e) => handleBookingClick(b, e)}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium">{b.first_name} {b.last_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{String((b.resource?.metadata as Record<string, unknown>)?.kennzeichen ?? '—')}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(b.starts_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(b.ends_at)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusClass)}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.creator ? (b.creator.full_name ?? b.creator.email) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {contractByBooking.has(b.id) ? (
                          <span
                            title={`Vertrag #${String(contractByBooking.get(b.id)!).padStart(4, '0')} vorhanden`}
                            className="flex items-center justify-center text-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setContractPrefill(b); setContractDialogOpen(true) }}
                            title="Vertrag anlegen"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Calendar grid */}
      {view === 'calendar' && <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-medium text-muted-foreground text-center bg-muted">
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Laden…</div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`pad-${idx}`} className="min-h-[100px] border-r border-b border-border bg-muted/20" />
              }

              const isToday = isSameDay(day, today)
              const dayBookings = bookingsForDay(filteredBookings, day)
              const isLastRow = idx >= calendarDays.length - 7
              const isLastCol = (idx + 1) % 7 === 0

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'min-h-[100px] p-1.5 cursor-pointer transition-colors hover:bg-muted/40',
                    !isLastRow && 'border-b border-border',
                    !isLastCol && 'border-r border-border',
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ml-auto',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <BookingChip
                        key={b.id}
                        booking={b}
                        today={today}
                        hasContract={contractByBooking.has(b.id)}
                        contractNumber={contractByBooking.get(b.id)}
                        onClick={handleBookingClick}
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayBookings.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>}

      {/* Legende */}
      {view === 'calendar' &&
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          Aktiv
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
          Endet heute
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          Überfällig
        </span>
      </div>}

      <BookingDialog
        open={dialogOpen}
        booking={editingBooking}
        initialDate={selectedDate}
        onClose={handleClose}
        onCreateContract={(b) => { setContractPrefill(b as BookingWithCreator); setContractDialogOpen(true) }}
      />

      <ContractDialog
        open={contractDialogOpen}
        prefillBooking={contractPrefill}
        onClose={() => { setContractDialogOpen(false); setContractPrefill(undefined) }}
      />
    </div>
  )
}
