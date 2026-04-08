'use client'

import { useState, useEffect } from 'react'
import { Usuario, TipoMuestra, TipoEstudio } from '@/types'
import { useAuthStore } from '@/lib/store'
import clsx from 'clsx'
import SolicitudesEdicionPanel from '@/components/ui/SolicitudesEdicionPanel'

type Vista = 'pendientes' | 'todos'
type Tab = 'usuarios' | 'ediciones'

export default function AprobacionPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('usuarios')
  const [tiposMuestra, setTiposMuestra] = useState<TipoMuestra[]>([])
  const [tiposEstudio, setTiposEstudio] = useState<TipoEstudio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState<number | null>(null)
  const [vista, setVista] = useState<Vista>('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [confirmacion, setConfirmacion] = useState<{ id: number; nombre: string; tipo: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/parametros').then(r => r.json()).then(d => {
      if (d.ok) { setTiposMuestra(d.data.tiposMuestra); setTiposEstudio(d.data.tiposEstudio) }
    })
  }, [])

  if (user?.rol !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-slate-500 text-sm">Acceso restringido a administradores.</p>
      </div>
    )
  }

  const fetchUsuarios = async () => {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    const data = await res.json()
    if (data.ok) setUsuarios(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const ejecutarAccion = async (id: number, tipo: string) => {
    setAccionando(id)
    setConfirmacion(null)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: tipo }),
      })
      const data = await res.json()
      if (data.ok) { showToast(data.mensaje, true); await fetchUsuarios() }
      else showToast(data.error || 'Error al ejecutar acción.', false)
    } catch { showToast('Error de conexión.', false) }
    finally { setAccionando(null) }
  }

  const pendientes = usuarios.filter((u) => u.estado === 'PENDIENTE')
  const filtrados = usuarios.filter((u) => {
    const matchVista = vista === 'pendientes' ? u.estado === 'PENDIENTE' : true
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.ci.includes(q) || u.ciudad.toLowerCase().includes(q)
    return matchVista && matchBusqueda
  })

  const estadoBadge = (estado: string) => {
    if (estado === 'ACTIVO') return <span className="badge-success">Activo</span>
    if (estado === 'PENDIENTE') return <span className="badge-warning">Pendiente</span>
    return <span className="badge-danger">Bloqueado</span>
  }
  const rolBadge = (rol: string) => rol === 'ADMIN'
    ? <span className="badge bg-purple-100 text-purple-700">ADMIN</span>
    : <span className="badge-info">ERCE</span>

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={clsx('fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fadeIn',
          toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white')}>
          {toast.ok
            ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          {toast.msg}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 animate-fadeIn">
            <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
              confirmacion.tipo === 'aprobar' ? 'bg-green-100' : confirmacion.tipo === 'bloquear' ? 'bg-red-100' : 'bg-purple-100')}>
              {confirmacion.tipo === 'aprobar' && <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              {confirmacion.tipo === 'bloquear' && <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
              {(confirmacion.tipo === 'activar' || confirmacion.tipo === 'hacer_admin') && <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 text-center mb-1">
              {confirmacion.tipo === 'aprobar' && 'Aprobar usuario'}
              {confirmacion.tipo === 'bloquear' && 'Bloquear usuario'}
              {confirmacion.tipo === 'activar' && 'Reactivar usuario'}
              {confirmacion.tipo === 'hacer_admin' && 'Promover a Admin'}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              {confirmacion.tipo === 'aprobar' && <>¿Confirmas la aprobación de <strong>{confirmacion.nombre}</strong>? Recibirá acceso con rol ERCE.</>}
              {confirmacion.tipo === 'bloquear' && <>¿Bloquear a <strong>{confirmacion.nombre}</strong>? No podrá iniciar sesión.</>}
              {confirmacion.tipo === 'activar' && <>¿Reactivar a <strong>{confirmacion.nombre}</strong>?</>}
              {confirmacion.tipo === 'hacer_admin' && <>¿Promover a <strong>{confirmacion.nombre}</strong> como administrador?</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmacion(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={() => ejecutarAccion(confirmacion.id, confirmacion.tipo)} disabled={accionando === confirmacion.id}
                className={clsx('flex-1 justify-center', confirmacion.tipo === 'bloquear' ? 'btn-danger' : 'btn-primary')}>
                {accionando === confirmacion.id ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Aprobación y autorizaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de accesos y solicitudes de edición</p>
        </div>
        {pendientes.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pendientes.length} solicitud{pendientes.length !== 1 ? 'es' : ''} de acceso pendiente{pendientes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {([
          { key: 'usuarios', label: 'Solicitudes de acceso', icon: '👤' },
          { key: 'ediciones', label: 'Solicitudes de edición', icon: '✏️' },
        ] as const).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700')}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* ── TAB: Usuarios ── */}
      {tab === 'usuarios' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pendientes', count: usuarios.filter(u => u.estado === 'PENDIENTE').length, color: 'amber', icon: '⏳' },
              { label: 'Activos', count: usuarios.filter(u => u.estado === 'ACTIVO').length, color: 'green', icon: '✓' },
              { label: 'Bloqueados', count: usuarios.filter(u => u.estado === 'BLOQUEADO').length, color: 'red', icon: '✕' },
            ].map(({ label, count, color, icon }) => (
              <div key={label} className={clsx('card p-4 flex items-center gap-4', color === 'amber' && count > 0 ? 'border-amber-200 bg-amber-50' : '')}>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0',
                  color === 'amber' ? 'bg-amber-100' : color === 'green' ? 'bg-green-100' : 'bg-red-100')}>{icon}</div>
                <div>
                  <p className="text-2xl font-display font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setVista('pendientes')}
                className={clsx('px-4 py-2 text-sm font-medium transition-colors', vista === 'pendientes' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                Solo pendientes
              </button>
              <button onClick={() => setVista('todos')}
                className={clsx('px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200', vista === 'todos' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                Todos
              </button>
            </div>
            <input className="input-base text-sm flex-1 max-w-sm" placeholder="Buscar por nombre, email, CI o ciudad..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <span className="text-xs text-slate-400 ml-auto">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</span>
          </div>

          {/* User list */}
          {loading ? (
            <div className="card p-12 text-center text-sm text-slate-400">Cargando usuarios...</div>
          ) : filtrados.length === 0 ? (
            <div className="card p-12 flex flex-col items-center gap-3 text-center">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-slate-500">{vista === 'pendientes' ? 'No hay solicitudes pendientes.' : 'No se encontraron usuarios.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrados.map((u) => (
                <div key={u.id} className={clsx('card p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all',
                  u.estado === 'PENDIENTE' ? 'border-amber-200 bg-amber-50/40' : '')}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-lg shrink-0',
                      u.estado === 'PENDIENTE' ? 'bg-amber-200 text-amber-800' : u.estado === 'ACTIVO' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500')}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
                        {estadoBadge(u.estado)}{rolBadge(u.rol)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 font-mono">CI: {u.ci}</span>
                        <span className="text-xs text-slate-400">📍 {u.ciudad || '—'}</span>
                        <span className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  {u.id !== user?.id && (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {u.estado === 'PENDIENTE' && (
                        <>
                          <button onClick={() => setConfirmacion({ id: u.id, nombre: u.nombre, tipo: 'aprobar' })} disabled={accionando === u.id} className="btn-primary text-xs py-1.5 px-3">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Aprobar
                          </button>
                          <button onClick={() => setConfirmacion({ id: u.id, nombre: u.nombre, tipo: 'bloquear' })} disabled={accionando === u.id} className="btn-danger text-xs py-1.5 px-3">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Rechazar
                          </button>
                        </>
                      )}
                      {u.estado === 'ACTIVO' && (
                        <>
                          <button onClick={() => setConfirmacion({ id: u.id, nombre: u.nombre, tipo: 'bloquear' })} disabled={accionando === u.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium">Bloquear</button>
                          {u.rol !== 'ADMIN' && (
                            <button onClick={() => setConfirmacion({ id: u.id, nombre: u.nombre, tipo: 'hacer_admin' })} disabled={accionando === u.id}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-medium">→ Admin</button>
                          )}
                        </>
                      )}
                      {u.estado === 'BLOQUEADO' && (
                        <button onClick={() => setConfirmacion({ id: u.id, nombre: u.nombre, tipo: 'activar' })} disabled={accionando === u.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium">Reactivar</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Ediciones ── */}
      {tab === 'ediciones' && (
        <SolicitudesEdicionPanel tiposMuestra={tiposMuestra} tiposEstudio={tiposEstudio} />
      )}
    </div>
  )
}
