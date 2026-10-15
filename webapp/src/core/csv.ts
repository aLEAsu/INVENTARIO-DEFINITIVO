// Fila que empiece con = + - @ (o tabulador/retorno de carro) puede ser
// interpretada como formula por Excel/Sheets al importar un CSV (CSV
// injection / formula injection) -- cualquier campo de texto libre que
// vino de un usuario (nombre de trabajador, de activo, etc.) puede
// contenerlo. Se antepone un apostrofe para forzarla a texto plano, tal
// como recomienda OWASP.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

function sanitizeCell(value: unknown): string {
  const text = String(value ?? '')
  return FORMULA_PREFIX.test(text) ? `'${text}` : text
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map((cell) => `"${sanitizeCell(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function csvBlob(rows: unknown[][]): Blob {
  return new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
