'use client'

import { useState, useEffect, useCallback } from 'react'
import { SolicitudEdicion, TipoMuestra, TipoEstudio } from '@/types'
import clsx from 'clsx'

interface Props {
  tiposMuestra: TipoMuestra[]
  tiposEstudio: TipoEstudio[]
}

export default function SolicitudesEdicionPanel({ tiposMuestra, tiposEstudio }: Props) {
  const [solicitudes, setSolicitudes] = useState<SolicitudEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandida, setExpandida] = useState<number | null>(null)
  const [procesando, setProcesando] = useState<number | null>(null)
  const [nota, setNota] = useState('')
  const [filtro, setFiltro] = useState<'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'TODAS'>('PENDIENTE')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/solicitudes-edicion')
      const data = await res.json()
      if (data.ok) setSolicitudes(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSolicitudes() }, [fetchSolicitudes])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const resolver = async (solicitud_id: number, accion: 'aprobar' | 'rechazar') => {
    setProcesando(solicitud_id)
    try {
      const res = await fetch('/api/solicitudes-edicion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitud_id, accion, admin_nota: nota }),
      })
      const data = await res.json()
      if (data.ok) {
        showToast(accion === 'aprobar' ? 'Edición aprobada y aplicada.' : 'Solicitud rechazada.', true)
        setExpandida(null)
        setNota('')
        await fetchSolicitudes()
      } else {
        showToast(data.error || 'Error al procesar.', false)
      }
    } catch {
      showToast('Error de conexión.', false)
    } finally {
      setProcesando(null)
    }
  }

  const getTipoNombre = (id: number | null) => tiposMuestra.find((t) => t.id === id)?.nombre ?? '—'
  const getEstudiosNombres = (ids: number[]) =>
    tiposEstudio.filter((t) => ids.includes(t.id)).map((t) => t.nombre).join(', ') || 'Ninguno'

  const filtradas = solicitudes.filter((s) => filtro === 'TODAS' || s.estado === filtro)
  const pendientesCount = solicitudes.filter((s) => s.estado === 'PENDIENTE').length

  const estadoBadge = (estado: string) => {
    if (estado === 'PENDIENTE') return <span className="badge-warning">Pendiente</span>
    if (estado === 'APROBADA') return <span className="badge-success">Aprobada</span>
    return <span className="badge-danger">Rechazada</span>
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fadeIn',
          toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.ok
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-slate-900">Solicitudes de edición post-QR</h2>
          {pendientesCount > 0 && (
            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Filtro */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
          {(['PENDIENTE', 'APROBADA', 'RECHAZADA', 'TODAS'] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={clsx('px-3 py-1.5 font-medium transition-colors border-l border-slate-200 first:border-l-0',
                filtro === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
              {f === 'TODAS' ? 'Todas' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-400">Cargando solicitudes...</div>
      ) : filtradas.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-slate-500">
            {filtro === 'PENDIENTE' ? 'No hay solicitudes pendientes.' : `Sin solicitudes con estado "${filtro}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((sol) => {
            const datos = sol.datos_nuevos
            const isOpen = expandida === sol.id
            return (
              <div key={sol.id} className={clsx('card overflow-hidden transition-all',
                sol.estado === 'PENDIENTE' ? 'border-amber-200' : '')}>
                {/* Row header */}
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold',
                      sol.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                      sol.estado === 'APROBADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                      {sol.estado === 'PENDIENTE' ? '?' : sol.estado === 'APROBADA' ? '✓' : '✕'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">{sol.nombre_muestra}</p>
                        {estadoBadge(sol.estado)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Solicitado por <strong>{sol.solicitante_nombre}</strong> · {new Date(sol.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 italic truncate">Motivo: {sol.motivo}</p>
                    </div>
                  </div>
                  <button onClick={() => setExpandida(isOpen ? null : sol.id)}
                    className="text-xs text-brand-600 font-medium hover:underline shrink-0">
                    {isOpen ? 'Cerrar' : 'Ver detalle'}
                  </button>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50 animate-fadeIn">
                    {/* Changes preview */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Datos propuestos</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Nombre muestra', value: datos.nombre_muestra },
                          { label: 'Tipo de muestra', value: getTipoNombre(datos.tipo_muestra_id) },
                          { label: 'Pertenece a', value: datos.pertenece_a },
                          { label: 'Recolectado por', value: datos.persona_recolecto },
                          { label: 'Fecha recolección', value: datos.fecha_recoleccion },
                          { label: 'Código IDIF', value: datos.codigo_idif_manual || '—' },
                          { label: 'Estudio pericial', value: datos.estudio_pericial_solicitado ? 'Sí' : 'No' },
                          { label: 'Tipos de estudio', value: datos.tipos_estudio_ids?.length ? getEstudiosNombres(datos.tipos_estudio_ids) : '—' },
                          { label: 'Detalle', value: datos.detalle || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white rounded-lg border border-slate-200 px-3 py-2.5">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
                            <p className="text-sm text-slate-800 font-medium mt-0.5 break-words">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin resolution */}
                    {sol.estado === 'PENDIENTE' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nota del administrador (opcional)</label>
                          <textarea
                            className="input-base text-sm resize-none"
                            rows={2}
                            placeholder="Motivo de aprobación o rechazo..."
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolver(sol.id, 'aprobar')}
                            disabled={procesando === sol.id}
                            className="btn-primary flex-1 justify-center text-sm"
                          >
                            {procesando === sol.id ? 'Procesando...' : '✓ Aprobar y aplicar cambios'}
                          </button>
                          <button
                            onClick={() => resolver(sol.id, 'rechazar')}
                            disabled={procesando === sol.id}
                            className="btn-danger flex-1 justify-center text-sm"
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Resolved info */}
                    {sol.estado !== 'PENDIENTE' && (
                      <div className={clsx('rounded-lg px-4 py-3 text-sm',
                        sol.estado === 'APROBADA' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800')}>
                        <p className="font-medium">
                          {sol.estado === 'APROBADA' ? '✓ Aprobada' : '✕ Rechazada'} el{' '}
                          {sol.resuelto_at ? new Date(sol.resuelto_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                        {sol.admin_nota && <p className="mt-1 text-xs opacity-80">Nota: {sol.admin_nota}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
