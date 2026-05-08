'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'
import { getClientRedirectUrl } from '@/utils/site-url'
import {
  normalizeUserRole,
  type UserProfile,
  type UserRole,
} from '@/types/roles'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: UserRole
  loading: boolean
  roleLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: 'student',
  loading: true,
  roleLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updatePassword: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ error: null }),
})

const getMetadataRole = (user: User | null) =>
  normalizeUserRole(user?.user_metadata?.role, 'student')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(true)
  const supabase = useSupabaseBrowserClient()
  const router = useRouter()

  const loadProfile = useCallback(
    async (nextUser: User | null) => {
      if (!nextUser) {
        setProfile(null)
        setRole('student')
        setRoleLoading(false)
        return
      }

      setRoleLoading(true)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, requested_role, created_at, updated_at')
          .eq('id', nextUser.id)
          .single()

        if (error || !data) {
          setProfile(null)
          setRole(getMetadataRole(nextUser))
          return
        }

        const nextProfile = {
          ...(data as UserProfile),
          role: normalizeUserRole((data as UserProfile).role, getMetadataRole(nextUser)),
        }

        setProfile(nextProfile)
        setRole(nextProfile.role)
      } catch {
        setProfile(null)
        setRole(getMetadataRole(nextUser))
      } finally {
        setRoleLoading(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    let mounted = true

    // Get initial session (persistent session after refresh)
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return

      if (error) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
        setSession(null)
        setUser(null)
        setProfile(null)
        setRole('student')
        setRoleLoading(false)
        setLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      setLoading(false)
    }).catch(async () => {
      if (!mounted) return

      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
      setSession(null)
      setUser(null)
      setProfile(null)
      setRole('student')
      setRoleLoading(false)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        void loadProfile(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setRole('student')
    router.push('/login')
  }

  const refreshProfile = async () => {
    await loadProfile(user)
  }

  const updatePassword = async (password: string) => {
    return await supabase.auth.updateUser({ password })
  }

  const resetPasswordForEmail = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getClientRedirectUrl('/auth/confirm?next=/reset-password'),
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        roleLoading,
        signOut,
        refreshProfile,
        updatePassword,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
