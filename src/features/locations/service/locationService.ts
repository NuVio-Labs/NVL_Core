import { supabase } from '@/lib/supabase'
import type { Location, LocationInsert, LocationUpdate } from '../types'

export const locationService = {
  async list(companyId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('company_id', companyId)
      .order('name')
    if (error) throw error
    return data as Location[]
  },

  async create(payload: LocationInsert): Promise<Location> {
    const { data, error } = await supabase.from('locations').insert(payload).select().single()
    if (error) throw error
    return data as Location
  },

  async update(id: string, payload: LocationUpdate): Promise<Location> {
    const { data, error } = await supabase.from('locations').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data as Location
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id)
    if (error) throw error
  },
}
