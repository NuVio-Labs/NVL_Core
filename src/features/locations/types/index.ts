export interface Location {
  id: string
  company_id: string
  name: string
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'>
export type LocationUpdate = Partial<Omit<Location, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
