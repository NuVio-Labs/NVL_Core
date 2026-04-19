import { supabase } from '@/lib/supabase'
import type { Contract, ContractInsert, ContractUpdate, ContractWithDetails } from '../types'

export const contractService = {
  async getAll(companyId: string): Promise<ContractWithDetails[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        booking:bookings(id, first_name, last_name, starts_at, ends_at),
        resource:resources(id, name, metadata),
        creator:profiles!contracts_created_by_fkey(id, full_name, email)
      `)
      .eq('company_id', companyId)
      .is('archived_at', null)
      .order('contract_number', { ascending: false })
    if (error) throw error
    return (data ?? []) as ContractWithDetails[]
  },

  async getById(id: string): Promise<ContractWithDetails> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        booking:bookings(id, first_name, last_name, starts_at, ends_at),
        resource:resources(id, name, metadata),
        creator:profiles!contracts_created_by_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as ContractWithDetails
  },

  async getNextNumber(companyId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('next_contract_number', { p_company_id: companyId })
    if (error) throw error
    return data as number
  },

  async create(payload: ContractInsert): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: ContractUpdate): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async complete(id: string, payload: Pick<ContractUpdate, 'return_actual_at' | 'km_end' | 'tank_return_full' | 'returned_by' | 'payment_status' | 'payment_method'>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...payload,
        status: 'completed',
        is_locked: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getByBookingId(bookingId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle()
    if (error) throw error
    return data
  },
}
