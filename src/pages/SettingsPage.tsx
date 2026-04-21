import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useWorkspace, useCompanySettings, useUpdateCompanySettings, usePermissionOverrides, useUpsertPermissionOverride, useRemovePermissionOverride } from '@/features/workspace'
import type { PermissionOverrideWithId } from '@/features/workspace/hooks/usePermissionOverrides'
import { permissions } from '@/lib/permissions'
import type { CompanyRole, Module, Action } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import {
  useFieldDefinitions,
  useCreateFieldDefinition,
  useUpdateFieldDefinition,
  useDeleteFieldDefinition,
} from '@/features/resources/hooks/useFieldDefinitions'
import { FieldDefinitionDialog } from '@/features/resources/components/FieldDefinitionDialog'
import { FIELD_TYPE_LABELS } from '@/features/resources/types'
import type { ResourceFieldDefinition, ResourceFieldType } from '@/features/resources/types'
import {
  useBookingFieldDefinitions,
  useCreateBookingFieldDefinition,
  useUpdateBookingFieldDefinition,
  useDeleteBookingFieldDefinition,
} from '@/features/bookings/hooks/useBookingFieldDefinitions'
import {
  useDurationTariffMappings,
  useCreateDurationTariffMapping,
  useUpdateDurationTariffMapping,
  useDeleteDurationTariffMapping,
} from '@/features/bookings/hooks/useDurationTariffMappings'
import type { BookingFieldDefinition, DurationTariffMapping } from '@/features/bookings/types'
import {
  useStaffFieldDefinitions,
  useCreateStaffFieldDefinition,
  useUpdateStaffFieldDefinition,
  useDeleteStaffFieldDefinition,
} from '@/features/staff/hooks/useStaff'
import type { StaffFieldDefinition } from '@/features/staff/types'
import { usePriceListItemFieldDefinitionsByCompany } from '@/features/pricing/hooks/usePriceListItemFieldDefinitions'
import { useAuth } from '@/features/auth'

type Tab = 'profil' | 'allgemein' | 'ressourcenfelder' | 'buchungsfelder' | 'mitarbeiterfelder' | 'dauer' | 'berechtigungen'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profil', label: 'Profil' },
  { id: 'allgemein', label: 'Allgemein' },
  { id: 'ressourcenfelder', label: 'Ressourcenfelder' },
  { id: 'buchungsfelder', label: 'Buchungsfelder' },
  { id: 'mitarbeiterfelder', label: 'Mitarbeiterfelder' },
  { id: 'dauer', label: 'Dauer & Tarife' },
  { id: 'berechtigungen', label: 'Berechtigungen' },
]

const ROLE_LABELS: Record<CompanyRole, string> = {
  admin: 'Administrator',
  editor: 'Bearbeiter',
  user: 'Mitarbeiter',
}

const ROLES: CompanyRole[] = ['editor', 'user']

const MODULE_LABELS: Partial<Record<Module, string>> = {
  'customers':     'Kunden',
  'resources.data':'Ressourcen',
  'bookings':      'Buchungen',
  'pricing':       'Preislisten',
  'contracts':     'Verträge',
  'ocr':           'Dokument-Scan (OCR)',
  'uploads':       'Uploads',
}

const ACTION_LABELS: Partial<Record<Action, string>> = {
  read:           'Lesen',
  create:         'Anlegen',
  update:         'Bearbeiten',
  delete:         'Löschen',
  archive:        'Archivieren',
  override_price: 'Preis überschreiben',
  finalize:       'Abschließen',
  cancel:         'Stornieren',
}

interface FieldFormValues {
  label: string
  name: string
  field_type: ResourceFieldType
  is_required: boolean
}

