import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { locationService } from '../service/locationService'
import type { LocationInsert, LocationUpdate } from '../types'

export function useLocations() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: ['locations', activeCompanyId],
    queryFn: () => locationService.list(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateLocation() {
  const { activeCompanyId } = useWorkspace()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<LocationInsert, 'company_id'>) =>
      locationService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations', activeCompanyId] }),
  })
}

export function useUpdateLocation() {
  const { activeCompanyId } = useWorkspace()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LocationUpdate }) =>
      locationService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations', activeCompanyId] }),
  })
}

export function useDeleteLocation() {
  const { activeCompanyId } = useWorkspace()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => locationService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations', activeCompanyId] }),
  })
}
