import { supabase } from '@/lib/supabase'
import type { BookingFieldDefinition, BookingFieldDefinitionInsert, BookingFieldDefinitionUpdate } from '../types'

export const bookingFieldDefinitionService = {
  async getAll(companyId: string): Promise<BookingFieldDefinition[]> {
    const { data, error } = await supabase
      .from('booking_field_definitions')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: BookingFieldDefinitionInsert): Promise<BookingFieldDefinition> {
    const { data, error } = await supabase
      .from('booking_field_definitions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: BookingFieldDefinitionUpdate): Promise<BookingFieldDefinition> {
    const { data, error } = await supabase
      .from('booking_field_definitions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('booking_field_definitions').delete().eq('id', id)
    if (error) throw error
  },
}
