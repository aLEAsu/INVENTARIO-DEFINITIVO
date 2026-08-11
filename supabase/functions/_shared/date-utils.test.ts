import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { addDays, birthdayMatchesTarget, isLeapYear, isoDate } from './date-utils.ts'

Deno.test('isLeapYear - anios bisiestos y no bisiestos', () => {
  assertEquals(isLeapYear(2024), true) // divisible entre 4
  assertEquals(isLeapYear(2025), false)
  assertEquals(isLeapYear(2100), false) // divisible entre 100 pero no 400
  assertEquals(isLeapYear(2000), true) // divisible entre 400
})

Deno.test('addDays - suma cruzando meses y anios', () => {
  assertEquals(addDays(2026, 2, 28, 1), { year: 2026, month: 3, day: 1 })
  assertEquals(addDays(2026, 12, 31, 1), { year: 2027, month: 1, day: 1 })
  assertEquals(addDays(2024, 2, 28, 1), { year: 2024, month: 2, day: 29 }) // bisiesto
})

Deno.test('isoDate - formatea con ceros a la izquierda', () => {
  assertEquals(isoDate(2026, 3, 5), '2026-03-05')
})

Deno.test('birthdayMatchesTarget - coincidencia exacta', () => {
  assertEquals(birthdayMatchesTarget(5, 15, { year: 2026, month: 5, day: 15 }, 'feb_28'), true)
  assertEquals(birthdayMatchesTarget(5, 15, { year: 2026, month: 5, day: 16 }, 'feb_28'), false)
})

Deno.test('birthdayMatchesTarget - 29 de febrero en anio NO bisiesto, politica feb_28', () => {
  const target = { year: 2026, month: 2, day: 28 } // 2026 no es bisiesto
  assertEquals(birthdayMatchesTarget(2, 29, target, 'feb_28'), true)
  assertEquals(birthdayMatchesTarget(2, 29, { year: 2026, month: 3, day: 1 }, 'feb_28'), false)
})

Deno.test('birthdayMatchesTarget - 29 de febrero en anio NO bisiesto, politica mar_1', () => {
  assertEquals(birthdayMatchesTarget(2, 29, { year: 2026, month: 3, day: 1 }, 'mar_1'), true)
  assertEquals(birthdayMatchesTarget(2, 29, { year: 2026, month: 2, day: 28 }, 'mar_1'), false)
})

Deno.test('birthdayMatchesTarget - 29 de febrero en anio SI bisiesto se celebra el 29, ninguna politica aplica', () => {
  const target = { year: 2028, month: 2, day: 29 } // 2028 es bisiesto
  assertEquals(birthdayMatchesTarget(2, 29, target, 'feb_28'), true)
  assertEquals(birthdayMatchesTarget(2, 29, { year: 2028, month: 2, day: 28 }, 'feb_28'), false)
  assertEquals(birthdayMatchesTarget(2, 29, { year: 2028, month: 3, day: 1 }, 'mar_1'), false)
})

Deno.test('birthdayMatchesTarget - un cumpleanos normal nunca coincide con la ventana de 29 feb', () => {
  assertEquals(birthdayMatchesTarget(2, 28, { year: 2026, month: 2, day: 28 }, 'feb_28'), true) // coincidencia normal, no por la regla especial
  assertEquals(birthdayMatchesTarget(3, 1, { year: 2026, month: 3, day: 1 }, 'mar_1'), true) // idem
})
