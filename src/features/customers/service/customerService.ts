import { supabase } from '@/lib/supabase'
import type { CustomerInsert, CustomerUpdate } from '../types'

export const customerService = {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
    if (error) throw error
    return data
  },

  async create(payload: CustomerInsert) {
    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: CustomerUpdate) {
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