function FieldTable({
  definitions,
  isLoading,
  canManage,
  onCreate,
  onEdit,
  onDelete,
  emptyLabel,
  fieldTypeLabels,
}: {
  definitions: Array<{ id: string; label: string; name: string; field_type: ResourceFieldType; is_required: boolean }>
  isLoading: boolean
  canManage: boolean
  onCreate: () => void
  onEdit: (def: { id: string; label: string; name: string; field_type: ResourceFieldType; is_required: boolean }) => void
  onDelete: (def: { id: string; label: string }) => void
  emptyLabel: string
  fieldTypeLabels: Record<ResourceFieldType, string>
}) {
  if (isLoading) return <p className="text-muted-foreground text-sm">Laden…</p>

  if (definitions.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-10 text-center">
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        {canManage && (
          <button onClick={onCreate} className="mt-3 text-sm underline underline-offset-4 text-foreground">
            Erstes Feld anlegen
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Bezeichnung</th>
            <th className="text-left px-4 py-3 font-medium">Feldname</th>
            <th className="text-left px-4 py-3 font-medium w-24">Typ</th>
            <th className="text-left px-4 py-3 font-medium w-20">Pflicht</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {definitions.map((def) => (
            <tr key={def.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 font-medium">{def.label}</td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{def.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{fieldTypeLabels[def.field_type]}</td>
              <td className="px-4 py-3">
                {def.is_required ? (
                  <span className="text-xs font-medium text-foreground">Ja</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Nein</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => onEdit(def)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(def)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function guessMinutes(fieldName: string): number | null {
  const n = fieldName.toLowerCase()
  const match30d = n.match(/30\s*t|30d|30_?tage/)
  if (match30d) return 43200
  const match7d = n.match(/7\s*t|7d|7_?tage/)
  if (match7d) return 10080
  const match1d = n.match(/24\s*h|24std|1\s*t|1d|tag/)
  if (match1d) return 1440
  const match8h = n.match(/8\s*h|8std/)
  if (match8h) return 480
  const match5h = n.match(/5\s*h|5std/)
  if (match5h) return 300
  const match1h = n.match(/1\s*h|1std|stund/)
  if (match1h) return 60
  // try to extract number + unit directly
  const mh = n.match(/(\d+)\s*h/)
  if (mh) return Number(mh[1]) * 60
  const md = n.match(/(\d+)\s*d/)
  if (md) return Number(md[1]) * 1440
  return null
}

function DauerTarifeTab({
  priDefinitions,
  durationMappings,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  priDefinitions: Array<{ id: string; name: string; label: string }>
  durationMappings: DurationTariffMapping[]
  isLoading: boolean
  onCreate: (p: { label: string; duration_minutes: number; field_name: string; sort_order: number }) => Promise<unknown>
  onUpdate: (id: string, p: { duration_minutes: number }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}) {
  const [saving, setSaving] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  if (isLoading) return <p className="text-muted-foreground text-sm">Laden…</p>

  if (priDefinitions.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-10 text-center">
        <p className="text-muted-foreground text-sm">
          Keine numerischen Preislistenfelder vorhanden. Bitte zuerst unter "Preislistenfelder" anlegen.
        </p>
      </div>
    )
  }

  const allHaveMappings = priDefinitions.every((d) =>
    durationMappings.some((m) => m.field_name === d.name)
  )

  async function handleAutoCreate() {
    setSaving(true)
    try {
      for (let idx = 0; idx < priDefinitions.length; idx++) {
        const def = priDefinitions[idx]
        const override = overrides[def.name]
        const mins = override ? Number(override) : guessMinutes(def.name)
        if (!mins || mins <= 0) continue
        const existing = durationMappings.find((m) => m.field_name === def.name)
        if (existing) {
          await onUpdate(existing.id, { duration_minutes: mins })
        } else {
          await onCreate({ label: def.label, duration_minutes: mins, field_name: def.name, sort_order: idx })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const unresolved = priDefinitions.filter(
    (d) => !guessMinutes(d.name) && !overrides[d.name]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Dauer & Tarife</h2>
          <p className="text-muted-foreground text-sm">
            Dauer wird automatisch aus dem Feldnamen erkannt. Bei Bedarf manuell überschreiben.
          </p>
        </div>
        <button
          onClick={handleAutoCreate}
          disabled={saving || unresolved.length > 0}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Wird gespeichert…' : allHaveMappings ? 'Alle aktualisieren' : 'Alle automatisch anlegen'}
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Preisfeld</th>
              <th className="text-left px-4 py-3 font-medium w-40">Erkannte Dauer</th>
              <th className="text-left px-4 py-3 font-medium w-40">Gespeichert</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {priDefinitions.map((def) => {
              const guessed = guessMinutes(def.name)
              const existing = durationMappings.find((m) => m.field_name === def.name)
              const needsOverride = !guessed && !overrides[def.name]
              return (
                <tr key={def.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{def.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{def.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    {guessed ? (
                      <span className="text-green-700 font-medium">{guessed} Min.</span>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        placeholder="Manuell eingeben"
                        value={overrides[def.name] ?? ''}
                        onChange={(e) => setOverrides((o) => ({ ...o, [def.name]: e.target.value }))}
                        className="w-full rounded-md border border-amber-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {existing ? `${existing.duration_minutes} Min.` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {existing && (
                      <button
                        onClick={() => onDelete(existing.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {unresolved.length > 0 && (
        <p className="text-xs text-amber-700">
          {unresolved.length} Feld{unresolved.length > 1 ? 'er' : ''} konnte nicht automatisch erkannt werden — bitte manuell eingeben.
        </p>
      )}
    </div>
  )
}

function ProfilePasswordForm() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave() {
    if (pw.length < 8) { setMsg({ type: 'err', text: 'Mindestens 8 Zeichen' }); return }
    if (pw !== pw2) { setMsg({ type: 'err', text: 'Passwörter stimmen nicht überein' }); return }
    setSaving(true)
    setMsg(null)
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: 'Passwort erfolgreich geändert' })
    setPw(''); setPw2('')
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      <div className="px-4 py-3.5 space-y-2">
        <label className="text-xs text-muted-foreground block">Neues Passwort</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Mindestens 8 Zeichen"
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="px-4 py-3.5 space-y-2">
        <label className="text-xs text-muted-foreground block">Passwort bestätigen</label>
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Wiederholen"
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {msg && (
        <div className={`px-4 py-2.5 text-xs font-medium ${msg.type === 'ok' ? 'text-green-700 bg-green-50' : 'text-destructive bg-red-50'}`}>
          {msg.text}
        </div>
      )}
      <div className="px-4 py-3.5 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !pw || !pw2}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Speichern…' : 'Passwort ändern'}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { activeRole } = useWorkspace()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profil')
  const companySettings = useCompanySettings()
  const updateSettings = useUpdateCompanySettings()

  // Profil
  const [profileName, setProfileName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Ressourcenfelder
  const [resDialogOpen, setResDialogOpen] = useState(false)
  const [resEditing, setResEditing] = useState<ResourceFieldDefinition | undefined>()
  const { data: resDefinitions = [], isLoading: resLoading } = useFieldDefinitions()
  const createResDef = useCreateFieldDefinition()
  const updateResDef = useUpdateFieldDefinition()
  const deleteResDef = useDeleteFieldDefinition()

  // Buchungsfelder
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [bookEditing, setBookEditing] = useState<BookingFieldDefinition | undefined>()
  const { data: bookDefinitions = [], isLoading: bookLoading } = useBookingFieldDefinitions()
  const createBookDef = useCreateBookingFieldDefinition()
  const updateBookDef = useUpdateBookingFieldDefinition()
  const deleteBookDef = useDeleteBookingFieldDefinition()

  // Mitarbeiterfelder
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [staffEditing, setStaffEditing] = useState<StaffFieldDefinition | undefined>()
  const { data: staffDefinitions = [], isLoading: staffLoading } = useStaffFieldDefinitions()
  const createStaffDef = useCreateStaffFieldDefinition()
  const updateStaffDef = useUpdateStaffFieldDefinition()
  const deleteStaffDef = useDeleteStaffFieldDefinition()

  // Dauer & Tarife
  const { data: priDefinitions = [], isLoading: priLoading } = usePriceListItemFieldDefinitionsByCompany()
  const { data: durationMappings = [], isLoading: durLoading } = useDurationTariffMappings()
  const createDurMapping = useCreateDurationTariffMapping()
  const updateDurMapping = useUpdateDurationTariffMapping()
  const deleteDurMapping = useDeleteDurationTariffMapping()

  // Berechtigungen
  const { data: overrides = [] } = usePermissionOverrides()
  const upsertOverride = useUpsertPermissionOverride()
  const removeOverride = useRemovePermissionOverride()

  function getOverride(role: CompanyRole, module: Module, action: Action): PermissionOverrideWithId | undefined {
    return overrides.find((o) => o.subject_type === 'role' && o.subject_id === role && o.module === module && o.action === action)
  }

  function toggleOverride(role: CompanyRole, module: Module, action: Action) {
    const existing = getOverride(role, module, action)
    const defaultAllowed = permissions[module][action]?.includes(role) ?? false
    if (existing) {
      removeOverride.mutate(existing.id)
    } else {
      upsertOverride.mutate({ subject_type: 'role', subject_id: role, module, action, granted: !defaultAllowed })
    }
  }

  function getCellState(role: CompanyRole, module: Module, action: Action): 'granted' | 'denied' | 'default-granted' | 'default-denied' {
    const override = getOverride(role, module, action)
    const defaultAllowed = permissions[module][action]?.includes(role) ?? false
    if (override) return override.granted ? 'granted' : 'denied'
    return defaultAllowed ? 'default-granted' : 'default-denied'
  }

  const canManageCompany = activeRole === 'admin'
  const visibleTabs = TABS.filter((t) => t.id === 'profil' || canManageCompany)

  // Ressourcenfelder handlers
  async function handleResSubmit(values: FieldFormValues) {
    if (resEditing) {
      await updateResDef.mutateAsync({ id: resEditing.id, payload: { label: values.label, is_required: values.is_required } })
    } else {
      await createResDef.mutateAsync(values)
    }
    setResDialogOpen(false)
    setResEditing(undefined)
  }

  async function handleResDelete(def: { id: string; label: string }) {
    if (!confirm(`Feld "${def.label}" wirklich löschen?`)) return
    await deleteResDef.mutateAsync(def.id)
  }

  // Preislistenfelder handlers
  // Buchungsfelder handlers
  async function handleBookSubmit(values: FieldFormValues) {
    if (bookEditing) {
      await updateBookDef.mutateAsync({ id: bookEditing.id, payload: { label: values.label, is_required: values.is_required } })
    } else {
      await createBookDef.mutateAsync(values)
    }
    setBookDialogOpen(false)
    setBookEditing(undefined)
  }

  async function handleBookDelete(def: { id: string; label: string }) {
    if (!confirm(`Feld "${def.label}" wirklich löschen?`)) return
    await deleteBookDef.mutateAsync(def.id)
  }

  // Mitarbeiterfelder handlers
  async function handleStaffSubmit(values: FieldFormValues) {
    if (staffEditing) {
      await updateStaffDef.mutateAsync({ id: staffEditing.id, payload: { label: values.label, is_required: values.is_required } })
    } else {
      await createStaffDef.mutateAsync(values)
    }
    setStaffDialogOpen(false)
    setStaffEditing(undefined)
  }

  async function handleStaffDelete(def: { id: string; label: string }) {
    if (!confirm(`Feld "${def.label}" wirklich löschen?`)) return
    await deleteStaffDef.mutateAsync(def.id)
  }

  // Profil
  async function handleProfileSave() {
    if (!profile) return
    setProfileSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('profiles').update({ full_name: profileName, updated_at: new Date().toISOString() }).eq('id', profile.id)
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">Mandantenweite Konfiguration</p>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'profil' && (
        <div className="space-y-6 max-w-md">
          <div>
            <h2 className="text-base font-semibold">Mein Profil</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Deine persönlichen Angaben</p>
          </div>

          {/* Stammdaten */}
          <div className="border border-border rounded-lg divide-y divide-border">
            <div className="px-4 py-3.5 space-y-1">
              <p className="text-xs text-muted-foreground">E-Mail</p>
              <p className="text-sm font-medium">{profile?.email ?? '—'}</p>
            </div>
            <div className="px-4 py-3.5 space-y-1">
              <p className="text-xs text-muted-foreground">Rolle</p>
              <p className="text-sm font-medium">
                {{ admin: 'Administrator', editor: 'Bearbeiter', user: 'Mitarbeiter' }[activeRole ?? ''] ?? '—'}
              </p>
            </div>
            <div className="px-4 py-3.5 space-y-2">
              <label className="text-xs text-muted-foreground block">Anzeigename</label>
              <input
                type="text"
                value={profileName || profile?.full_name || ''}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Dein Name"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {profileSaving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>

          {/* Passwort ändern */}
          <div>
            <h2 className="text-base font-semibold">Passwort ändern</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Neues Passwort setzen</p>
          </div>
          <ProfilePasswordForm />
        </div>
      )}

      {activeTab === 'allgemein' && (
        <div className="space-y-8 max-w-lg">

          {/* Buchungs-Feldzuordnung */}
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Buchungs-Feldzuordnung</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Welche Ressourcenfelder werden für Buchungslogik verwendet. Frei wählbar — mandantenspezifisch.
              </p>
            </div>
            <div className="border border-border rounded-lg divide-y divide-border">
              {[
                {
                  key: 'booking_field_preisgruppe',
                  label: 'Preisgruppen-Feld',
                  description: 'Verknüpft eine Ressource mit einer Preislisten-Position.',
                  default: 'preisgruppe',
                },
                {
                  key: 'booking_field_standort',
                  label: 'Aktueller Standort-Feld',
                  description: 'Aktueller Standort der Ressource — wird mit der Homebase verglichen.',
                  default: 'aktueller_standort',
                },
              ].map(({ key, label, description, default: def }) => (
                <div key={key} className="px-4 py-3.5 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <select
                    value={(companySettings[key] as string) ?? def}
                    onChange={(e) => updateSettings.mutate({ [key]: e.target.value })}
                    disabled={updateSettings.isPending}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Kein Feld —</option>
                    {resDefinitions.map((d) => (
                      <option key={d.id} value={d.name}>{d.label} ({d.name})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Features</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Optionale Funktionen für diesen Mandanten</p>
            </div>
            <div className="border border-border rounded-lg divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">Führerschein-Scan (OCR)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ermöglicht das Scannen eines Führerscheinfotos zur automatischen Feldbefüllung im Vertragsformular. Verarbeitung erfolgt lokal im Browser — kein Upload, kein Server.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={companySettings.feature_ocr_scan === true}
                  onClick={() => updateSettings.mutate({ feature_ocr_scan: companySettings.feature_ocr_scan !== true })}
                  disabled={updateSettings.isPending}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50',
                    companySettings.feature_ocr_scan === true ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                >
                  <span className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                    companySettings.feature_ocr_scan === true ? 'translate-x-5' : 'translate-x-0',
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Preislisten */}
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Preislisten</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Verhalten von Preislisten-Positionen</p>
            </div>
            <div className="border border-border rounded-lg divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">Einfacher Preis pro Position</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Zeigt das Feld "Preis / Einheit" bei Positionen an. Abwählen wenn Preise ausschließlich über Zusatzfelder definiert werden.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={companySettings.pricing_show_unit_price !== false}
                  onClick={() => updateSettings.mutate({
                    pricing_show_unit_price: companySettings.pricing_show_unit_price === false,
                  })}
                  disabled={updateSettings.isPending}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50',
                    companySettings.pricing_show_unit_price !== false ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                >
                  <span className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                    companySettings.pricing_show_unit_price !== false ? 'translate-x-5' : 'translate-x-0',
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ressourcenfelder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Ressourcenfelder</h2>
              <p className="text-muted-foreground text-sm">Definiere welche Felder beim Anlegen einer Ressource verfügbar sind.</p>
            </div>
            <button
              onClick={() => { setResEditing(undefined); setResDialogOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Feld anlegen
            </button>
          </div>
          <FieldTable
            definitions={resDefinitions}
            isLoading={resLoading}
            canManage={true}
            onCreate={() => { setResEditing(undefined); setResDialogOpen(true) }}
            onEdit={(def) => { setResEditing(def as ResourceFieldDefinition); setResDialogOpen(true) }}
            onDelete={handleResDelete}
            emptyLabel="Noch keine Felder definiert."
            fieldTypeLabels={FIELD_TYPE_LABELS}
          />
        </div>
      )}

      {activeTab === 'buchungsfelder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Buchungsfelder</h2>
              <p className="text-muted-foreground text-sm">Definiere Zusatzfelder die beim Anlegen einer Buchung erscheinen.</p>
            </div>
            <button
              onClick={() => { setBookEditing(undefined); setBookDialogOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Feld anlegen
            </button>
          </div>
          <FieldTable
            definitions={bookDefinitions}
            isLoading={bookLoading}
            canManage={true}
            onCreate={() => { setBookEditing(undefined); setBookDialogOpen(true) }}
            onEdit={(def) => { setBookEditing(def as BookingFieldDefinition); setBookDialogOpen(true) }}
            onDelete={handleBookDelete}
            emptyLabel="Noch keine Buchungsfelder definiert."
            fieldTypeLabels={FIELD_TYPE_LABELS}
          />
        </div>
      )}

      {activeTab === 'mitarbeiterfelder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Mitarbeiterfelder</h2>
              <p className="text-muted-foreground text-sm">Definiere Zusatzfelder die bei Mitarbeitern hinterlegt werden können.</p>
            </div>
            <button
              onClick={() => { setStaffEditing(undefined); setStaffDialogOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Feld anlegen
            </button>
          </div>
          <FieldTable
            definitions={staffDefinitions}
            isLoading={staffLoading}
            canManage={true}
            onCreate={() => { setStaffEditing(undefined); setStaffDialogOpen(true) }}
            onEdit={(def) => { setStaffEditing(def as StaffFieldDefinition); setStaffDialogOpen(true) }}
            onDelete={handleStaffDelete}
            emptyLabel="Noch keine Mitarbeiterfelder definiert."
            fieldTypeLabels={FIELD_TYPE_LABELS}
          />
        </div>
      )}

      {activeTab === 'dauer' && (
        <DauerTarifeTab
          priDefinitions={priDefinitions.filter((d) => d.field_type === 'number')}
          durationMappings={durationMappings}
          isLoading={priLoading || durLoading}
          onCreate={(payload) => createDurMapping.mutateAsync(payload)}
          onUpdate={(id, payload) => updateDurMapping.mutateAsync({ id, payload })}
          onDelete={(id) => deleteDurMapping.mutateAsync(id)}
        />
      )}

      {activeTab === 'berechtigungen' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Berechtigungen</h2>
            <p className="text-muted-foreground text-sm">
              Passe die Standard-Berechtigungen für Rollen an. Grün = erlaubt, Rot = gesperrt, Grau = Standard.
            </p>
          </div>

          {(Object.entries(MODULE_LABELS) as [Module, string][]).map(([module, moduleLabel]) => {
            const moduleActions = Object.keys(permissions[module]).filter((a) => ACTION_LABELS[a as Action]) as Action[]
            if (moduleActions.length === 0) return null
            return (
              <div key={module} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2.5 text-sm font-medium">{moduleLabel}</div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Aktion</th>
                      {ROLES.map((role) => (
                        <th key={role} className="text-center px-4 py-2 font-medium w-32">{ROLE_LABELS[role]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {moduleActions.map((action) => (
                      <tr key={action} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">{ACTION_LABELS[action]}</td>
                        {ROLES.map((role) => {
                          const state = getCellState(role, module, action)
                          const isOverride = state === 'granted' || state === 'denied'
                          return (
                            <td key={role} className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => toggleOverride(role, module, action)}
                                title={isOverride ? 'Klicken zum Zurücksetzen auf Standard' : 'Klicken zum Überschreiben'}
                                className={cn(
                                  'inline-flex items-center justify-center w-8 h-6 rounded text-xs font-medium transition-colors',
                                  state === 'granted' && 'bg-green-100 text-green-700 ring-2 ring-green-400',
                                  state === 'denied' && 'bg-red-100 text-red-700 ring-2 ring-red-400',
                                  state === 'default-granted' && 'bg-green-50 text-green-600',
                                  state === 'default-denied' && 'bg-muted text-muted-foreground',
                                )}
                              >
                                {(state === 'granted' || state === 'default-granted') ? '✓' : '✗'}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          <p className="text-xs text-muted-foreground">
            Administrator hat immer vollen Zugriff. Farblich hinterlegte Buttons sind aktive Overrides — Klick setzt auf Standard zurück.
          </p>
        </div>
      )}

      <FieldDefinitionDialog
        open={resDialogOpen}
        definition={resEditing}
        onSubmit={handleResSubmit}
        onClose={() => { setResDialogOpen(false); setResEditing(undefined) }}
        isLoading={createResDef.isPending || updateResDef.isPending}
      />

      <FieldDefinitionDialog
        open={bookDialogOpen}
        definition={bookEditing as ResourceFieldDefinition | undefined}
        onSubmit={handleBookSubmit}
        onClose={() => { setBookDialogOpen(false); setBookEditing(undefined) }}
        isLoading={createBookDef.isPending || updateBookDef.isPending}
      />

      <FieldDefinitionDialog
        open={staffDialogOpen}
        definition={staffEditing as ResourceFieldDefinition | undefined}
        onSubmit={handleStaffSubmit}
        onClose={() => { setStaffDialogOpen(false); setStaffEditing(undefined) }}
        isLoading={createStaffDef.isPending || updateStaffDef.isPending}
      />

    </div>
  )
}
