import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from './useWorkspace'
import { permissionOverrideService } from '../service/permissionOverrideService'
import type { PermissionOverride } from '@/lib/permissions'

const QUERY_KEY = (companyId: string) => ['permission_overrides', companyId]

export type PermissionOverrideWithId = PermissionOverride & { id: string }

export function usePermissionOverrides() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => permissionOverrideService.list(activeCompanyId!),
    enabled: !!activeCompanyId,
    select: (rows): PermissionOverrideWithId[] => rows.map((r) => ({
      id: r.id,
      subject_type: r.subject_type as 'role' | 'membership',
      subject_id: r.subject_id,
      module: r.module,
      action: r.action,
      granted: r.granted,
    })),
  })
}

export function useUpsertPermissionOverride() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (override: Omit<PermissionOverride, never>) =>
      permissionOverrideService.upsert(activeCompanyId!, override),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useRemovePermissionOverride() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => permissionOverrideService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}
