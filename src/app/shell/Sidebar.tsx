import { NavLink } from 'react-router'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigation } from '@/app/navigation/config'
import { useWorkspace } from '@/features/workspace'
import { useSidebar } from './SidebarContext'

export function Sidebar() {
  const { activeRole } = useWorkspace()
  const { close } = useSidebar()

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-background flex flex-col h-screen">
      <div className="h-14 flex items-center justify-between px-5 border-b border-border">
        <span className="flex items-center gap-2 font-bold text-base tracking-tight">
          <img src="/assets/Icon.webp" alt="" className="h-7 w-7 rounded-md object-cover" />
          NuVio Core
        </span>
        <button onClick={close} className="md:hidden p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigation.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || !activeRole || item.roles.includes(activeRole),
          )
          if (!visibleItems.length) return null

          return (
            <div key={group.label}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={close}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-foreground hover:bg-muted',
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
