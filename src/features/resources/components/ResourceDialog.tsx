import { X } from 'lucide-react'
import { ResourceForm } from './ResourceForm'
import type { Resource } from '../types'

interface FormValues {
  name: string
  description?: string
  is_active: boolean
  metadata: Record<string, unknown>
}

interface Props {
  open: boolean
  resource?: Resource
  onSubmit: (values: FormValues) => void
  onClose: () => void
  isLoading?: boolean
}

export function ResourceDialog({ open, resource, onSubmit, onClose, isLoading }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            {resource ? 'Ressource bearbeiten' : 'Ressource anlegen'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ResourceForm
          resource={resource}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
