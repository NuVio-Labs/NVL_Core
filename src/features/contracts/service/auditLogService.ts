import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  id: string
  company_id: string
  table_name: string
  record_id: string
  action: 'insert' | 'update' | 'delete'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  profile_id: string | null
  created_at: string
}

export const auditLogService = {
  async listForRecord(companyId: string, tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as AuditLogEntry[]
  },
}
