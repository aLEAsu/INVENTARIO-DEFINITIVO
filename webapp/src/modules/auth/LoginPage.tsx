import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../../core/auth/SessionContext'

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
      <form onSubmit={handleSubmit} className="card auth-card">
        <div className="auth-brand">
          <svg className="app-brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0b3b60" />
            <rect x="7" y="16" width="4.2" height="9" rx="1.2" fill="#0f8b8d" />
            <rect x="13.4" y="10" width="4.2" height="15" rx="1.2" fill="#0f8b8d" />
            <rect x="19.8" y="13.5" width="4.2" height="11.5" rx="1.2" fill="#5fd3c4" />
            <circle cx="24.5" cy="7.5" r="2.6" fill="#3ecf7a" />
          </svg>
          <div>
            <strong>UNOP TI Hub</strong>
            <span>Inicia sesion con tu cuenta de la organizacion.</span>
          </div>
        </div>
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
          <label htmlFor="password">Contrasena</label>
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
  )
}
