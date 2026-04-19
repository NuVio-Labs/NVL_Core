import type { Session, User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/database.types'

export type Profile = Tables<'profiles'>

export interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
}
