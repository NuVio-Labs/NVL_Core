import type { Tables, Enums } from '@/lib/supabase/database.types'

export type StaffFieldDefinition = Tables<'staff_field_definitions'>
export type StaffFieldDefinitionInsert = Omit<StaffFieldDefinition, 'id' | 'created_at' | 'updated_at'>
export type StaffFieldDefinitionUpdate = Partial<StaffFieldDefinitionInsert>

export type StaffMembership = Tables<'memberships'> & {
  profile: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export type StaffMembershipUpdate = {
  location?: string | null
  metadata?: Record<string, unknown>
  role?: Enums<'membership_role'>
  status?: Enums<'membership_status'>
}
