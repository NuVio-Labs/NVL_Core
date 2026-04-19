import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { bookingFieldDefinitionService } from '../service/bookingFieldDefinitionService'
import type { BookingFieldDefinitionInsert, BookingFieldDefinitionUpdate } from '../types'

const QUERY_KEY = (companyId: string) => ['booking_field_definitions', companyId]

export function useBookingFieldDefinitions() {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: QUERY_KEY(activeCompanyId ?? ''),
    queryFn: () => bookingFieldDefinitionService.getAll(activeCompanyId!),
    enabled: !!activeCompanyId,
  })
}

export function useCreateBookingFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<BookingFieldDefinitionInsert, 'company_id'>) =>
      bookingFieldDefinitionService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useUpdateBookingFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BookingFieldDefinitionUpdate }) =>
      bookingFieldDefinitionService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}

export function useDeleteBookingFieldDefinition() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => bookingFieldDefinitionService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(activeCompanyId ?? '') }),
  })
}
