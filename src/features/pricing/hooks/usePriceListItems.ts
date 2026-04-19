import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { priceListItemService } from '../service/priceListItemService'
import type { PriceListItemInsert, PriceListItemUpdate } from '../types'

const QUERY_KEY = (priceListId: string) => ['price_list_items', priceListId]

export function usePriceListItems(priceListId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY(priceListId ?? ''),
    queryFn: () => priceListItemService.getAllForList(priceListId!),
    enabled: !!priceListId,
  })
}

export function useCreatePriceListItem(priceListId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<PriceListItemInsert, 'price_list_id'>) =>
      priceListItemService.create({ ...payload, price_list_id: priceListId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(priceListId) })
    },
  })
}

export function useUpdatePriceListItem(priceListId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriceListItemUpdate }) =>
      priceListItemService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(priceListId) })
    },
  })
}

export function useDeletePriceListItem(priceListId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => priceListItemService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(priceListId) })
    },
  })
}
