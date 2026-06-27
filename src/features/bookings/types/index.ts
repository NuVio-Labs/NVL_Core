import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/supabase/database.types'

export type Booking = Tables<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

export type BookingWithCreator = Booking & {
  creator: { id: string; full_name: string | null; email: string } | null
  resource: { id: string; name: string; metadata: Record<string, unknown> } | null
}

export type BookingFieldDefinition = Tables<'booking_field_definitions'>
export type BookingFieldDefinitionInsert = TablesInsert<'booking_field_definitions'>
export type BookingFieldDefinitionUpdate = TablesUpdate<'booking_field_definitions'>
export type BookingFieldType = Enums<'resource_field_type'>

export type DurationTariffMapping = Tables<'duration_tariff_mappings'>
export type DurationTariffMappingInsert = TablesInsert<'duration_tariff_mappings'>
export type DurationTariffMappingUpdate = TablesUpdate<'duration_tariff_mappings'>

/**
 * Rückgabe-Information einer Buchung. Liegt in `bookings.metadata.return`,
 * um ohne Schema-Migration auskommen zu können. Hält fest, wer das Fahrzeug
 * wann und an welchem Standort entgegengenommen hat (auditierbarer Log).
 */
export interface BookingReturnInfo {
  returned_at: string
  returned_by: string
  returned_by_name: string
  returned_location_id: string
  returned_location_name: string
}

export interface MarkReturnedInput {
  returnedBy: string
  returnedByName: string
  locationId: string
  locationName: string
}

/** Liest die Rückgabe-Info aus der metadata einer Buchung (oder null). */
export function getReturnInfo(booking: Pick<Booking, 'metadata'>): BookingReturnInfo | null {
  const meta = (booking.metadata ?? {}) as Record<string, unknown>
  const ret = meta.return as Partial<BookingReturnInfo> | undefined
  if (!ret?.returned_at) return null
  return ret as BookingReturnInfo
}
