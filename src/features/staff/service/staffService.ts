import { supabase } from '@/lib/supabase'
import type { StaffFieldDefinition, StaffFieldDefinitionInsert, StaffFieldDefinitionUpdate, StaffMembership, StaffMembershipUpdate } from '../types'
import type { Enums } from '@/lib/supabase/database.types'

export const staffService = {
  async inviteMember(companyId: string, email: string, role: Enums<'membership_role'>, redirectTo: string) {
    // Echte Einladung über die Edge Function (admin.inviteUserByEmail + Membership).
    // Läuft serverseitig mit service_role; Autorisierung (Admin der Company) wird dort geprüft.
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: { email, company_id: companyId, role, redirect_to: redirectTo },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as { ok: boolean; already_member?: boolean }
  },


  async getMembers(companyId: string): Promise<StaffMembership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*, profile:profiles(id, full_name, email, avatar_url)')
      .eq('company_id', companyId)
      .order('created_at')
    if (error) throw error
    return data as StaffMembership[]
  },

  async updateMember(id: string, payload: StaffMembershipUpdate) {
    const { data, error } = await supabase
      .from('memberships')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, profile:profiles(id, full_name, email, avatar_url)')
      .single()
    if (error) throw error
    return data as StaffMembership
  },

  async deleteMember(id: string) {
    const { error } = await supabase.from('memberships').delete().eq('id', id)
    if (error) throw error
  },

  // Staff field definitions
  async getFieldDefinitions(companyId: string): Promise<StaffFieldDefinition[]> {
    const { data, error } = await supabase
      .from('staff_field_definitions')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order')
    if (error) throw error
    return data
  },

  async createFieldDefinition(payload: StaffFieldDefinitionInsert): Promise<StaffFieldDefinition> {
    const { data, error } = await supabase
      .from('staff_field_definitions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateFieldDefinition(id: string, payload: StaffFieldDefinitionUpdate): Promise<StaffFieldDefinition> {
    const { data, error } = await supabase
      .from('staff_field_definitions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteFieldDefinition(id: string) {
    const { error } = await supabase.from('staff_field_definitions').delete().eq('id', id)
    if (error) throw error
  },
}
