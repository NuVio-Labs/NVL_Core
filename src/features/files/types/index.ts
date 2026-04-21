export type EntityType = 'resource' | 'contract' | 'customer' | 'company'

export interface CompanyFile {
  id: string
  company_id: string
  entity_type: EntityType
  entity_id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  label: string | null
  uploaded_by: string | null
  created_at: string
}
