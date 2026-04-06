'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import * as XLSX from 'xlsx'

interface FilaReporte {
  'ID Muestra': string
  'Nombre Muestra': string
  'Tipo de Muestra': string
  'Pertenece A': string
  'Recolectado por': string
  'Fecha Recolección': string
  'ID Recepción': string
  'Funcionario Entrega': string
  'Fecha ROMA': string
  'Fecha ERCE': string
  'Estudio Solicitado': boolean
  'Código IDIF': string | null
  'Detalle': string
  'Registrado por': string
  'Fecha Registro': string
}

export default function ReportesPage() {
  const user = useAuthStore((s) => s.user)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('todos')
  const [usuarios, setUsuarios] = useState<{ id: number; nombre: string }[]>([])
  const [datos, setDatos] = useState<FilaReporte[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      fetch('/api/usuarios')
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setUsuarios(d.data.filter((u: any) => u.estado === 'ACTIVO'))
        })
    }
  }, [user])

  const buscar = async () => {
    setLoading(true)
    setBuscado(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      if (usuarioFiltro !== 'todos') params.set('usuario_id', usuarioFiltro)

      const res = await fetch(`/api/reportes?${params}`)
      const data = await res.json()
      if (data.ok) setDatos(data.data)
    } finally {
      setLoading(false)
    }
  }

  // BDD Feature 5: Exportar con tipos forzados
  const exportarExcel = () => {
    if (datos.length === 0) return

    const wb = XLSX.utils.book_new()

    // Transformar datos forzando tipos correctos
    const filas = datos.map((row) => {
      return {
        'ID Muestra': { v: String(row['ID Muestra']), t: 's' },           // String forzado
        'Nombre Muestra': { v: row['Nombre Muestra'], t: 's' },
        'Tipo de Muestra': { v: row['Tipo de Muestra'] ?? '', t: 's' },
        'Pertenece A': { v: row['Pertenece A'], t: 's' },
        'Recolectado por': { v: row['Recolectado por'], t: 's' },
        'Fecha Recolección': { v: new Date(row['Fecha Recolección']), t: 'd' }, // Date nativo
        'ID Recepción': { v: String(row['ID Recepción']), t: 's' },        // String forzado
        'Funcionario Entrega': { v: row['Funcionario Entrega'], t: 's' },
        'Fecha ROMA': { v: new Date(row['Fecha ROMA']), t: 'd' },
        'Fecha ERCE': { v: new Date(row['Fecha ERCE']), t: 'd' },
        'Estudio Solicitado': { v: row['Estudio Solicitado'] ? 'SÍ' : 'NO', t: 's' },
        'Código IDIF': { v: row['Código IDIF'] ? String(row['Código IDIF']) : '', t: 's' }, // String forzado - preserva ceros
        'Detalle': { v: row['Detalle'] ?? '', t: 's' },
        'Registrado por': { v: row['Registrado por'] ?? '', t: 's' },
        'Fecha Registro': { v: new Date(row['Fecha Registro']), t: 'd' },
      }
    })

    const headers = Object.keys(filas[0])
    const ws: XLSX.WorkSheet = {}

    // Cabeceras
    headers.forEach((h, i) => {
      ws[XLSX.utils.encode_cell({ r: 0, c: i })] = { v: h, t: 's', s: { font: { bold: true } } }
    })

    // Datos
    filas.forEach((row, r) => {
      Object.values(row).forEach((cell, c) => {
        ws[XLSX.utils.encode_cell({ r: r + 1, c })] = cell
      })
    })

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length, c: headers.length - 1 } })

    // Anchos de columna
    ws['!cols'] = headers.map((h) => ({
      wch: Math.max(h.length, 16),
    }))

    XLSX.utils.book_append_sheet(wb, ws, 'Muestras ERCE')

    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `ERCE_Reporte_${fecha}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Consulta y exportación de registros periciales</p>
        </div>
        {datos.length > 0 && (
          <button onClick={exportarExcel} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Excel ({datos.length})
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Filtros de búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
            <input
              type="date"
              className="input-base text-sm"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
            <input
              type="date"
              className="input-base text-sm"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          {user?.rol === 'ADMIN' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Usuario</label>
              <select
                className="input-base text-sm"
                value={usuarioFiltro}
                onChange={(e) => setUsuarioFiltro(e.target.value)}
              >
                <option value="todos">Todos los usuarios</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={buscar}
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Buscando...' : 'Buscar registros'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Resultados
              <span className="ml-2 text-slate-400 font-normal">({datos.length} registros)</span>
            </h2>
            {datos.length > 0 && (
              <p className="text-xs text-slate-400">
                IDs y Códigos IDIF exportados como texto para preservar ceros a la izquierda
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              Cargando resultados...
            </div>
          ) : datos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-slate-500">Sin registros para los filtros seleccionados.</p>
              <p className="text-xs text-slate-400 mt-1">Ajusta el rango de fechas e intenta nuevamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['ID Muestra', 'Nombre', 'Tipo', 'Pertenece A', 'Fecha ERCE', 'Estudio', 'Cód. IDIF', 'Registrado por'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.map((row) => (
                    <tr key={row['ID Muestra']} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-brand-600 whitespace-nowrap">{row['ID Muestra']}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row['Nombre Muestra']}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row['Tipo de Muestra'] ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row['Pertenece A']}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(row['Fecha ERCE']).toLocaleDateString('es-BO')}
                      </td>
                      <td className="px-4 py-3">
                        {row['Estudio Solicitado']
                          ? <span className="badge-warning">SÍ</span>
                          : <span className="badge-gray">NO</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{row['Código IDIF'] ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row['Registrado por'] ?? '—'}</td>
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
