import type { Tables, Enums } from '@/lib/supabase/database.types'

export type Company = Tables<'companies'>
export type Membership = Tables<'memberships'>
export type MembershipRole = Enums<'membership_role'>
export type MembershipStatus = Enums<'membership_status'>

export interface MembershipWithCompany extends Membership {
  company: Company
}

export interface WorkspaceState {
  memberships: MembershipWithCompany[]
  activeCompanyId: string | null
  activeCompany: Company | null
  activeMembership: MembershipWithCompany | null
  activeRole: MembershipRole | null
  isLoading: boolean
}
