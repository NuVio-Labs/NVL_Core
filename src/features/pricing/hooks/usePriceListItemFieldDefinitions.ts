import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { priceListItemFieldDefinitionService } from '../service/priceListItemFieldDefinitionService'
import type { PriceListItemFieldDefinitionInsert, PriceListItemFieldDefinitionUpdate } from '../types'

const QUERY_KEY = (priceListId: string) => ['price_list_item_field_definitions', priceListId]
const COMPANY_QUERY_KEY = (companyId: string) => ['price_list_item_field_definitions_all', companyId]

export function usePriceListItemFieldDefinitionsByCompany() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: COMPANY_QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => priceListItemFieldDefinitionService.getAllByCompany(activeCompanyId!),
    enabled: !!activeCompanyId,
    select: (data) => {
      // Deduplicate by name, keep first occurrence
      const seen = new Set<string>()
      return data.filter((d) => {
        if (seen.has(d.name)) return false
        seen.add(d.name)
        return true
      })
    },
  })
}

export function usePriceListItemFieldDefinitions(priceListId: string) {
  return useQuery({
    queryKey: QUERY_KEY(priceListId),
    queryFn: () => priceListItemFieldDefinitionService.getAll(priceListId),
    enabled: !!priceListId,
  })
}

export function useCreatePriceListItemFieldDefinition(priceListId: string) {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<PriceListItemFieldDefinitionInsert, 'company_id' | 'price_list_id'>) =>
      priceListItemFieldDefinitionService.create({
        ...payload,
        company_id: activeCompanyId!,
        price_list_id: priceListId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(priceListId) })
    },
  })
}

export function useUpdatePriceListItemFieldDefinition(priceListId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriceListItemFieldDefinitionUpdate }) =>
      priceListItemFieldDefinitionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(priceListId) })
    },
  })
}

export function useDeletePriceListItemFieldDefinition(priceListId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => priceListItemFieldDefinitionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(priceListId) })
    },
  })
}
