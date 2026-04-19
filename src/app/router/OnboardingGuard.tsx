import { Navigate, Outlet } from 'react-router'
import { useWorkspace } from '@/features/workspace'

export function OnboardingGuard() {
  const { activeMembership, memberships, isLoading } = useWorkspace()

  if (isLoading) return null

  const hasOnlyInvited =
    memberships.length > 0 && memberships.every((m) => m.status === 'invited')

  if (activeMembership?.status === 'invited' || hasOnlyInvited) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
