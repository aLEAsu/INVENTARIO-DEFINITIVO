import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { type Role, isValidRole } from '../rbac'

export interface OrgMembership {
  organizationId: string
  organizationName: string
  role: Role
}

interface SessionState {
  loading: boolean
  session: Session | null
  user: User | null
  /** Organizacion activa del usuario. Fase 1 asume una sola membresia por
   * usuario (multi-organizacion queda para una fase posterior). */
  membership: OrgMembership | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

async function loadMembership(userId: string): Promise<OrgMembership | null> {
  const { data: member, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error || !member || !isValidRole(member.role)) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', member.organization_id)
    .maybeSingle()

  return {
    organizationId: member.organization_id,
    organizationName: org?.name ?? 'Organizacion',
    role: member.role,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [membership, setMembership] = useState<OrgMembership | null>(null)

  useEffect(() => {
    let active = true

    async function bootstrap(nextSession: Session | null) {
      if (!active) return
      setSession(nextSession)
      if (nextSession?.user) {
        const m = await loadMembership(nextSession.user.id)
        if (active) setMembership(m)
      } else {
        setMembership(null)
      }
      if (active) setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => bootstrap(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void bootstrap(nextSession)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value: SessionState = {
    loading,
    session,
    user: session?.user ?? null,
    membership,
    signIn,
    signOut,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider')
  return ctx
}
