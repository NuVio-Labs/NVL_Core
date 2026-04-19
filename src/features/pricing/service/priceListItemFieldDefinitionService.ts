import { supabase } from '@/lib/supabase'
import type {
  PriceListItemFieldDefinition,
  PriceListItemFieldDefinitionInsert,
  PriceListItemFieldDefinitionUpdate,
} from '../types'

export const priceListItemFieldDefinitionService = {
  async getAll(priceListId: string): Promise<PriceListItemFieldDefinition[]> {
    const { data, error } = await supabase
      .from('price_list_item_field_definitions')
      .select('*')
      .eq('price_list_id', priceListId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async getAllByCompany(companyId: string): Promise<PriceListItemFieldDefinition[]> {
    const { data, error } = await supabase
      .from('price_list_item_field_definitions')
      .select('*, price_lists!inner(company_id)')
      .eq('price_lists.company_id', companyId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: PriceListItemFieldDefinitionInsert): Promise<PriceListItemFieldDefinition> {
    const { data, error } = await supabase
      .from('price_list_item_field_definitions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: PriceListItemFieldDefinitionUpdate): Promise<PriceListItemFieldDefinition> {
    const { data, error } = await supabase
      .from('price_list_item_field_definitions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('price_list_item_field_definitions')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
