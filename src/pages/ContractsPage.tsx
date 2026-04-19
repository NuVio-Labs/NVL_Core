import { useState, useMemo } from 'react'
import { Plus, FileText, Search, X, ChevronUp, ChevronDown, ChevronsUpDown, CheckCircle } from 'lucide-react'
import { useWorkspace } from '@/features/workspace'
import { useContracts, useCancelContract } from '@/features/contracts'
import type { ContractWithDetails } from '@/features/contracts'
import { ContractDialog } from '@/features/contracts/components/ContractDialog'
import { CompleteModal } from '@/features/contracts/components/CompleteModal'

import { EmptyState } from '@/components/EmptyState'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  draft:     'Entwurf',
  active:    'Aktiv',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}

const STATUS_CLASS: Record<string, string> = {
  draft:     'bg-muted text-muted-foreground',
  active:    'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const PAYMENT_LABEL: Record<string, string> = {
  open:    'Offen',
  partial: 'Teilzahlung',
  paid:    'Bezahlt',
}

const PAYMENT_CLASS: Record<string, string> = {
  open:    'text-orange-700',
  partial: 'text-amber-700',
  paid:    'text-green-700',
}

type SortDir = 'asc' | 'desc'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function SortIcon({ col, sort }: { col: string; sort: { key: string; dir: SortDir } | null }) {
  if (!sort || sort.key !== col) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
  return sort.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
}

export function ContractsPage() {
  const { activeRole } = useWorkspace()
  const canManage = activeRole === 'admin' || activeRole === 'editor'

  const { data: contracts = [], isLoading } = useContracts()
  const cancelContract = useCancelContract()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContractWithDetails | undefined>()
  const [completing, setCompleting] = useState<ContractWithDetails | undefined>()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('alle')
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>({ key: 'contract_number', dir: 'desc' })

  function handleSort(col: string) {
    setSort((prev) =>
      prev?.key === col
        ? { key: col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col, dir: 'desc' }
    )
  }

  const filteredAndSorted = useMemo(() => {
    let list = contracts

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        String(c.contract_number).includes(q) ||
        (c.resource?.name ?? '').toLowerCase().includes(q) ||
        ((c.resource?.metadata as Record<string, unknown>)?.kennzeichen as string ?? '').toLowerCase().includes(q)
      )
    }

    if (filterStatus !== 'alle') {
      list = list.filter((c) => c.status === filterStatus)
    }

    if (!sort) return list
    return [...list].sort((a, b) => {
      let av: unknown, bv: unknown
      if (sort.key === 'contract_number') { av = a.contract_number; bv = b.contract_number }
      else if (sort.key === 'name') { av = `${a.last_name} ${a.first_name}`; bv = `${b.last_name} ${b.first_name}` }
      else if (sort.key === 'handover_at') { av = a.handover_at ?? ''; bv = b.handover_at ?? '' }
      else if (sort.key === 'status') { av = a.status; bv = b.status }
      else if (sort.key === 'payment_status') { av = a.payment_status; bv = b.payment_status }
      else { av = ''; bv = '' }
      const cmp = String(av).localeCompare(String(bv), 'de', { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [contracts, search, filterStatus, sort])

  const hasFilter = search || filterStatus !== 'alle'

  function openCreate() { setEditing(undefined); setDialogOpen(true) }
  function openEdit(c: ContractWithDetails) { setEditing(c); setDialogOpen(true) }

  async function handleCancel(c: ContractWithDetails) {
    if (!confirm(`Vertrag #${c.contract_number} wirklich stornieren?`)) return
    await cancelContract.mutateAsync(c.id)
  }

  function SortTh({ label, col, className }: { label: string; col: string; className?: string }) {
    return (
      <th className={`text-left px-4 py-3 font-medium ${className ?? ''}`}>
        <button onClick={() => handleSort(col)} className="flex items-center gap-1 hover:text-foreground transition-colors">
          {label}
          <SortIcon col={col} sort={sort} />
        </button>
      </th>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verträge</h1>
          <p className="text-muted-foreground text-sm mt-1">Mietverträge dieses Mandanten</p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Vertrag anlegen
          </button>
        )}
      </div>

      {/* Suche + Filter */}
      {!isLoading && contracts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Nr., Kennzeichen suchen…"
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
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="alle">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="active">Aktiv</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Storniert</option>
          </select>
          {hasFilter && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('alle') }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Filter zurücksetzen
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredAndSorted.length} von {contracts.length}
          </span>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Noch keine Verträge vorhanden"
          description="Lege den ersten Mietvertrag an — direkt aus einer Buchung oder manuell."
          action={canManage ? (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Ersten Vertrag anlegen
            </button>
          ) : undefined}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState icon={FileText} title="Keine Verträge gefunden" description="Keine Verträge entsprechen der aktuellen Filterauswahl." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortTh label="Nr." col="contract_number" className="w-20" />
                <SortTh label="Mieter" col="name" />
                <th className="text-left px-4 py-3 font-medium">Fahrzeug</th>
                <SortTh label="Übergabe" col="handover_at" />
                <SortTh label="Status" col="status" className="w-32" />
                <SortTh label="Zahlung" col="payment_status" className="w-32" />
                {canManage && <th className="px-4 py-3 w-24" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSorted.map((c) => {
                const meta = (c.resource?.metadata ?? {}) as Record<string, unknown>
                const kennzeichen = meta.kennzeichen as string | undefined
                return (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-muted-foreground">
                      #{String(c.contract_number).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span>{c.resource?.name ?? '—'}</span>
                      {kennzeichen && <span className="ml-1.5 text-xs">({kennzeichen})</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.handover_at)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_CLASS[c.status] ?? '')}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium', PAYMENT_CLASS[c.payment_status] ?? '')}>
                        {PAYMENT_LABEL[c.payment_status] ?? c.payment_status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => openEdit(c)}
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                          >
                            Öffnen
                          </button>
                          {c.status !== 'cancelled' && c.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => setCompleting(c)}
                                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Abschließen
                              </button>
                              <button
                                onClick={() => handleCancel(c)}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                              >
                                Stornieren
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ContractDialog
        open={dialogOpen}
        contract={editing}
        onClose={() => { setDialogOpen(false); setEditing(undefined) }}
      />

      {completing && (
        <CompleteModal
          contract={completing}
          onClose={() => setCompleting(undefined)}
        />
      )}
    </div>
  )
}
