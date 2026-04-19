import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { workspaceService } from '../service/workspaceService'
import type { MembershipWithCompany, Company, MembershipRole } from '../types'
import { WorkspaceContext } from './WorkspaceContext'

interface Props {
  children: React.ReactNode
}

export function WorkspaceProvider({ children }: Props) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<MembershipWithCompany[]>([])
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setMemberships([])
      setActiveCompanyId(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    workspaceService
      .getMembershipsForProfile(user.id)
      .then((data) => {
        setMemberships(data)
        const stored = workspaceService.getStoredActiveCompanyId()
        const resolved = workspaceService.resolveActiveCompanyId(data, stored)
        setActiveCompanyId(resolved)
        if (resolved) workspaceService.setStoredActiveCompanyId(resolved)
      })
      .finally(() => setIsLoading(false))
  }, [user])

  const switchCompany = useCallback((companyId: string) => {
    setActiveCompanyId(companyId)
    workspaceService.setStoredActiveCompanyId(companyId)
  }, [])

  const refreshMemberships = useCallback(async () => {
    if (!user) return
    const data = await workspaceService.getMembershipsForProfile(user.id)
    setMemberships(data)
    const stored = workspaceService.getStoredActiveCompanyId()
    const resolved = workspaceService.resolveActiveCompanyId(data, stored)
    setActiveCompanyId(resolved)
    if (resolved) workspaceService.setStoredActiveCompanyId(resolved)
  }, [user])

  const activeMembership = memberships.find((m) => m.company_id === activeCompanyId) ?? null
  const activeCompany: Company | null = activeMembership?.company ?? null
  const activeRole: MembershipRole | null = activeMembership?.role ?? null

  return (
    <WorkspaceContext.Provider
      value={{
        memberships,
        activeCompanyId,
        activeCompany,
        activeMembership,
        activeRole,
        isLoading,
        switchCompany,
        refreshMemberships,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
