import { useState, useRef, useEffect } from 'react'
import { Bell, Sparkles, Wrench, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHANGELOG } from '@/data/changelog'

const STORAGE_KEY = 'nvl_changelog_seen'

const TYPE_META: Record<'new' | 'improved' | 'fixed', { label: string; icon: typeof Sparkles; cls: string }> = {
  new: { label: 'Neu', icon: Sparkles, cls: 'text-green-600' },
  improved: { label: 'Verbessert', icon: Wrench, cls: 'text-blue-600' },
  fixed: { label: 'Behoben', icon: Bug, cls: 'text-amber-600' },
}

/**
 * „Was ist neu"-Glocke für Admins. Zeigt das kuratierte Changelog. Ein Punkt an
 * der Glocke signalisiert ungesehene Updates; er verschwindet, sobald das Menü
 * geöffnet wurde (zuletzt gesehene Entry-id in localStorage gemerkt).
 */
export function WhatsNew() {
  const [open, setOpen] = useState(false)
  const [seenId, setSeenId] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
  })
  const ref = useRef<HTMLDivElement>(null)

  const latestId = CHANGELOG[0]?.id ?? null
  const hasUnseen = latestId !== null && latestId !== seenId

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle() {
    setOpen((o) => {
      const next = !o
      // Beim Öffnen als gesehen markieren → Punkt verschwindet.
      if (next && latestId) {
        try { localStorage.setItem(STORAGE_KEY, latestId) } catch { /* ignore */ }
        setSeenId(latestId)
      }
      return next
    })
  }

  if (CHANGELOG.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        title="Was ist neu"
        className="relative p-1.5 rounded-md hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5" />
        {hasUnseen && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-80 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-background shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border sticky top-0 bg-background">
            <p className="text-sm font-semibold">Was ist neu</p>
            <p className="text-xs text-muted-foreground">Letzte Änderungen am System</p>
          </div>
          <div className="divide-y divide-border">
            {CHANGELOG.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-sm font-medium">{entry.title}</p>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="space-y-1.5">
                  {entry.changes.map((c, i) => {
                    const meta = TYPE_META[c.type]
                    const Icon = meta.icon
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', meta.cls)} />
                        <span className="text-muted-foreground">{c.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
