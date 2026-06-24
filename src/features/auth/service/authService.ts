import { supabase } from '@/lib/supabase'
import type { Profile } from '../types'

export const authService = {
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /**
   * Login per Benutzername ODER E-Mail.
   * Enthält die Eingabe ein '@', wird sie als E-Mail behandelt.
   * Sonst wird über die RPC get_email_for_username die zugehörige E-Mail
   * aufgelöst (case-insensitive) und damit angemeldet.
   */
  async signInWithIdentifier(identifier: string, password: string) {
    const value = identifier.trim()
    let email = value

    if (!value.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_for_username', { p_username: value })
      if (error) throw error
      if (!data) throw new Error('invalid_credentials')
      email = data as string
    }

    return authService.signInWithPassword(email, password)
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error
    return data
  },

  async resetPassword(email: string, redirectTo: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data
  },
}
