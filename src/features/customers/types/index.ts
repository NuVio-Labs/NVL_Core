import type { Tables } from '@/lib/supabase/database.types'

export type Customer = Tables<'customers'>

export type CustomerInsert = {
  company_id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  street?: string | null
  city?: string | null
  notes?: string | null
}

export type CustomerUpdate = Partial<Omit<CustomerInsert, 'company_id'>>
