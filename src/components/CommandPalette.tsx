import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Search, FileText, Calendar, Package, Users, UserCog } from 'lucide-react'
import { useContracts } from '@/features/contracts'
import { useBookingsForRange } from '@/features/bookings/hooks/useBookings'
import { useResources } from '@/features/resources/hooks/useResources'
import { useCustomers } from '@/features/customers'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  label: string
  sub?: string
  icon: React.ElementType
  href: string
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 2, 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 3, 0, 23, 59, 59)
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const now = new Date()
  const { data: contracts = [] } = useContracts()
  const { data: bookings = [] } = useBookingsForRange(startOfMonth(now), endOfMonth(now))
  const { data: resources = [] } = useResources()
  const { data: customers = [] } = useCustomers()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results: Result[] = useCallback(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()

    const contractResults: Result[] = contracts
      .filter((c) => {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase()
        return name.includes(q) || String(c.contract_number).includes(q)
      })
      .slice(0, 4)
      .map((c) => ({
        id: `contract-${c.id}`,
        label: `${c.first_name} ${c.last_name}`,
        sub: `Vertrag #${String(c.contract_number).padStart(4, '0')}`,
        icon: FileText,
        href: '/contracts',
      }))

    const bookingResults: Result[] = bookings
      .filter((b) => `${b.first_name} ${b.last_name}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((b) => ({
        id: `booking-${b.id}`,
        label: `${b.first_name} ${b.last_name}`,
        sub: `Buchung · ${new Date(b.starts_at).toLocaleDateString('de-DE')}`,
        icon: Calendar,
        href: '/bookings',
      }))

    const resourceResults: Result[] = resources
      .filter((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        return r.name.toLowerCase().includes(q) || String(meta.kennzeichen ?? '').toLowerCase().includes(q)
      })
      .slice(0, 3)
      .map((r) => ({
        id: `resource-${r.id}`,
        label: r.name,
        sub: ((r.metadata ?? {}) as Record<string, unknown>).kennzeichen as string | undefined,
        icon: Package,
        href: '/resources',
      }))

    const customerResults: Result[] = customers
      .filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
      .slice(0, 3)
      .map((c) => ({
        id: `customer-${c.id}`,
        label: `${c.first_name} ${c.last_name}`,
        sub: c.phone ?? c.email ?? undefined,
        icon: Users,
        href: '/customers',
      }))

    return [...contractResults, ...bookingResults, ...resourceResults, ...customerResults]
  }, [query, contracts, bookings, resources, customers])()

  useEffect(() => { setSelected(0) }, [results.length])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].href)
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Suche nach Verträgen, Buchungen, Fahrzeugen, Kunden…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono hidden sm:block">Esc</kbd>
        </div>

        {results.length > 0 ? (
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === selected ? 'bg-accent' : 'hover:bg-muted/50'
                  )}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => { navigate(r.href); setOpen(false) }}
                >
                  <r.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    {r.sub && <p className="text-xs text-muted-foreground truncate">{r.sub}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
            <UserCog className="w-4 h-4 shrink-0" />
            Keine Ergebnisse für „{query}"
          </div>
        ) : (
          <div className="px-4 py-4 text-xs text-muted-foreground space-y-1">
            <p>Suche über Verträge, Buchungen, Fahrzeuge und Kunden</p>
          </div>
        )}

        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span><kbd className="font-mono border border-border rounded px-1">↑↓</kbd> navigieren</span>
          <span><kbd className="font-mono border border-border rounded px-1">↵</kbd> öffnen</span>
          <span className="ml-auto">⌘K zum Schließen</span>
        </div>
      </div>
    </div>
  )
}
