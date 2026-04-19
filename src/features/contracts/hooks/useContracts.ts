import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { contractService } from '../service/contractService'
import type { ContractInsert, ContractUpdate } from '../types'

export const contractKeys = {
  all: (companyId: string) => ['contracts', companyId] as const,
  detail: (id: string) => ['contracts', 'detail', id] as const,
}

export function useContracts() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: contractKeys.all(activeCompanyId ?? ''),
    queryFn: () => contractService.getAll(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: contractKeys.detail(id ?? ''),
    queryFn: () => contractService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateContract() {
  const queryClient = useQueryClient()
  const { activeCompanyId, activeMembership } = useWorkspace()
  return useMutation({
    mutationFn: async (payload: Omit<ContractInsert, 'company_id' | 'created_by' | 'contract_number'>) => {
      const contractNumber = await contractService.getNextNumber(activeCompanyId!)
      return contractService.create({
        ...payload,
        company_id: activeCompanyId!,
        created_by: activeMembership?.profile_id ?? null,
        contract_number: contractNumber,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', activeCompanyId] })
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ContractUpdate }) =>
      contractService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', activeCompanyId] })
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
    },
  })
}

export function useCancelContract() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => contractService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', activeCompanyId] })
    },
  })
}

export function useCompleteContract() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: {
      id: string
      payload: Parameters<typeof contractService.complete>[1]
    }) => contractService.complete(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', activeCompanyId] })
    },
  })
}

export function useContractByBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['contracts', 'by-booking', bookingId],
    queryFn: () => contractService.getByBookingId(bookingId!),
    enabled: !!bookingId,
  })
}
