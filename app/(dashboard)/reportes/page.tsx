'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import * as XLSX from 'xlsx'
import clsx from 'clsx'

const TIPOS_REPORTE = [
  { key: 'muestras',        label: 'Listado de muestras',          icono: '🧪' },
  { key: 'por_tipo_muestra',label: 'Por tipo de muestra',          icono: '📊' },
  { key: 'por_tipo_pericia', label: 'Por tipo de pericia',         icono: '🔬' },
  { key: 'casos_abiertos',  label: 'Casos abiertos',               icono: '📂' },
  { key: 'sin_pericia',     label: 'Sin requerimiento pericial',    icono: '📋' },
  { key: 'por_entrega',     label: 'Por funcionario de entrega',    icono: '👤' },
  { key: 'por_ciudad',      label: 'Por ciudad',                   icono: '🏙️' },
]

export default function ReportesPage() {
  const user = useAuthStore((s) => s.user)
  const [tipoReporte, setTipoReporte] = useState('muestras')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('todos')
  const [usuarios, setUsuarios] = useState<{ id: number; nombre: string }[]>([])
  const [datos, setDatos] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      fetch('/api/usuarios').then((r) => r.json()).then((d) => {
        if (d.ok) setUsuarios(d.data.filter((u: any) => u.estado === 'ACTIVO'))
      })
    }
  }, [user])

  const buscar = async () => {
    setLoading(true); setBuscado(true)
    try {
      const params = new URLSearchParams({ tipo: tipoReporte })
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      if (usuarioFiltro !== 'todos') params.set('usuario_id', usuarioFiltro)
      const res = await fetch(`/api/reportes?${params}`)
      const data = await res.json()
      if (data.ok) setDatos(data.data)
    } finally { setLoading(false) }
  }

  const exportarExcel = () => {
    if (datos.length === 0) return
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([])
    const headers = Object.keys(datos[0])
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' })

    const STRING_COLS = ['ID Muestra', 'ID Recepción', 'Código IDIF']
    const DATE_COLS = ['Fecha Recolección', 'Fecha ROMA', 'Fecha ERCE', 'Fecha Registro']

    datos.forEach((row, r) => {
      headers.forEach((h, c) => {
        const raw = row[h]
        let cell: XLSX.CellObject
        if (STRING_COLS.includes(h)) {
          cell = { v: raw != null ? String(raw) : '', t: 's' }
        } else if (DATE_COLS.includes(h) && raw) {
          cell = { v: new Date(raw as string), t: 'd' }
        } else if (typeof raw === 'number') {
          cell = { v: raw, t: 'n' }
        } else {
          cell = { v: raw != null ? String(raw) : '', t: 's' }
        }
        ws[XLSX.utils.encode_cell({ r: r + 1, c })] = cell
      })
    })
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: datos.length, c: headers.length - 1 } })
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }))

    const labelReporte = TIPOS_REPORTE.find((t) => t.key === tipoReporte)?.label ?? tipoReporte
    XLSX.utils.book_append_sheet(wb, ws, labelReporte.slice(0, 31))
    XLSX.writeFile(wb, `ERCE_${tipoReporte}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const headers = datos.length > 0 ? Object.keys(datos[0]) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Consulta y exportación de registros periciales</p>
        </div>
        {datos.length > 0 && (
          <button onClick={exportarExcel} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar Excel ({datos.length})
          </button>
        )}
      </div>

      {/* Selector de tipo de reporte */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Tipo de reporte</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {TIPOS_REPORTE.map((t) => (
            <button key={t.key} onClick={() => { setTipoReporte(t.key); setDatos([]); setBuscado(false) }}
              className={clsx('flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all text-xs font-medium',
                tipoReporte === t.key ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
              <span className="text-lg">{t.icono}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Filtros</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
            <input type="date" className="input-base text-sm" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
            <input type="date" className="input-base text-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          {user?.rol === 'ADMIN' && tipoReporte === 'muestras' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Usuario</label>
              <select className="input-base text-sm" value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)}>
                <option value="todos">Todos los usuarios</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button onClick={buscar} disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Buscando...' : 'Generar reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {TIPOS_REPORTE.find((t) => t.key === tipoReporte)?.label}
              <span className="ml-2 text-slate-400 font-normal">({datos.length} registros)</span>
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">Generando reporte...</div>
          ) : datos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-slate-500">Sin registros para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {headers.map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      {headers.map((h) => (
                        <td key={h} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {typeof row[h] === 'boolean'
                            ? <span className={row[h] ? 'badge-warning' : 'badge-gray'}>{row[h] ? 'SÍ' : 'NO'}</span>
                            : row[h] instanceof Date || (typeof row[h] === 'string' && row[h] && !isNaN(Date.parse(row[h] as string)) && (h.toLowerCase().includes('fecha')))
                            ? new Date(row[h] as string).toLocaleDateString('es-BO')
                            : String(row[h] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
