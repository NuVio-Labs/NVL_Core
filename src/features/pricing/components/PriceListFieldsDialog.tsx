import { useState } from 'react'
import { X, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FieldDefinitionDialog } from '@/features/resources/components/FieldDefinitionDialog'
import type { PriceListItemFieldDefinition } from '../types'
import type { ResourceFieldDefinition, ResourceFieldType } from '@/features/resources/types'
import {
  useCreatePriceListItemFieldDefinition,
  useUpdatePriceListItemFieldDefinition,
  useDeletePriceListItemFieldDefinition,
} from '../hooks/usePriceListItemFieldDefinitions'
import { priceListItemFieldDefinitionService } from '../service/priceListItemFieldDefinitionService'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'

type FieldFormValues = { label: string; name: string; field_type: ResourceFieldType; is_required: boolean }

function SortableRow({
  def,
  onEdit,
  onDelete,
}: {
  def: PriceListItemFieldDefinition
  onEdit: (def: PriceListItemFieldDefinition) => void
  onDelete: (def: PriceListItemFieldDefinition) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: def.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 bg-background border border-border rounded-md"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{def.label}</span>
        <span className="text-xs text-muted-foreground ml-2">{def.name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(def)}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(def)}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

interface Props {
  open: boolean
  priceListId: string
  definitions: PriceListItemFieldDefinition[]
  onClose: () => void
}

export function PriceListFieldsDialog({ open, priceListId, definitions, onClose }: Props) {
  const { activeCompanyId } = useWorkspace()
  const queryClient = useQueryClient()
  const createFieldDef = useCreatePriceListItemFieldDefinition(priceListId)
  const updateFieldDef = useUpdatePriceListItemFieldDefinition(priceListId)
  const deleteFieldDef = useDeletePriceListItemFieldDefinition(priceListId)

  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<PriceListItemFieldDefinition | undefined>()

  const sensors = useSensors(useSensor(PointerSensor))

  if (!open) return null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = definitions.findIndex((d) => d.id === active.id)
    const newIndex = definitions.findIndex((d) => d.id === over.id)
    const reordered = arrayMove(definitions, oldIndex, newIndex)

    // Optimistic update
    queryClient.setQueryData(['price_list_item_field_definitions', priceListId], reordered)

    // Persist new sort_order values
    await Promise.all(
      reordered.map((def, index) =>
        priceListItemFieldDefinitionService.update(def.id, { sort_order: (index + 1) * 10 })
      )
    )
    queryClient.invalidateQueries({ queryKey: ['price_list_item_field_definitions', priceListId] })
  }

  async function handleFieldSubmit(values: FieldFormValues) {
    if (editingField) {
      await updateFieldDef.mutateAsync({ id: editingField.id, payload: { label: values.label, is_required: values.is_required } })
    } else {
      await createFieldDef.mutateAsync(values)
    }
    setFieldDialogOpen(false)
    setEditingField(undefined)
  }

  async function handleDelete(def: PriceListItemFieldDefinition) {
    if (!confirm(`Spalte "${def.label}" wirklich löschen?`)) return
    await deleteFieldDef.mutateAsync(def.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">Spalten verwalten</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {definitions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine Spalten definiert.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={definitions.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                {definitions.map((def) => (
                  <SortableRow
                    key={def.id}
                    def={def}
                    onEdit={(d) => { setEditingField(d); setFieldDialogOpen(true) }}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={() => { setEditingField(undefined); setFieldDialogOpen(true) }}
            className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-md border border-dashed border-border hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            Neue Spalte anlegen
          </button>
        </div>
      </div>

      <FieldDefinitionDialog
        open={fieldDialogOpen}
        definition={editingField as ResourceFieldDefinition | undefined}
        onSubmit={handleFieldSubmit}
        onClose={() => { setFieldDialogOpen(false); setEditingField(undefined) }}
        isLoading={createFieldDef.isPending || updateFieldDef.isPending}
      />
    </div>
  )
}
