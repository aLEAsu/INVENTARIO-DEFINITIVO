/** Marca de UNOP TI Hub: una mira de escaneo con el punto fijado en el
 * centro — la misma mecanica que usa el conteo fisico por QR para leer
 * cada activo real. */
export function BrandMark() {
  return (
    <svg className="app-brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="3" fill="var(--surface-2, #161f1b)" stroke="var(--line, #1e2b27)" />
      <path d="M8 6H6a2 2 0 0 0-2 2v2" stroke="var(--primary, #5ee6b0)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M24 6h2a2 2 0 0 1 2 2v2" stroke="var(--primary, #5ee6b0)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M8 26H6a2 2 0 0 1-2-2v-2" stroke="var(--primary, #5ee6b0)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M24 26h2a2 2 0 0 0 2-2v-2" stroke="var(--primary, #5ee6b0)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.4" fill="var(--primary, #5ee6b0)" />
    </svg>
  )
}
