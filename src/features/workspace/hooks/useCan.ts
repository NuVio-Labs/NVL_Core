import { useWorkspace } from './useWorkspace'
import { usePermissionOverrides } from './usePermissionOverrides'
import { canWithOverrides, isPlatformOwner } from '@/lib/permissions'
import type { Module, Action } from '@/lib/permissions'
import { useAuth } from '@/features/auth'

/**
 * Returns a `can(module, action)` function that resolves against the global
 * permission matrix + any active company-level overrides.
 *
 * Owner always passes. Falls back gracefully when overrides are loading.
 */
export function useCan() {
  const { activeRole, activeMembership } = useWorkspace()
  const { profile } = useAuth()
  const { data: overrides = [] } = usePermissionOverrides()

  return function can(module: Module, action: Action): boolean {
    if (isPlatformOwner(profile?.platform_role)) return true
    return canWithOverrides(
      activeRole ?? null,
      activeMembership?.id ?? null,
      module,
      action,
      overrides,
    )
  }
}
