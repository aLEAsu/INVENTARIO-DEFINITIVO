import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import writeXlsxFile from 'write-excel-file/browser'
import { useSession } from '../../core/auth/SessionContext'
import type { AssetRecord } from '../../data/db'
import { listAssets } from '../../data/repositories/assetsRepo'

type GroupKey = 'area' | 'responsible' | 'condition' | 'status'

const GROUP_LABELS: Record<GroupKey, string> = {
  area: 'Área',
  responsible: 'Responsable',
  condition: 'Condición física',
  status: 'Estado',
}

function groupBy(assets: AssetRecord[], key: GroupKey): { label: string; count: number }[] {
  const map = new Map<string, number>()
  for (const a of assets) {
    const value = (a[key] as string | undefined) || 'Sin definir'
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

export function ReportsPage() {
  const { membership } = useSession()
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [group, setGroup] = useState<GroupKey>('area')

  useEffect(() => {
    if (!membership) return
    void listAssets(membership.organizationId).then(setAssets)
  }, [membership?.organizationId])

  const today = new Date().toISOString().slice(0, 10)
  const withExpiredWarranty = assets.filter((a) => a.warrantyUntil && a.warrantyUntil < today)
  const rows = useMemo(() => groupBy(assets, group), [assets, group])

  function exportPdf() {
    const doc = new jsPDF()
    doc.text(`Reporte de activos por ${GROUP_LABELS[group].toLowerCase()}`, 14, 14)
    autoTable(doc, {
      startY: 20,
      head: [[GROUP_LABELS[group], 'Cantidad']],
      body: rows.map((r) => [r.label, String(r.count)]),
    })
    doc.save(`reporte-${group}-${Date.now()}.pdf`)
  }

  async function exportXlsx() {
    await writeXlsxFile(rows, {
      columns: [
        { header: GROUP_LABELS[group], cell: (r: { label: string }) => r.label },
        { header: 'Cantidad', cell: (r: { count: number }) => r.count },
      ],
    }).toFile(`reporte-${group}-${Date.now()}.xlsx`)
  }

  return (
    <div>
      <span className="eyebrow">Inventario</span>
      <h2>Reportes</h2>

      <div className="stat-grid" style={{ marginTop: '1.1rem' }}>
        <div className="card stat-card"><div><strong>{assets.length}</strong><span>Activos totales</span></div></div>
        <div className="card stat-card"><div><strong>{withExpiredWarranty.length}</strong><span>Garantía vencida</span></div></div>
      </div>

      <div className="card">
        <div className="cluster-between" style={{ marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="groupBy">Agrupar por</label>
            <select id="groupBy" value={group} onChange={(e) => setGroup(e.target.value as GroupKey)}>
              {Object.entries(GROUP_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="cluster">
            <button className="btn secondary" onClick={exportPdf}>Exportar PDF</button>
            <button className="btn secondary" onClick={() => void exportXlsx()}>Exportar Excel</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>{GROUP_LABELS[group]}</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
