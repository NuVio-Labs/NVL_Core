import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase/database.types'

export type PermissionOverrideRow = Tables<'company_permission_overrides'>

export const permissionOverrideService = {
  async list(companyId: string): Promise<PermissionOverrideRow[]> {
    const { data, error } = await supabase
      .from('company_permission_overrides')
      .select('*')
      .eq('company_id', companyId)
    if (error) throw error
    return data
  },

  async upsert(companyId: string, override: {
    subject_type: 'role' | 'membership'
    subject_id: string
    module: string
    action: string
    granted: boolean
  }): Promise<void> {
    const { error } = await supabase
      .from('company_permission_overrides')
      .upsert({ ...override, company_id: companyId }, { onConflict: 'company_id,subject_type,subject_id,module,action' })
    if (error) throw error
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('company_permission_overrides')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
