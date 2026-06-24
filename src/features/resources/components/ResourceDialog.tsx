import { useState } from 'react'
import { X } from 'lucide-react'
import { ResourceForm } from './ResourceForm'
import { FileManager } from '@/features/files/components/FileManager'
import type { Resource } from '../types'

interface FormValues {
  name: string
  description?: string
  is_active: boolean
  metadata: Record<string, unknown>
}

interface Props {
  open: boolean
  resource?: Resource & { id: string }
  onSubmit: (values: FormValues) => void
  onClose: () => void
  isLoading?: boolean
}

type Tab = 'stammdaten' | 'dokumente'

export function ResourceDialog({ open, resource, onSubmit, onClose, isLoading }: Props) {
  const [tab, setTab] = useState<Tab>('stammdaten')

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

        {!!resource && (
          <div className="flex gap-1 mb-5 border-b border-border">
            {(['stammdaten', 'dokumente'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'stammdaten' ? 'Stammdaten' : 'Dokumente'}
              </button>
            ))}
          </div>
        )}

        {(tab === 'stammdaten' || !resource) ? (
          <ResourceForm
            resource={resource}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        ) : (
          <FileManager entityType="resource" entityId={resource!.id} />
        )}
      </div>
    </div>
  )
}
