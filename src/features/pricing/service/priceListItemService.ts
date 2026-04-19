import { supabase } from '@/lib/supabase'
import type { PriceListItem, PriceListItemInsert, PriceListItemUpdate } from '../types'

export const priceListItemService = {
  async getAllForList(priceListId: string): Promise<PriceListItem[]> {
    const { data, error } = await supabase
      .from('price_list_items')
      .select('*')
      .eq('price_list_id', priceListId)
      .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: PriceListItemInsert): Promise<PriceListItem> {
    const { data, error } = await supabase
      .from('price_list_items')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: PriceListItemUpdate): Promise<PriceListItem> {
    const { data, error } = await supabase
      .from('price_list_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('price_list_items').delete().eq('id', id)
    if (error) throw error
  },
}
