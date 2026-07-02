import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Leichtgewichtige Toast-Hinweise (kurz eingeblendete Meldung unten rechts).
 * Gleiches imperatives Muster wie useConfirm:
 *
 *   const toast = useToast()
 *   toast({ message: 'Gespeichert', variant: 'success' })
 *
 * Eine Provider-Instanz lebt im AppShell — keine lokalen Toast-States pro Seite.
 * Bewusst selbstgebaut (wie ConfirmDialog), kein neues Toast-Framework.
 */

export type ToastVariant = 'success' | 'info' | 'warning'

export interface ToastOptions {
  message: string
  title?: string
  variant?: ToastVariant
  /** Anzeigedauer in ms. 0 = bleibt bis manuell geschlossen. Default 5000. */
  durationMs?: number
}

type ToastFn = (options: ToastOptions) => void

const ToastContext = createContext<ToastFn>(() => {})

interface ActiveToast extends ToastOptions {
  id: number
}

let counter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastFn>((options) => {
    const id = ++counter
    setToasts((list) => [...list, { ...options, id }])
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

const VARIANT_STYLE: Record<ToastVariant, { icon: React.ElementType; iconClass: string; ring: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-green-600', ring: 'ring-green-100' },
  info: { icon: Info, iconClass: 'text-blue-600', ring: 'ring-blue-100' },
  warning: { icon: AlertTriangle, iconClass: 'text-amber-600', ring: 'ring-amber-100' },
}

function ToastItem({ toast, onDismiss }: { toast: ActiveToast; onDismiss: () => void }) {
  const { message, title, variant = 'info', durationMs = 5000 } = toast

  useEffect(() => {
    if (durationMs <= 0) return
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, onDismiss])

  const { icon: Icon, iconClass, ring } = VARIANT_STYLE[variant]

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-lg ring-1',
        ring,
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <button onClick={onDismiss} className="p-0.5 rounded hover:bg-muted transition-colors shrink-0" aria-label="Schließen">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}
