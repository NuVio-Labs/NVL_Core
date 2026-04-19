import { Users } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kunden</h1>
        <p className="text-muted-foreground text-sm mt-1">Kundenverwaltung dieses Mandanten</p>
      </div>
      <EmptyState
        icon={Users}
        title="Kunden noch nicht verfügbar"
        description="Das Kundenmodul wird in Kürze bereitgestellt. Kunden können dann angelegt, bearbeitet und Buchungen zugeordnet werden."
      />
    </div>
  )
}
