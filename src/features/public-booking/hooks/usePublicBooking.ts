import { useQuery } from '@tanstack/react-query'
import { publicBookingService } from '../service/publicBookingService'

// React-Query-Hooks für die öffentliche Buchung. Keine Workspace-Bindung
// (Endkunde hat kein Login) — Cache-Key läuft über den companySlug.

export function usePublicCompany(companySlug: string | undefined) {
  return useQuery({
    queryKey: ['public-company', companySlug],
    queryFn: () => publicBookingService.getCompany(companySlug!),
    enabled: !!companySlug,
  })
}

export function usePublicStations(companySlug: string | undefined) {
  return useQuery({
    queryKey: ['public-stations', companySlug],
    queryFn: () => publicBookingService.listStations(companySlug!),
    enabled: !!companySlug,
  })
}

export function usePublicVehicles(
  companySlug: string | undefined,
  stationSlug: string | undefined,
) {
  return useQuery({
    queryKey: ['public-vehicles', companySlug, stationSlug],
    queryFn: () => publicBookingService.listVehicles(companySlug!, stationSlug!),
    enabled: !!companySlug && !!stationSlug,
  })
}

export function usePublicAvailableVehicles(
  companySlug: string | undefined,
  stationSlug: string | undefined,
  from: Date | null,
  to: Date | null,
) {
  const fromIso = from?.toISOString()
  const toIso = to?.toISOString()
  return useQuery({
    queryKey: ['public-available-vehicles', companySlug, stationSlug, fromIso, toIso],
    queryFn: () =>
      publicBookingService.listAvailableVehicles(companySlug!, stationSlug!, from!, to!),
    enabled: !!companySlug && !!stationSlug && !!from && !!to,
  })
}

export function usePublicPriceItems(companySlug: string | undefined) {
  return useQuery({
    queryKey: ['public-price-items', companySlug],
    queryFn: () => publicBookingService.listPriceItems(companySlug!),
    enabled: !!companySlug,
  })
}
