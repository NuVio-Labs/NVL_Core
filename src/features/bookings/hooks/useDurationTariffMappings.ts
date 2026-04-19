import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { durationTariffMappingService } from '../service/durationTariffMappingService'
import type { DurationTariffMappingInsert, DurationTariffMappingUpdate } from '../types'

const QUERY_KEY = (companyId: string) => ['duration_tariff_mappings', companyId]

export function useDurationTariffMappings() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => durationTariffMappingService.getAll(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateDurationTariffMapping() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<DurationTariffMappingInsert, 'company_id'>) =>
      durationTariffMappingService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useUpdateDurationTariffMapping() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DurationTariffMappingUpdate }) =>
      durationTariffMappingService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useDeleteDurationTariffMapping() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => durationTariffMappingService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}
