import { describe, expect, it } from 'vitest'
import { can, isValidRole, permissionFor, MODULES, ROLES, type PermissionLevel, type Role, type ModuleKey } from './rbac'

describe('rbac', () => {
  it('owner tiene admin en inventario', () => {
    expect(permissionFor('owner', 'inventory')).toBe('admin')
    expect(can('owner', 'inventory', 'write')).toBe(true)
  })

  it('lector solo puede leer, nunca escribir', () => {
    expect(can('lector', 'inventory', 'read')).toBe(true)
    expect(can('lector', 'inventory', 'write')).toBe(false)
  })

  it('colaborador no tiene acceso a inventario pero si a incidentes', () => {
    expect(can('colaborador', 'inventory', 'read')).toBe(false)
    expect(can('colaborador', 'incidents', 'write')).toBe(true)
  })

  it('sin rol (undefined) nunca autoriza nada', () => {
    expect(can(undefined, 'dashboard', 'read')).toBe(false)
  })

  it('isValidRole rechaza valores fuera del enum', () => {
    expect(isValidRole('owner')).toBe(true)
    expect(isValidRole('superadmin')).toBe(false)
  })
})

// Matriz completa, documentada explicitamente: si alguien cambia un nivel
// de permiso en ROLE_PERMISSIONS sin querer, esto falla senalando
// exactamente que celda de la matriz cambio.
const EXPECTED: Record<Role, Record<ModuleKey, PermissionLevel>> = {
  owner: { dashboard: 'read', inventory: 'admin', workers: 'admin', network: 'admin', incidents: 'admin' },
  admin_ti: { dashboard: 'read', inventory: 'admin', workers: 'write', network: 'admin', incidents: 'admin' },
  tecnico_ti: { dashboard: 'read', inventory: 'write', network: 'write', workers: 'read', incidents: 'write' },
  talento_humano: { dashboard: 'read', inventory: 'read', workers: 'admin', network: 'none', incidents: 'read' },
  lector: { dashboard: 'read', inventory: 'read', workers: 'read', network: 'read', incidents: 'read' },
  colaborador: { dashboard: 'read', inventory: 'none', workers: 'none', network: 'none', incidents: 'write' },
}

describe('rbac: matriz completa de permisos (todos los roles x todos los modulos)', () => {
  for (const role of ROLES) {
    for (const module of MODULES) {
      it(`${role} en ${module} => "${EXPECTED[role][module]}"`, () => {
        expect(permissionFor(role, module)).toBe(EXPECTED[role][module])
      })
    }
  }
})

describe('rbac: can() respeta la jerarquia none < read < write < admin', () => {
  it('admin implica write y read', () => {
    expect(can('owner', 'inventory', 'admin')).toBe(true)
    expect(can('owner', 'inventory', 'write')).toBe(true)
    expect(can('owner', 'inventory', 'read')).toBe(true)
  })

  it('write NO implica admin', () => {
    expect(can('tecnico_ti', 'inventory', 'write')).toBe(true)
    expect(can('tecnico_ti', 'inventory', 'admin')).toBe(false)
  })

  it('none no autoriza ni siquiera lectura', () => {
    expect(can('colaborador', 'inventory', 'none')).toBe(true)
    expect(can('colaborador', 'inventory', 'read')).toBe(false)
  })
})
