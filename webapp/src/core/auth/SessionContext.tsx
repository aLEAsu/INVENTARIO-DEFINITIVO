import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { type Role, isValidRole } from '../rbac'

export interface OrgMembership {
  organizationId: string
  organizationName: string
  role: Role
}

const ACTIVE_ORG_STORAGE_KEY = 'unop-ti-hub-active-org'

interface SessionState {
  loading: boolean
  session: Session | null
  user: User | null
  /** Todos los trabajos (organizaciones) a los que pertenece el usuario. */
  memberships: OrgMembership[]
  /** Trabajo activo: el ultimo seleccionado (persistido), o el primero disponible. */
  membership: OrgMembership | null
  switchOrganization: (organizationId: string) => void
  createOrganization: (name: string) => Promise<{ organizationId: string | null; error: string | null }>
  refreshMemberships: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

async function loadMemberships(userId: string): Promise<OrgMembership[]> {
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)

  if (error || !members || members.length === 0) return []

  const validMembers = members.filter((m): m is typeof m & { role: Role } => isValidRole(m.role))
  const orgIds = [...new Set(validMembers.map((m) => m.organization_id))]

  const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds)
  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]))

  return validMembers.map((m) => ({
    organizationId: m.organization_id,
    organizationName: nameById.get(m.organization_id) ?? 'Organizacion',
    role: m.role,
  }))
}

function readStoredActiveOrgId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ORG_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeActiveOrgId(organizationId: string) {
  try {
    localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, organizationId)
  } catch {
    // almacenamiento no disponible (modo privado, etc.) - no es critico
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function bootstrap(nextSession: Session | null) {
      if (!active) return
      setSession(nextSession)
      if (nextSession?.user) {
        const list = await loadMemberships(nextSession.user.id)
        if (!active) return
        setMemberships(list)
        const stored = readStoredActiveOrgId()
        const resolved = list.find((m) => m.organizationId === stored) ?? list[0] ?? null
        setActiveOrgId(resolved?.organizationId ?? null)
      } else {
        setMemberships([])
        setActiveOrgId(null)
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

  async function refreshMemberships() {
    if (!session?.user) return
    const list = await loadMemberships(session.user.id)
    setMemberships(list)
    if (!list.some((m) => m.organizationId === activeOrgId)) {
      const stored = readStoredActiveOrgId()
      const resolved = list.find((m) => m.organizationId === stored) ?? list[0] ?? null
      setActiveOrgId(resolved?.organizationId ?? null)
    }
  }

  function switchOrganization(organizationId: string) {
    if (!memberships.some((m) => m.organizationId === organizationId)) return
    setActiveOrgId(organizationId)
    storeActiveOrgId(organizationId)
  }

  async function createOrganization(name: string) {
    const { data, error } = await supabase.rpc('create_organization', { p_name: name })
    if (error || !data) {
      return { organizationId: null, error: error?.message ?? 'No se pudo crear el trabajo' }
    }
    await refreshMemberships()
    setActiveOrgId(data)
    storeActiveOrgId(data)
    return { organizationId: data, error: null }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const membership = memberships.find((m) => m.organizationId === activeOrgId) ?? memberships[0] ?? null

  const value: SessionState = {
    loading,
    session,
    user: session?.user ?? null,
    memberships,
    membership,
    switchOrganization,
    createOrganization,
    refreshMemberships,
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
