import { supabase } from '@/lib/supabase'
import type { Booking, BookingInsert, BookingUpdate, BookingWithCreator } from '../types'

export const bookingService = {
  async getAll(companyId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('company_id', companyId)
      .order('starts_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async getByMonth(companyId: string, year: number, month: number): Promise<BookingWithCreator[]> {
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month, 1).toISOString()
    const { data, error } = await supabase
      .from('bookings')
      .select('*, creator:profiles!bookings_created_by_fkey(id, full_name, email), resource:resources(id, name, metadata)')
      .eq('company_id', companyId)
      .lt('starts_at', end)
      .gt('ends_at', start)
      .neq('status', 'cancelled')
      .order('starts_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as BookingWithCreator[]
  },

  async create(payload: BookingInsert): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: BookingUpdate): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) throw error
  },

  async getForDateRange(companyId: string, from: string, to: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .lt('starts_at', to)
      .gt('ends_at', from)
      .order('starts_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  // Check if resource is available for a given time range
  async checkAvailability(
    resourceId: string,
    startsAt: string,
    endsAt: string,
    excludeBookingId?: string,
  ): Promise<boolean> {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('resource_id', resourceId)
      .neq('status', 'cancelled')
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt)

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).length === 0
  },
}
