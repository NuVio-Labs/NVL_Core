import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/features/workspace'
import { bookingService } from '../service/bookingService'
import type { BookingInsert, BookingUpdate, MarkReturnedInput } from '../types'

export const bookingKeys = {
  all: (companyId: string) => ['bookings', companyId] as const,
  month: (companyId: string, year: number, month: number) =>
    ['bookings', companyId, year, month] as const,
  range: (companyId: string, from: string, to: string) =>
    ['bookings', companyId, 'range', from, to] as const,
}

export function useBookingsForRange(from: Date, to: Date) {
  const { activeCompanyId } = useWorkspace()
  const fromIso = from.toISOString()
  const toIso = to.toISOString()
  return useQuery({
    queryKey: bookingKeys.range(activeCompanyId ?? '', fromIso, toIso),
    queryFn: () => bookingService.getForDateRange(activeCompanyId!, fromIso, toIso),
    enabled: !!activeCompanyId,
  })
}

export function useBookingsByMonth(year: number, month: number) {
  const { activeCompanyId } = useWorkspace()
  return useQuery({
    queryKey: bookingKeys.month(activeCompanyId ?? '', year, month),
    queryFn: () => bookingService.getByMonth(activeCompanyId!, year, month),
    enabled: !!activeCompanyId,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (payload: Omit<BookingInsert, 'company_id'>) =>
      bookingService.create({ ...payload, company_id: activeCompanyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activeCompanyId] })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BookingUpdate }) =>
      bookingService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activeCompanyId] })
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activeCompanyId] })
    },
  })
}

export function useMarkReturned() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarkReturnedInput }) =>
      bookingService.markReturned(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activeCompanyId] })
    },
  })
}

export function useUndoReturn() {
  const queryClient = useQueryClient()
  const { activeCompanyId } = useWorkspace()
  return useMutation({
    mutationFn: (id: string) => bookingService.undoReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activeCompanyId] })
    },
  })
}
