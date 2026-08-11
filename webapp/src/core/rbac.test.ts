import { describe, expect, it } from 'vitest'
import { can, isValidRole, permissionFor } from './rbac'

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
