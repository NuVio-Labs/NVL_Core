import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { priceListService } from '../service/priceListService'
import type { PriceListInsert, PriceListUpdate } from '../types'

const QUERY_KEY = (companyId: string) => ['price_lists', companyId]

export function usePriceLists() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => priceListService.getAll(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreatePriceList() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<PriceListInsert, 'company_id'>) =>
      priceListService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriceListUpdate }) =>
      priceListService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}

export function useDeletePriceList() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => priceListService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') })
    },
  })
}
