import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import { useWorkspace } from '@/features/workspace'

export function Header() {
  const { profile, signOut } = useAuth()
  const { activeCompany, memberships, switchCompany } = useWorkspace()
  const [companyOpen, setCompanyOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const companyRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-5 shrink-0">
      {/* Company Switcher */}
      <div className="relative" ref={companyRef}>
        <button
          onClick={() => setCompanyOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm font-medium hover:text-muted-foreground transition-colors"
        >
          {activeCompany?.name ?? 'Kein Mandant'}
          {memberships.length > 1 && <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {companyOpen && memberships.length > 1 && (
          <div className="absolute top-full left-0 mt-1 w-52 rounded-md border border-border bg-background shadow-md z-50 py-1">
            {memberships.map((m) => (
              <button
                key={m.company_id}
                onClick={() => {
                  switchCompany(m.company_id)
                  setCompanyOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors',
                  m.company_id === activeCompany?.id && 'font-medium',
                )}
              >
                {m.company.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setUserOpen((o) => !o)}
          className="flex items-center gap-2 text-sm hover:text-muted-foreground transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="max-w-32 truncate">{profile?.full_name ?? profile?.email}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {userOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 rounded-md border border-border bg-background shadow-md z-50 py-1">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
            >
              <LogOut className="w-3.5 h-3.5" />
              Abmelden
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
