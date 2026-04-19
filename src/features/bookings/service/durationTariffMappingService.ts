import { supabase } from '@/lib/supabase'
import type { DurationTariffMapping, DurationTariffMappingInsert, DurationTariffMappingUpdate } from '../types'

export const durationTariffMappingService = {
  async getAll(companyId: string): Promise<DurationTariffMapping[]> {
    const { data, error } = await supabase
      .from('duration_tariff_mappings')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: DurationTariffMappingInsert): Promise<DurationTariffMapping> {
    const { data, error } = await supabase
      .from('duration_tariff_mappings')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: DurationTariffMappingUpdate): Promise<DurationTariffMapping> {
    const { data, error } = await supabase
      .from('duration_tariff_mappings')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('duration_tariff_mappings').delete().eq('id', id)
    if (error) throw error
  },
}
