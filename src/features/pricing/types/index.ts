import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/supabase/database.types'

export type PriceList = Tables<'price_lists'>
export type PriceListInsert = TablesInsert<'price_lists'>
export type PriceListUpdate = TablesUpdate<'price_lists'>

export type PriceListItem = Tables<'price_list_items'>
export type PriceListItemInsert = TablesInsert<'price_list_items'>
export type PriceListItemUpdate = TablesUpdate<'price_list_items'>

export type PriceListItemFieldDefinition = Tables<'price_list_item_field_definitions'>
export type PriceListItemFieldDefinitionInsert = TablesInsert<'price_list_item_field_definitions'>
export type PriceListItemFieldDefinitionUpdate = TablesUpdate<'price_list_item_field_definitions'>
export type PriceListItemFieldType = Enums<'resource_field_type'>

export const FIELD_TYPE_LABELS: Record<PriceListItemFieldType, string> = {
  text: 'Text',
  number: 'Zahl',
  boolean: 'Ja / Nein',
  date: 'Datum',
}
