import { supabase } from '../../core/supabaseClient'

export interface OrgMemberOption {
  userId: string
  fullName: string
  role: string
}

/** Miembros de la organizacion con nombre para mostrar (para asignar responsables). */
export async function listOrgMembersWithNames(organizationId: string): Promise<OrgMemberOption[]> {
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', organizationId)
  if (error) throw error
  if (!members?.length) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', members.map((m) => m.user_id))

  const nameByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]))

  return members.map((m) => ({
    userId: m.user_id,
    fullName: nameByUserId.get(m.user_id) || 'Sin nombre',
    role: m.role,
  }))
}
