import { createContext } from 'react'
import type { WorkspaceState } from '../types'

interface WorkspaceContextValue extends WorkspaceState {
  switchCompany: (companyId: string) => void
  refreshMemberships: () => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
