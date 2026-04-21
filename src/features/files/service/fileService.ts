import { supabase } from '@/lib/supabase'
import type { CompanyFile, EntityType } from '../types'

export const fileService = {
  async list(companyId: string, entityType: EntityType, entityId: string): Promise<CompanyFile[]> {
    const { data, error } = await supabase
      .from('company_files')
      .select('*')
      .eq('company_id', companyId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as CompanyFile[]
  },

  async upload(
    companyId: string,
    entityType: EntityType,
    entityId: string,
    file: File,
    label?: string,
    uploadedBy?: string,
  ): Promise<CompanyFile> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storagePath = `${companyId}/${entityType}/${entityId}/${uniqueName}`

    const { error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('company_files')
      .insert({
        company_id: companyId,
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        label: label ?? null,
        uploaded_by: uploadedBy ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data as CompanyFile
  },

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('company-files')
      .createSignedUrl(filePath, expiresIn)
    if (error) throw error
    return data.signedUrl
  },

  async delete(companyId: string, fileId: string, filePath: string): Promise<void> {
    await supabase.storage.from('company-files').remove([filePath])
    const { error } = await supabase
      .from('company_files')
      .delete()
      .eq('id', fileId)
      .eq('company_id', companyId)
    if (error) throw error
  },
}
