import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { PageErrorBoundary } from './PageErrorBoundary'
import { SidebarProvider, useSidebar } from './SidebarContext'
import { CommandPalette } from '@/components/CommandPalette'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { ToastProvider } from '@/components/Toast'

function AppShellInner() {
  const { open, close } = useSidebar()
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar: always visible on md+, slide-in on mobile */}
      <div className={[
        'fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <SidebarProvider>
          <AppShellInner />
          <CommandPalette />
        </SidebarProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}
