import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'

export type Contract = Tables<'contracts'>
export type ContractInsert = TablesInsert<'contracts'>
export type ContractUpdate = TablesUpdate<'contracts'>

export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'open' | 'partial' | 'paid'
export type PaymentMethod = 'cash' | 'card' | 'transfer'

export interface ContractExtras {
  vk_sb_reduction?: boolean
  vk_sb_amount?: number
  km_package_100?: boolean
  km_package_100_amount?: number
  km_package_300?: boolean
  km_package_300_amount?: number
  km_package_500?: boolean
  km_package_500_amount?: number
  km_package_1000?: boolean
  km_package_1000_amount?: number
}

export interface ContractSecondRenter {
  first_name: string
  last_name: string
  phone?: string
  street?: string
  city?: string
  date_of_birth?: string
  id_number?: string
  license_class?: string
  license_number?: string
}

/**
 * DSGVO-Nachweislog für OCR-gestützte Dokumentenerfassung.
 * Kein Bildinhalt, keine vollständige Ausweisnummer (PAuswG § 20).
 * Nur Nachweis: Wer hat wann zugestimmt, welche Felder wurden extrahiert.
 */
export interface OcrConsentLog {
  consented_at: string           // ISO timestamp
  consented_by: string           // profile_id des zustimmenden Nutzers
  document_type: 'id_card' | 'drivers_license' | 'passport'
  fields_extracted: string[]     // z.B. ['first_name', 'last_name', 'date_of_birth']
  // Ausweisnummer wird NICHT gespeichert (PAuswG § 20)
}

export type ContractWithDetails = Contract & {
  booking?: { id: string; first_name: string; last_name: string; starts_at: string; ends_at: string } | null
  resource?: { id: string; name: string; metadata: Record<string, unknown> } | null
  creator?: { id: string; full_name: string | null; email: string } | null
}
