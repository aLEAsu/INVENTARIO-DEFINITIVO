import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import writeXlsxFile from 'write-excel-file/browser'
import { useSession } from '../../core/auth/SessionContext'
import { supabase } from '../../core/supabaseClient'
import { listIncidents, type Incident } from '../../data/repositories/incidentsRepo'
import { listAssets } from '../../data/repositories/assetsRepo'
import { listIncidentCategories, type IncidentCategory } from '../../data/repositories/servicesRepo'
import type { AssetRecord } from '../../data/db'

type GroupKey = 'category' | 'priority' | 'status' | 'asset'

const GROUP_LABELS: Record<GroupKey, string> = { category: 'Categoría', priority: 'Prioridad', status: 'Estado', asset: 'Activo' }

function avgHours(pairs: { from: string; to: string }[]): number | null {
  if (pairs.length === 0) return null
  const totalMs = pairs.reduce((sum, p) => sum + (new Date(p.to).getTime() - new Date(p.from).getTime()), 0)
  return Math.round((totalMs / pairs.length / 3600000) * 10) / 10
}

export function IncidentReportsPage() {
  const { membership } = useSession()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [categories, setCategories] = useState<IncidentCategory[]>([])
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [firstResponseByIncident, setFirstResponseByIncident] = useState<Record<string, string>>({})
  const [group, setGroup] = useState<GroupKey>('category')

  useEffect(() => {
    if (!membership) return
    const orgId = membership.organizationId
    void Promise.all([listIncidents(orgId), listIncidentCategories(orgId), listAssets(orgId)]).then(([inc, cats, ast]) => {
      setIncidents(inc)
      setCategories(cats)
      setAssets(ast)
    })
    void supabase
      .from('incident_updates')
      .select('incident_id, created_at')
      .eq('organization_id', orgId)
      .not('status_to', 'is', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const map: Record<string, string> = {}
        for (const row of data ?? []) if (!map[row.incident_id]) map[row.incident_id] = row.created_at
        setFirstResponseByIncident(map)
      })
  }, [membership?.organizationId])

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Sin categoría'
  const assetLabel = (id: string | null) => (id ? assets.find((a) => a.id === id)?.code ?? id : 'Sin activo')

  const groupKeyFor = (i: Incident): string => {
    if (group === 'category') return categoryName(i.category_id)
    if (group === 'priority') return i.priority
    if (group === 'status') return i.status
    return assetLabel(i.asset_id)
  }

  const rows = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of incidents) map.set(groupKeyFor(i), (map.get(groupKeyFor(i)) ?? 0) + 1)
    return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, group, categories, assets])

  const avgAttentionHours = useMemo(
    () => avgHours(incidents.filter((i) => firstResponseByIncident[i.id]).map((i) => ({ from: i.created_at, to: firstResponseByIncident[i.id] }))),
    [incidents, firstResponseByIncident],
  )
  const avgResolutionHours = useMemo(
    () => avgHours(incidents.filter((i) => i.resolved_at).map((i) => ({ from: i.created_at, to: i.resolved_at! }))),
    [incidents],
  )
  const recurringAssets = useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of incidents) if (i.asset_id) counts.set(i.asset_id, (counts.get(i.asset_id) ?? 0) + 1)
    return Array.from(counts.entries()).filter(([, c]) => c > 1).map(([assetId, c]) => ({ label: assetLabel(assetId), count: c }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, assets])

  function exportPdf() {
    const doc = new jsPDF()
    doc.text(`Reporte de incidentes por ${GROUP_LABELS[group].toLowerCase()}`, 14, 14)
    autoTable(doc, { startY: 20, head: [[GROUP_LABELS[group], 'Cantidad']], body: rows.map((r) => [r.label, String(r.count)]) })
    doc.save(`incidentes-${group}-${Date.now()}.pdf`)
  }

  async function exportXlsx() {
    await writeXlsxFile(rows, {
      columns: [
        { header: GROUP_LABELS[group], cell: (r: { label: string }) => r.label },
        { header: 'Cantidad', cell: (r: { count: number }) => r.count },
      ],
    }).toFile(`incidentes-${group}-${Date.now()}.xlsx`)
  }

  return (
    <div>
      <span className="eyebrow">Incidentes</span>
      <h2>Reportes de incidentes</h2>

      <div className="stat-grid" style={{ marginTop: '1.1rem' }}>
        <div className="card stat-card"><div><strong>{incidents.length}</strong><span>Novedades totales</span></div></div>
        <div className="card stat-card"><div><strong>{avgAttentionHours ?? '—'}</strong><span>Horas promedio de atención</span></div></div>
        <div className="card stat-card"><div><strong>{avgResolutionHours ?? '—'}</strong><span>Horas promedio de resolución</span></div></div>
        <div className="card stat-card"><div><strong>{recurringAssets.length}</strong><span>Activos con reincidencia</span></div></div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="cluster-between" style={{ marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="groupBy">Agrupar por</label>
            <select id="groupBy" value={group} onChange={(e) => setGroup(e.target.value as GroupKey)}>
              {Object.entries(GROUP_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="cluster">
            <button className="btn secondary" onClick={exportPdf}>Exportar PDF</button>
            <button className="btn secondary" onClick={() => void exportXlsx()}>Exportar Excel</button>
          </div>
        </div>
        <table>
          <thead><tr><th>{GROUP_LABELS[group]}</th><th>Cantidad</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.label}><td>{r.label}</td><td>{r.count}</td></tr>)}</tbody>
        </table>
      </div>

      {recurringAssets.length > 0 && (
        <div className="card">
          <h3>Activos con reincidencia (más de 1 novedad)</h3>
          <table>
            <thead><tr><th>Activo</th><th>Novedades</th></tr></thead>
            <tbody>{recurringAssets.map((r) => <tr key={r.label}><td>{r.label}</td><td>{r.count}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
