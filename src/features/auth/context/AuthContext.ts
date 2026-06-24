import { createContext } from 'react'
import type { AuthState } from '../types'
import type { authService } from '../service/authService'

interface AuthContextValue extends AuthState {
  signIn: typeof authService.signInWithIdentifier
  signOut: typeof authService.signOut
}

export const AuthContext = createContext<AuthContextValue | null>(null)
