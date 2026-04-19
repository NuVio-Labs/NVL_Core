import { supabase } from '@/lib/supabase'
import type { Json } from '@/lib/supabase/database.types'

export const companyService = {
  async updateSettings(companyId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data: current, error: fetchError } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', companyId)
      .single()
    if (fetchError) throw fetchError

    const merged = { ...(current.settings as Record<string, unknown>), ...patch }

    const { data, error } = await supabase
      .from('companies')
      .update({ settings: merged as Json })
      .eq('id', companyId)
      .select('settings')
      .single()
    if (error) throw error
    return data.settings as Record<string, unknown>
  },
}
