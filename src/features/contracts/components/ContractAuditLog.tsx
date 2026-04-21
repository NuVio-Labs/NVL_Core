import { useContractAuditLog } from '../hooks/useAuditLog'

const ACTION_LABELS: Record<string, string> = {
  insert: 'Erstellt',
  update: 'Geändert',
  delete: 'Gelöscht',
}

const ACTION_COLORS: Record<string, string> = {
  insert: 'text-green-600',
  update: 'text-amber-600',
  delete: 'text-destructive',
}

interface Props {
  contractId: string
}

export function ContractAuditLog({ contractId }: Props) {
  const { data: entries = [], isLoading } = useContractAuditLog(contractId)

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Laden…</p>
  if (entries.length === 0) return <p className="text-sm text-muted-foreground py-4">Keine Änderungen vorhanden.</p>

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const changedKeys = entry.action === 'update' && entry.old_data && entry.new_data
          ? Object.keys(entry.new_data).filter(k => JSON.stringify(entry.old_data![k]) !== JSON.stringify(entry.new_data![k]))
          : []

        return (
          <div key={entry.id} className="border border-border rounded-lg px-4 py-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${ACTION_COLORS[entry.action] ?? ''}`}>
                {ACTION_LABELS[entry.action] ?? entry.action}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString('de-DE')}
              </span>
            </div>
            {changedKeys.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Felder: {changedKeys.join(', ')}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
