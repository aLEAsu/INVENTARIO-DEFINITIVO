import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../../core/auth/SessionContext'
import { BrandMark } from '../../ui/BrandMark'

export function LoginPage() {
  const { session, signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual">
          <div className="auth-visual-brand">
            <BrandMark />
            <div>
              <strong>UNOP TI Hub</strong>
              <span>Inventario y operación técnica</span>
            </div>
          </div>
          <div>
            <h1>Un trabajo nuevo, el mismo sistema.</h1>
            <p>
              Cada sitio tiene su propio inventario, su equipo y sus incidentes —
              arrancas uno nuevo en minutos a partir de un blueprint de oficio.
            </p>
          </div>
          <div className="auth-tag-strip" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-panel">
          <h2>Inicia sesión</h2>
          <p className="text-muted text-small">Entra con tu cuenta para ver tus trabajos.</p>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-danger text-small">{error}</p>}
          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
