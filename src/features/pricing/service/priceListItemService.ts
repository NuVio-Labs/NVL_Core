import { supabase } from '@/lib/supabase'
import type { PriceListItem, PriceListItemInsert, PriceListItemUpdate } from '../types'

export type ResourceClassCategory = 'PKW / 9-Sitzer' | 'Transporter / LKW' | 'Anhänger' | 'Sonstige'

export interface ResourceClass {
  name: string            // technischer Code (z.B. "C_Transporter")
  label: string           // Anzeigename (z.B. "C – Transporter kurz")
  category: ResourceClassCategory
  categoryOrder: number   // Reihenfolge der Gruppe im Dropdown
  sortKey: string         // Sortierung innerhalb der Gruppe (Klassenbuchstabe o.ä.)
}

// Leitet Kategorie + Sortierung aus dem technischen Klassen-Code ab. Erst die
// A–G-Buchstaben-Kategorien (PKW, dann Transporter/LKW), danach die Sonderfälle
// (Anhänger), zum Schluss alles Unbekannte.
function classify(name: string): { category: ResourceClassCategory; categoryOrder: number; sortKey: string } {
  const n = name.toLowerCase()
  // Klassenbuchstabe = der Buchstabe direkt an "_" (z.B. PKW_D → D,
  // Transporter_G → G), sonst der erste Buchstabe (z.B. "B" → B).
  const parts = name.split('_')
  const tail = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  const letter = (tail.match(/[A-Za-z]/)?.[0] ?? name.match(/[A-Za-z]/)?.[0] ?? 'z').toUpperCase()
  if (n.includes('anh')) {
    return { category: 'Anhänger', categoryOrder: 3, sortKey: name.toLowerCase() }
  }
  if (n.includes('transporter') || n.includes('lkw')) {
    return { category: 'Transporter / LKW', categoryOrder: 2, sortKey: letter }
  }
  if (n.includes('pkw') || /^[a-e]$/i.test(name.trim())) {
    return { category: 'PKW / 9-Sitzer', categoryOrder: 1, sortKey: letter }
  }
  return { category: 'Sonstige', categoryOrder: 9, sortKey: name.toLowerCase() }
}

export const priceListItemService = {
  async getAllForList(priceListId: string): Promise<PriceListItem[]> {
    const { data, error } = await supabase
      .from('price_list_items')
      .select('*')
      .eq('price_list_id', priceListId)
      .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  // Eindeutige Klassen (= Preisgruppen) über alle Preislisten eines Mandanten —
  // Quelle für das Preisgruppen-Dropdown bei der Ressourcen-Anlage. Liefert je
  // Klasse den technischen `name`, das gepflegte Anzeige-`label` (Fallback auf
  // den Namen) sowie eine Kategorie für die gruppierte/sortierte Anzeige.
  async getDistinctClasses(companyId: string): Promise<ResourceClass[]> {
    const { data, error } = await supabase
      .from('price_list_items')
      .select('name, metadata, price_lists!inner(company_id)')
      .eq('price_lists.company_id', companyId)
    if (error) throw error
    const byName = new Map<string, string>()
    for (const r of data ?? []) {
      const name = (r as { name: string }).name
      if (byName.has(name)) continue
      const meta = ((r as { metadata?: Record<string, unknown> }).metadata ?? {})
      const label = typeof meta.label === 'string' && meta.label.trim() ? meta.label : name
      byName.set(name, label)
    }
    return Array.from(byName, ([name, label]) => ({ name, label, ...classify(name) }))
      .sort((a, b) =>
        a.categoryOrder - b.categoryOrder ||
        a.sortKey.localeCompare(b.sortKey, 'de') ||
        a.label.localeCompare(b.label, 'de'),
      )
  },

  async create(payload: PriceListItemInsert): Promise<PriceListItem> {
    const { data, error } = await supabase
      .from('price_list_items')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: PriceListItemUpdate): Promise<PriceListItem> {
    const { data, error } = await supabase
      .from('price_list_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('price_list_items').delete().eq('id', id)
    if (error) throw error
  },
}
