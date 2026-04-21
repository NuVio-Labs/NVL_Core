import { useState } from 'react'
import { Plus, Pencil, Trash2, CircleCheck, CircleOff, ChevronRight, Settings2, Tag } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { useCompanySettings, useCan } from '@/features/workspace'
import {
  usePriceLists,
  useCreatePriceList,
  useUpdatePriceList,
  useDeletePriceList,
} from '@/features/pricing/hooks/usePriceLists'
import {
  usePriceListItems,
  useCreatePriceListItem,
  useUpdatePriceListItem,
  useDeletePriceListItem,
} from '@/features/pricing/hooks/usePriceListItems'
import { usePriceListItemFieldDefinitions } from '@/features/pricing/hooks/usePriceListItemFieldDefinitions'
import { PriceListDialog } from '@/features/pricing/components/PriceListDialog'
import { PriceListItemDialog } from '@/features/pricing/components/PriceListItemDialog'
import { PriceListFieldsDialog } from '@/features/pricing/components/PriceListFieldsDialog'
import type { PriceList, PriceListItem } from '@/features/pricing/types'
import { cn } from '@/lib/utils'

function formatMetaValue(value: unknown, type: string): string {
  if (value === undefined || value === null || value === '') return '—'
  if (type === 'boolean') return value ? 'Ja' : 'Nein'
  return String(value)
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function ItemsPanel({
  priceList,
  canManage,
}: {
  priceList: PriceList
  canManage: boolean
}) {
  const { data: items = [], isLoading } = usePriceListItems(priceList.id)
  const { data: definitions = [] } = usePriceListItemFieldDefinitions(priceList.id)
  const settings = useCompanySettings()
  const showUnitPrice = settings.pricing_show_unit_price !== false
  const createItem = useCreatePriceListItem(priceList.id)
  const updateItem = useUpdatePriceListItem(priceList.id)
  const deleteItem = useDeletePriceListItem(priceList.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PriceListItem | undefined>()
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(item: PriceListItem) {
    setEditing(item)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
  }

  async function handleSubmit(values: { name: string; unit: string; price_per_unit: number; metadata: Record<string, unknown> }) {
    if (editing) {
      await updateItem.mutateAsync({ id: editing.id, payload: values })
    } else {
      await createItem.mutateAsync(values)
    }
    handleClose()
  }

  async function handleDelete(item: PriceListItem) {
    if (!confirm(`Position "${item.name}" wirklich löschen?`)) return
    await deleteItem.mutateAsync(item.id)
  }

  const isMutating = createItem.isPending || updateItem.isPending

  return (
    <div className="border-t border-border bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Positionen — {priceList.name}
        </p>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFieldsDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors text-muted-foreground"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Spalten
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Position anlegen
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Tag} title="Noch keine Positionen vorhanden" description="Füge Positionen zu dieser Preisliste hinzu." />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Bezeichnung</th>
                <th className="text-left px-4 py-2.5 font-medium w-28">Einheit</th>
                {showUnitPrice && <th className="text-right px-4 py-2.5 font-medium w-36">Preis / Einheit</th>}
                {definitions.map((def) => (
                  <th key={def.id} className="text-left px-4 py-2.5 font-medium">{def.label}</th>
                ))}
                {canManage && <th className="px-4 py-2.5 w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const meta = (item.metadata ?? {}) as Record<string, unknown>
                return (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{item.unit}</td>
                    {showUnitPrice && <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(item.price_per_unit)}</td>}
                    {definitions.map((def) => (
                      <td key={def.id} className="px-4 py-2.5 text-muted-foreground">
                        {formatMetaValue(meta[def.name], def.field_type)}
                      </td>
                    ))}
                    {canManage && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(item)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      <PriceListItemDialog
        open={dialogOpen}
        priceListId={priceList.id}
        item={editing}
        onSubmit={handleSubmit}
        onClose={handleClose}
        isLoading={isMutating}
      />

      <PriceListFieldsDialog
        open={fieldsDialogOpen}
        priceListId={priceList.id}
        definitions={definitions}
        onClose={() => setFieldsDialogOpen(false)}
      />
    </div>
  )
}

export function PricingPage() {
  const can = useCan()
  const canManage = can('pricing', 'update')

  const { data: priceLists = [], isLoading } = usePriceLists()
  const createPriceList = useCreatePriceList()
  const updatePriceList = useUpdatePriceList()
  const deletePriceList = useDeletePriceList()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PriceList | undefined>()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(pl: PriceList) {
    setEditing(pl)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
  }

  async function handleSubmit(values: { name: string; description?: string; is_active: boolean }) {
    if (editing) {
      await updatePriceList.mutateAsync({ id: editing.id, payload: values })
    } else {
      await createPriceList.mutateAsync(values)
    }
    handleClose()
  }

  async function handleDelete(pl: PriceList) {
    if (!confirm(`Preisliste "${pl.name}" wirklich löschen?`)) return
    if (expandedId === pl.id) setExpandedId(null)
    await deletePriceList.mutateAsync(pl.id)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const isMutating = createPriceList.isPending || updatePriceList.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preislisten</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwaltung aller Preislisten dieses Mandanten
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Preisliste anlegen
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : priceLists.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Noch keine Preislisten vorhanden"
          description="Erstelle die erste Preisliste um Tarife und Konditionen zu verwalten."
          action={canManage ? (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Erste Preisliste anlegen
            </button>
          ) : undefined}
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-8" />
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Beschreibung</th>
                <th className="text-left px-4 py-3 font-medium w-28">Status</th>
                {canManage && <th className="px-4 py-3 w-20" />}
              </tr>
            </thead>
            <tbody>
              {priceLists.map((pl) => (
                <>
                  <tr
                    key={pl.id}
                    className={cn(
                      'hover:bg-muted/50 transition-colors cursor-pointer border-t border-border first:border-t-0',
                      expandedId === pl.id && 'bg-muted/30',
                    )}
                    onClick={() => toggleExpand(pl.id)}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 transition-transform',
                          expandedId === pl.id && 'rotate-90',
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{pl.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{pl.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      {pl.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <CircleCheck className="w-3.5 h-3.5" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CircleOff className="w-3.5 h-3.5" />
                          Inaktiv
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(pl)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pl)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedId === pl.id && (
                    <tr key={`${pl.id}-items`}>
                      <td colSpan={canManage ? 5 : 4} className="p-0">
                        <ItemsPanel priceList={pl} canManage={canManage} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PriceListDialog
        open={dialogOpen}
        priceList={editing}
        onSubmit={handleSubmit}
        onClose={handleClose}
        isLoading={isMutating}
      />
    </div>
  )
}
