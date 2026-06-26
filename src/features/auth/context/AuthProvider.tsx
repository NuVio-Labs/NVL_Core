import { useEffect, useRef, useState } from 'react'
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
  // Welche User-ID gerade als User/Profil geladen ist — verhindert unnötige
  // State-Erneuerung beim Token-Refresh (gleicher User).
  const loadedUserId = useRef<string | null>(null)

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s)
      setUser(s?.user ?? null)
      loadedUserId.current = s?.user?.id ?? null
      if (s?.user) {
        authService.getProfile(s.user.id).then(setProfile)
      }
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      const nextUser = s?.user ?? null
      // User/Profil nur bei echter User-Änderung erneuern. Beim Token-Refresh
      // (z.B. nach Tab-Wechsel) feuert Supabase mit demselben User — eine neue
      // Objekt-Referenz würde sonst nachgelagerte Effects (Workspace lädt neu →
      // isLoading=true → Seite hängt kurz aus) auslösen und offene Dialoge schließen.
      if (nextUser?.id !== loadedUserId.current) {
        loadedUserId.current = nextUser?.id ?? null
        setUser(nextUser)
        if (nextUser) {
          authService.getProfile(nextUser.id).then(setProfile)
        } else {
          setProfile(null)
        }
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
