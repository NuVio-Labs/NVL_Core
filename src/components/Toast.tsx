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
      {/* Mittig oben, prägnant — überlagert den Inhalt bewusst mittig-zentriert. */}
      <div className="fixed inset-x-0 top-6 z-[80] flex flex-col items-center gap-3 px-4 pointer-events-none">
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

const VARIANT_STYLE: Record<ToastVariant, { icon: React.ElementType; iconClass: string; border: string; iconBg: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-green-600', border: 'border-green-200', iconBg: 'bg-green-50' },
  info: { icon: Info, iconClass: 'text-blue-600', border: 'border-blue-200', iconBg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, iconClass: 'text-amber-600', border: 'border-amber-200', iconBg: 'bg-amber-50' },
}

function ToastItem({ toast, onDismiss }: { toast: ActiveToast; onDismiss: () => void }) {
  const { message, title, variant = 'info', durationMs = 5000 } = toast

  useEffect(() => {
    if (durationMs <= 0) return
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, onDismiss])

  const { icon: Icon, iconClass, border, iconBg } = VARIANT_STYLE[variant]

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-start gap-4 rounded-2xl border-2 bg-background px-5 py-4 shadow-2xl',
        border,
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}>
        <Icon className={cn('w-6 h-6', iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        {title && <p className="text-base font-bold text-foreground">{title}</p>}
        <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
      </div>
      <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0" aria-label="Schließen">
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  )
}
