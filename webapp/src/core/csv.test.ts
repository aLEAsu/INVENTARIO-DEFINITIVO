import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('csv', () => {
  it('neutraliza celdas que empiezan con = (formula injection)', () => {
    const csv = toCsv([['=cmd|calc!A1', 'ok']])
    expect(csv).toBe('"\'=cmd|calc!A1","ok"')
  })

  it('neutraliza + - @ tab y retorno de carro al inicio de una celda', () => {
    expect(toCsv([['+1']])).toBe('"\'+1"')
    expect(toCsv([['-1']])).toBe('"\'-1"')
    expect(toCsv([['@SUM(A1)']])).toBe('"\'@SUM(A1)"')
  })

  it('no toca celdas normales, ni = en medio del texto', () => {
    expect(toCsv([['Ana Rios']])).toBe('"Ana Rios"')
    expect(toCsv([['total = 5']])).toBe('"total = 5"')
  })

  it('escapa comillas dobles duplicandolas', () => {
    expect(toCsv([['dijo "hola"']])).toBe('"dijo ""hola"""')
  })

  it('trata null/undefined como celda vacia', () => {
    expect(toCsv([[null, undefined]])).toBe('"",""')
  })
})
