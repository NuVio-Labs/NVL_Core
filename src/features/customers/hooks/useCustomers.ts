import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { customerService } from '../service/customerService'
import type { CustomerInsert, CustomerUpdate } from '../types'

const QUERY_KEY = (companyId: string) => ['customers', companyId]

export function useCustomers() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => customerService.list(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<CustomerInsert, 'company_id'>) =>
      customerService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerUpdate }) =>
      customerService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}
