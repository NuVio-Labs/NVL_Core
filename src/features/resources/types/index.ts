import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/supabase/database.types'

export type Resource = Tables<'resources'>
export type ResourceInsert = TablesInsert<'resources'>
export type ResourceUpdate = TablesUpdate<'resources'>

export type ResourceFieldDefinition = Tables<'resource_field_definitions'>
export type ResourceFieldDefinitionInsert = TablesInsert<'resource_field_definitions'>
export type ResourceFieldDefinitionUpdate = TablesUpdate<'resource_field_definitions'>
export type ResourceFieldType = Enums<'resource_field_type'>

export const FIELD_TYPE_LABELS: Record<ResourceFieldType, string> = {
  text: 'Text',
  number: 'Zahl',
  boolean: 'Ja / Nein',
  date: 'Datum',
}
