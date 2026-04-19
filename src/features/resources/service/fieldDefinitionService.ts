import { supabase } from '@/lib/supabase'
import type {
  ResourceFieldDefinition,
  ResourceFieldDefinitionInsert,
  ResourceFieldDefinitionUpdate,
} from '../types'

export const fieldDefinitionService = {
  async getAll(companyId: string): Promise<ResourceFieldDefinition[]> {
    const { data, error } = await supabase
      .from('resource_field_definitions')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: ResourceFieldDefinitionInsert): Promise<ResourceFieldDefinition> {
    const { data, error } = await supabase
      .from('resource_field_definitions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: ResourceFieldDefinitionUpdate): Promise<ResourceFieldDefinition> {
    const { data, error } = await supabase
      .from('resource_field_definitions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('resource_field_definitions')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
