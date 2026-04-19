import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { resourceService } from '../service/resourceService'
import type { ResourceInsert, ResourceUpdate } from '../types'

const QUERY_KEY = (companyId: string) => ['resources', companyId]

export function useResources() {
  const { activeCompanyId } = useWorkspace()

  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => resourceService.getAll(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateResource() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()

  return useMutation({
    mutationFn: (payload: Omit<ResourceInsert, 'company_id'>) =>
      resourceService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourceUpdate }) =>
      resourceService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()

  return useMutation({
    mutationFn: (id: string) => resourceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}
