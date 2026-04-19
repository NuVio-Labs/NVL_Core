import { supabase } from '@/lib/supabase'
import type { PriceList, PriceListInsert, PriceListUpdate } from '../types'

export const priceListService = {
  async getAll(companyId: string): Promise<PriceList[]> {
    const { data, error } = await supabase
      .from('price_lists')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: PriceListInsert): Promise<PriceList> {
    const { data, error } = await supabase
      .from('price_lists')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: PriceListUpdate): Promise<PriceList> {
    const { data, error } = await supabase
      .from('price_lists')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('price_lists').delete().eq('id', id)
    if (error) throw error
  },
}
