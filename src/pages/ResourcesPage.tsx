import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, CircleCheck, CircleOff, ChevronUp, ChevronDown, ChevronsUpDown, Search, X, Package, Paperclip } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { useConfirm } from '@/components/ConfirmDialog'
import { useCan } from '@/features/workspace'
import { FileManager } from '@/features/files/components/FileManager'
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from '@/features/resources/hooks/useResources'
import { useFieldDefinitions } from '@/features/resources/hooks/useFieldDefinitions'
import { ResourceDialog } from '@/features/resources/components/ResourceDialog'
import { cn } from '@/lib/utils'
import type { Resource } from '@/features/resources/types'


const PREIS_GRUPPE_LABELS: Record<string, string> = {
  A_PKW: 'PKW A', B_PKW: 'PKW B', C_PKW: 'PKW C', D_PKW: 'PKW D', E_PKW: 'PKW E',
  C_Transporter: 'Transporter C', D_Transporter: 'Transporter D', E_Transporter: 'Transporter E',
  F_Transporter: 'Transporter F', G_Transporter: 'Transporter G',
  B_LKW: 'LKW 3,5t', A_LKW: 'LKW 7,5t',
  A_Anhaenger: 'Anhänger',
}

function formatMetaValue(value: unknown, type: string, fieldName?: string): string {
  if (value === undefined || value === null || value === '') return '—'
  if (type === 'boolean') return value ? 'Ja' : 'Nein'
  if (fieldName === 'preis_gruppe') return PREIS_GRUPPE_LABELS[String(value)] ?? String(value)
  return String(value)
}

type SortDir = 'asc' | 'desc'

function SortIcon({ col, sort }: { col: string; sort: { key: string; dir: SortDir } | null }) {
  if (!sort || sort.key !== col) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
  return sort.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
}

