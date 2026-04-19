import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/features/auth'
import { WorkspaceProvider } from '@/features/workspace'
import { AppRouter } from '@/app/router'

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <AppRouter />
        </WorkspaceProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
