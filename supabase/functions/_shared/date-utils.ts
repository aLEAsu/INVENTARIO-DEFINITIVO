// Logica pura de fechas para el calculo de cumpleanos. Separada de
// send-birthday-notifications/index.ts para poder probarla con
// `deno test` sin necesitar un entorno de Edge Function completo.

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function localDateInTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') === 24 ? 0 : get('hour') }
}

export function addDays(year: number, month: number, day: number, delta: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() + delta)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

export function isoDate(y: number, m: number, d: number): string {
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
}

/** Determina si el cumpleanos (birthMonth/birthDay) cae en `target` (y/m/d), aplicando la politica de 29 de febrero. */
export function birthdayMatchesTarget(
  birthMonth: number,
  birthDay: number,
  target: { year: number; month: number; day: number },
  feb29Policy: 'feb_28' | 'mar_1',
): boolean {
  if (birthMonth === target.month && birthDay === target.day) return true
  if (birthMonth === 2 && birthDay === 29 && !isLeapYear(target.year)) {
    if (feb29Policy === 'feb_28' && target.month === 2 && target.day === 28) return true
    if (feb29Policy === 'mar_1' && target.month === 3 && target.day === 1) return true
  }
  return false
}