function SortTh({ label, col, sort, onSort, className }: {
  label: string
  col: string
  sort: { key: string; dir: SortDir } | null
  onSort: (col: string) => void
  className?: string
}) {
  return (
    <th className={`text-left px-4 py-3 font-medium ${className ?? ''}`}>
      <button
        onClick={() => onSort(col)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <SortIcon col={col} sort={sort} />
      </button>
    </th>
  )
}

// Inline Standort-Quickaction
function StandortCell({ resource, onSave }: { resource: Resource; onSave: (id: string, standort: string) => Promise<void> }) {
  const meta = (resource.metadata ?? {}) as Record<string, unknown>
  const current = String(meta.standort ?? '')
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (value === current) { setEditing(false); return }
    setSaving(true)
    await onSave(resource.id, value)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(current); setEditing(true) }}
        className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors text-left"
        title="Standort ändern"
      >
        {current || '—'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        className="w-28 border border-primary rounded px-2 py-0.5 text-sm focus:outline-none"
        disabled={saving}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs px-1 py-0.5 rounded hover:bg-muted"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export function ResourcesPage() {
  const can = useCan()
  const confirm = useConfirm()
  const canManage = can('resources.data', 'update')

  const { data: resources = [], isLoading } = useResources()
  const { data: definitions = [] } = useFieldDefinitions()
  const createResource = useCreateResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | undefined>()
  const [filesFor, setFilesFor] = useState<Resource | null>(null)
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null)

  // Suche + Filter
  const [search, setSearch] = useState('')
  const [filterStandort, setFilterStandort] = useState('')
  const [filterStatus, setFilterStatus] = useState<'alle' | 'aktiv' | 'inaktiv'>('alle')

  // Alle vorhandenen Standorte für Filter-Dropdown
  const allStandorte = useMemo(() => {
    const set = new Set<string>()
    for (const r of resources) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>
      const s = String(meta.standort ?? '').trim()
      if (s) set.add(s)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'))
  }, [resources])

  function handleSort(col: string) {
    setSort((prev) =>
      prev?.key === col
        ? { key: col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col, dir: 'asc' }
    )
  }

  const filteredAndSorted = useMemo(() => {
    let list = resources

    // Textsuche über Name, Beschreibung, Kennzeichen
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q) ||
          String(meta.kennzeichen ?? '').toLowerCase().includes(q)
        )
      })
    }

    // Standort-Filter
    if (filterStandort) {
      list = list.filter((r) => {
        const meta = (r.metadata ?? {}) as Record<string, unknown>
        return String(meta.standort ?? '') === filterStandort
      })
    }

    // Status-Filter
    if (filterStatus === 'aktiv') list = list.filter((r) => r.is_active)
    if (filterStatus === 'inaktiv') list = list.filter((r) => !r.is_active)

    // Sortierung
    if (!sort) return list
    return [...list].sort((a, b) => {
      let av: unknown, bv: unknown
      if (sort.key === 'name') { av = a.name; bv = b.name }
      else if (sort.key === 'description') { av = a.description ?? ''; bv = b.description ?? '' }
      else if (sort.key === 'status') { av = a.is_active ? 1 : 0; bv = b.is_active ? 1 : 0 }
      else {
        const ma = (a.metadata ?? {}) as Record<string, unknown>
        const mb = (b.metadata ?? {}) as Record<string, unknown>
        av = ma[sort.key] ?? ''
        bv = mb[sort.key] ?? ''
      }
      const cmp = String(av).localeCompare(String(bv), 'de', { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [resources, search, filterStandort, filterStatus, sort])

  const hasActiveFilter = search || filterStandort || filterStatus !== 'alle'

  function openCreate() { setEditing(undefined); setDialogOpen(true) }
  function openEdit(resource: Resource) { setEditing(resource); setDialogOpen(true) }
  function handleClose() { setDialogOpen(false); setEditing(undefined) }

  async function handleSubmit(values: { name: string; description?: string; is_active: boolean; metadata: Record<string, unknown> }) {
    if (editing) {
      await updateResource.mutateAsync({ id: editing.id, payload: values })
    } else {
      await createResource.mutateAsync(values)
    }
    handleClose()
  }

  async function handleDelete(resource: Resource) {
    const ok = await confirm({ message: `Ressource „${resource.name}" wirklich löschen?` })
    if (!ok) return
    await deleteResource.mutateAsync(resource.id)
  }

  async function handleStandortSave(id: string, standort: string) {
    const resource = resources.find((r) => r.id === id)
    if (!resource) return
    const meta = (resource.metadata ?? {}) as Record<string, unknown>
    await updateResource.mutateAsync({
      id,
      payload: { metadata: { ...meta, standort } },
    })
  }

  const isMutating = createResource.isPending || updateResource.isPending

  // Standort-Spaltenindex für Quickaction
  const standortDefIndex = definitions.findIndex((d) => d.name === 'standort')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ressourcen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwaltung aller Ressourcen dieses Mandanten
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Ressource anlegen
          </button>
        )}
      </div>

      {/* Suche + Filter */}
      {!isLoading && resources.length > 0 && (
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
            value={filterStandort}
            onChange={(e) => setFilterStandort(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle Standorte</option>
            {allStandorte.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'alle' | 'aktiv' | 'inaktiv')}
            className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="alle">Alle Status</option>
            <option value="aktiv">Aktiv</option>
            <option value="inaktiv">Inaktiv</option>
          </select>

          {hasActiveFilter && (
            <button
              onClick={() => { setSearch(''); setFilterStandort(''); setFilterStatus('alle') }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Filter zurücksetzen
            </button>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            {filteredAndSorted.length} von {resources.length}
          </span>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Noch keine Ressourcen vorhanden"
          description="Lege die erste Ressource an um mit der Verwaltung zu beginnen."
          action={canManage ? (
            <button onClick={openCreate} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Erste Ressource anlegen
            </button>
          ) : undefined}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Keine Ressourcen gefunden"
          description="Keine Ressourcen entsprechen der aktuellen Filterauswahl."
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortTh label="Name" col="name" sort={sort} onSort={handleSort} />
                <SortTh label="Beschreibung" col="description" sort={sort} onSort={handleSort} />
                {definitions.map((def) => (
                  <SortTh key={def.id} label={def.label} col={def.name} sort={sort} onSort={handleSort} />
                ))}
                <SortTh label="Status" col="status" sort={sort} onSort={handleSort} className="w-28" />
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSorted.map((resource) => {
                const meta = (resource.metadata ?? {}) as Record<string, unknown>
                return (
                  <tr key={resource.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{resource.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {resource.description ?? '—'}
                    </td>
                    {definitions.map((def, idx) => (
                      <td key={def.id} className="px-4 py-3 text-muted-foreground">
                        {canManage && def.name === 'standort' ? (
                          <StandortCell resource={resource} onSave={handleStandortSave} />
                        ) : (
                          formatMetaValue(meta[def.name], def.field_type, def.name)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {canManage ? (
                        <button
                          onClick={() => updateResource.mutateAsync({ id: resource.id, payload: { is_active: !resource.is_active } })}
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70',
                            resource.is_active ? 'text-green-700' : 'text-muted-foreground'
                          )}
                          title={resource.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          {resource.is_active
                            ? <><CircleCheck className="w-3.5 h-3.5" />Aktiv</>
                            : <><CircleOff className="w-3.5 h-3.5" />Inaktiv</>}
                        </button>
                      ) : resource.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <CircleCheck className="w-3.5 h-3.5" />Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CircleOff className="w-3.5 h-3.5" />Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setFilesFor(filesFor?.id === resource.id ? null : resource)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Dokumente"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => openEdit(resource)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(resource)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dokumente-Panel */}
      {filesFor && (
        <div className="border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Dokumente: {filesFor.name}</h3>
            <button onClick={() => setFilesFor(null)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              Schließen
            </button>
          </div>
          <FileManager entityType="resource" entityId={filesFor.id} readonly={!canManage} />
        </div>
      )}

      <ResourceDialog
        open={dialogOpen}
        resource={editing}
        onSubmit={handleSubmit}
        onClose={handleClose}
        isLoading={isMutating}
      />
    </div>
  )
}
