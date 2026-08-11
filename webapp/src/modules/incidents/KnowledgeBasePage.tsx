import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { createKbArticle, listKbArticles, type KbArticle } from '../../data/repositories/kbRepo'

export function KnowledgeBasePage() {
  const { membership, user } = useSession()
  const canWrite = can(membership?.role, 'incidents', 'admin') || membership?.role === 'tecnico_ti'
  const [articles, setArticles] = useState<KbArticle[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [selected, setSelected] = useState<KbArticle | null>(null)

  async function refresh() {
    if (!membership) return
    setArticles(await listKbArticles(membership.organizationId))
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!membership || !title.trim() || !content.trim()) return
    await createKbArticle(membership.organizationId, { title, category: category || null, content, related_incident_id: null }, user?.id ?? null)
    setTitle('')
    setCategory('')
    setContent('')
    setCreating(false)
    await refresh()
  }

  return (
    <div>
      <div className="app-topbar">
        <h2 style={{ margin: 0 }}>Base de conocimiento</h2>
        {canWrite && <button className="btn" onClick={() => setCreating(true)}>Nuevo artículo</button>}
      </div>

      <div className="stat-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Artículos</h3>
          {articles.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Todavía no hay artículos.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {articles.map((a) => (
                <li key={a.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}>
                  <button className="btn secondary" onClick={() => setSelected(a)} style={{ width: '100%', textAlign: 'left' }}>
                    {a.title} {a.category && <span style={{ color: 'var(--muted)' }}>({a.category})</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{selected.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{selected.content}</p>
          </div>
        )}
      </div>

      {creating && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={handleCreate}>
            <h2 style={{ marginTop: 0 }}>Nuevo artículo</h2>
            <div className="field">
              <label htmlFor="kbTitle">Título</label>
              <input id="kbTitle" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="kbCategory">Categoría</label>
              <input id="kbCategory" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="kbContent">Contenido</label>
              <textarea id="kbContent" rows={6} required value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setCreating(false)}>Cancelar</button>
              <button type="submit" className="btn">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
