import { useState } from 'react'
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { useCan } from '@/features/workspace'
import { useCustomers, useDeleteCustomer } from '@/features/customers'
import { CustomerDialog } from '@/features/customers/components/CustomerDialog'
import type { Customer } from '@/features/customers'

export function CustomersPage() {
  const can = useCan()
  const { data: customers = [], isLoading } = useCustomers()
  const deleteCustomer = useDeleteCustomer()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')

  const canManage = can('customers', 'update')
  const canDelete = can('customers', 'delete')

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.city ?? '').toLowerCase().includes(q)
    )
  })

  function handleEdit(customer: Customer) {
    setEditing(customer)
    setDialogOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function handleDelete(customer: Customer) {
    if (!confirm(`${customer.first_name} ${customer.last_name} wirklich löschen?`)) return
    deleteCustomer.mutate(customer.id)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kunden</h1>
          <p className="text-muted-foreground text-sm mt-1">Kundenverwaltung dieses Mandanten</p>
        </div>
        {canManage && (
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            Neuer Kunde
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden…</p>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Noch keine Kunden vorhanden"
          description="Lege Kunden an um sie Buchungen und Verträgen zuzuordnen."
          action={canManage ? (
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-4 h-4" />
              Ersten Kunden anlegen
            </button>
          ) : undefined}
        />
      ) : (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Name, E-Mail, Telefon, Ort…"
            className="w-full max-w-sm border border-border rounded-md px-3 py-2 text-sm bg-background"
          />

          <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium w-36">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium">Ort</th>
                  {canManage && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.last_name}, {c.first_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.city ?? '—'}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine Treffer für „{search}"</p>
            )}
          </div>
        </>
      )}

      <CustomerDialog open={dialogOpen} customer={editing} onClose={handleClose} />
    </div>
  )
}
