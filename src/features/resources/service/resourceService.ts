import { supabase } from '@/lib/supabase'
import type { Resource, ResourceInsert, ResourceUpdate } from '../types'

export const resourceService = {
  async getAll(companyId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async getById(id: string): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(payload: ResourceInsert): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: ResourceUpdate): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
