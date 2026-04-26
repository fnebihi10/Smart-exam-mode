'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'
import { getClientRedirectUrl } from '@/utils/site-url'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  updatePassword: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ error: null }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseBrowserClient()
  const router = useRouter()

  useEffect(() => {
    // Get initial session (persistent session after refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const updatePassword = async (password: string) => {
    return await supabase.auth.updateUser({ password })
  }

  const resetPasswordForEmail = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getClientRedirectUrl('/reset-password'),
    })
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, updatePassword, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
