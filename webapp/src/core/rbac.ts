export const ROLES = [
  'owner',
  'admin_ti',
  'tecnico_ti',
  'talento_humano',
  'lector',
  'colaborador',
] as const

export type Role = (typeof ROLES)[number]

export const MODULES = ['dashboard', 'inventory', 'workers', 'network', 'incidents'] as const
export type ModuleKey = (typeof MODULES)[number]

const LEVELS = ['none', 'read', 'write', 'admin'] as const
export type PermissionLevel = (typeof LEVELS)[number]

// Matriz de permisos por rol y modulo. "admin" implica poder gestionar
// configuracion del modulo (p.ej. catalogos, miembros); "write" implica
// crear/editar registros; "read" es solo lectura.
const ROLE_PERMISSIONS: Record<Role, Record<ModuleKey, PermissionLevel>> = {
  owner: { dashboard: 'read', inventory: 'admin', workers: 'admin', network: 'admin', incidents: 'admin' },
  admin_ti: { dashboard: 'read', inventory: 'admin', workers: 'write', network: 'admin', incidents: 'admin' },
  tecnico_ti: { dashboard: 'read', inventory: 'write', network: 'write', workers: 'read', incidents: 'write' },
  talento_humano: { dashboard: 'read', inventory: 'read', workers: 'admin', network: 'none', incidents: 'read' },
  lector: { dashboard: 'read', inventory: 'read', workers: 'read', network: 'read', incidents: 'read' },
  colaborador: { dashboard: 'read', inventory: 'none', workers: 'none', network: 'none', incidents: 'write' },
}

function levelIndex(level: PermissionLevel): number {
  return LEVELS.indexOf(level)
}

export function permissionFor(role: Role, module: ModuleKey): PermissionLevel {
  return ROLE_PERMISSIONS[role][module]
}

/** true si el rol tiene al menos el nivel de permiso pedido para ese modulo. */
export function can(role: Role | undefined, module: ModuleKey, atLeast: PermissionLevel): boolean {
  if (!role) return false
  return levelIndex(permissionFor(role, module)) >= levelIndex(atLeast)
}

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}
