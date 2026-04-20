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
