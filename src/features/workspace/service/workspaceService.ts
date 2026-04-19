import { supabase } from '@/lib/supabase'
import type { MembershipWithCompany } from '../types'

const ACTIVE_COMPANY_KEY = 'nvl_active_company_id'

export const workspaceService = {
  async getMembershipsForProfile(profileId: string): Promise<MembershipWithCompany[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*, company:companies(*)')
      .eq('profile_id', profileId)
      .in('status', ['active', 'invited'])
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as MembershipWithCompany[]
  },

  getStoredActiveCompanyId(): string | null {
    return localStorage.getItem(ACTIVE_COMPANY_KEY)
  },

  setStoredActiveCompanyId(companyId: string): void {
    localStorage.setItem(ACTIVE_COMPANY_KEY, companyId)
  },

  clearStoredActiveCompanyId(): void {
    localStorage.removeItem(ACTIVE_COMPANY_KEY)
  },

  resolveActiveCompanyId(
    memberships: MembershipWithCompany[],
    storedId: string | null,
  ): string | null {
    if (!memberships.length) return null
    const isValid = storedId && memberships.some((m) => m.company_id === storedId)
    return isValid ? storedId : memberships[0].company_id
  },
}
