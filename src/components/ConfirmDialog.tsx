import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Gestylte Bestätigungsabfrage als Ersatz für das native `window.confirm()`.
 *
 * Imperative API über `useConfirm()`: gibt eine Funktion zurück, die ein Promise
 * <boolean> liefert (true = bestätigt). Damit bleibt der Aufrufer-Code nah am
 * gewohnten Muster:
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: '…', message: '…' }))) return
 *
 * Eine einzige Dialog-Instanz lebt im Provider (AppShell) — keine lokalen
 * Modal-States pro Seite.
 */

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Bei `true` rote (destruktive) Bestätigung — Standard für Löschen. */
  destructive?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false))

interface PendingState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => setPending({ ...options, resolve }))
  }, [])

  const close = useCallback((value: boolean) => {
    setPending((p) => {
      p?.resolve(value)
      return null
    })
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmDialog
          options={pending}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

function ConfirmDialog({ options, onConfirm, onCancel }: {
  options: ConfirmOptions
  onConfirm: () => void
  onCancel: () => void
}) {
  const { title, message, confirmLabel, cancelLabel, destructive = true } = options
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Fokus auf Bestätigen + Esc/Enter-Bedienung wie beim nativen Dialog.
  useEffect(() => {
    confirmRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-background border border-border rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-start gap-3 px-6 pt-6">
          <div className={cn('p-2 rounded-lg shrink-0', destructive ? 'bg-red-50' : 'bg-muted')}>
            <AlertTriangle className={cn('w-5 h-5', destructive ? 'text-destructive' : 'text-foreground')} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">{title ?? 'Bist du sicher?'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted transition-colors shrink-0" aria-label="Schließen">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 mt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            {cancelLabel ?? 'Abbrechen'}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 text-sm rounded-md font-medium transition-opacity hover:opacity-90',
              destructive ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground',
            )}
          >
            {confirmLabel ?? 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  )
}
