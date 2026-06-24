import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService } from '../service/authService'
import type { Profile } from '../types'
import { AuthContext } from './AuthContext'

interface Props {
  children: React.ReactNode
}

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        authService.getProfile(s.user.id).then(setProfile)
      }
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        authService.getProfile(s.user.id).then(setProfile)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signIn: authService.signInWithIdentifier,
        signOut: authService.signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
