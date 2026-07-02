import { supabase } from '@/lib/supabase'
import type {
  PublicCompany,
  PublicPriceItem,
  PublicStation,
  PublicVehicle,
} from '../types'

// Datenzugriff für die öffentliche Online-Buchung. Liest ausschließlich die
// public_*-Views (anon-Client, nur SELECT). Jede Abfrage ist strikt nach
// company_slug gefiltert — nie cross-tenant.

export const publicBookingService = {
  async getCompany(companySlug: string): Promise<PublicCompany | null> {
    const { data, error } = await supabase
      .from('public_companies')
      .select('slug, name, lead_hours')
      .eq('slug', companySlug)
      .maybeSingle()
    if (error) throw error
    if (!data?.slug || !data.name) return null
    return { slug: data.slug, name: data.name, leadHours: data.lead_hours ?? 72 }
  },

  async listStations(companySlug: string): Promise<PublicStation[]> {
    const { data, error } = await supabase
      .from('public_stations')
      .select('name, slug, address, phone, online_booking_enabled')
      .eq('company_slug', companySlug)
      .order('name')
    if (error) throw error
    return (data ?? [])
      .filter((r) => r.slug && r.name)
      .map((r) => ({
        slug: r.slug as string,
        name: r.name as string,
        address: r.address,
        phone: r.phone,
        onlineBookingEnabled: r.online_booking_enabled ?? false,
      }))
  },

  async listVehicles(companySlug: string, stationSlug: string): Promise<PublicVehicle[]> {
    const { data, error } = await supabase
      .from('public_vehicles')
      .select('id, name, preis_gruppe, ahk, sitze')
      .eq('company_slug', companySlug)
      .eq('station_slug', stationSlug)
      .order('name')
    if (error) throw error
    return (data ?? [])
      .filter((r) => r.id && r.name)
      .map((r) => ({
        id: r.id as string,
        name: r.name as string,
        preisGruppe: r.preis_gruppe,
        ahk: r.ahk,
        sitze: r.sitze,
      }))
  },

  async listAvailableVehicles(
    companySlug: string,
    stationSlug: string,
    from: Date,
    to: Date,
  ): Promise<PublicVehicle[]> {
    const { data, error } = await supabase.rpc('public_available_vehicles', {
      p_company_slug: companySlug,
      p_station_slug: stationSlug,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      preisGruppe: r.preis_gruppe,
      ahk: r.ahk,
      sitze: r.sitze,
    }))
  },

  async listPriceItems(companySlug: string): Promise<PublicPriceItem[]> {
    const { data, error } = await supabase
      .from('public_price_items')
      .select('price_list_name, item_name, tarif_24std')
      .eq('company_slug', companySlug)
    if (error) throw error
    return (data ?? [])
      .filter((r) => r.item_name)
      .map((r) => ({
        priceListName: r.price_list_name ?? '',
        itemName: r.item_name as string,
        tarif24std: r.tarif_24std,
      }))
  },
}
