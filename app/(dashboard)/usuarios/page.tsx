'use client'

import { useState, useEffect } from 'react'
import { Usuario } from '@/types'
import { useAuthStore } from '@/lib/store'
import clsx from 'clsx'

export default function UsuariosPage() {
  const user = useAuthStore((s) => s.user)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState<number | null>(null)

  if (user?.rol !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Acceso restringido a administradores.</p>
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

  const accion = async (id: number, tipo: string) => {
    setAccionando(id)
    await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accion: tipo }),
    })
    await fetchUsuarios()
    setAccionando(null)
  }

  const pendientes = usuarios.filter((u) => u.estado === 'PENDIENTE')
  const activos = usuarios.filter((u) => u.estado === 'ACTIVO')
  const bloqueados = usuarios.filter((u) => u.estado === 'BLOQUEADO')

  const estadoBadge = (estado: string) => {
    if (estado === 'ACTIVO') return <span className="badge-success">ACTIVO</span>
    if (estado === 'PENDIENTE') return <span className="badge-warning">PENDIENTE</span>
    return <span className="badge-danger">BLOQUEADO</span>
  }

  const rolBadge = (rol: string) =>
    rol === 'ADMIN'
      ? <span className="badge bg-purple-100 text-purple-700">ADMIN</span>
      : <span className="badge-info">ERCE</span>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Gestión de usuarios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aprobación y control de acceso al sistema</p>
      </div>

      {/* Solicitudes pendientes */}
      {pendientes.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-800">
              Solicitudes pendientes ({pendientes.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {pendientes.map((u) => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm">
                    {u.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.nombre}</p>
                    <p className="text-xs text-slate-500">{u.email} · CI: {u.ci}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => accion(u.id, 'aprobar')}
                    disabled={accionando === u.id}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => accion(u.id, 'bloquear')}
                    disabled={accionando === u.id}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de todos los usuarios */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            Todos los usuarios ({usuarios.length})
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-400">
            Cargando usuarios...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Nombre', 'CI', 'Email', 'Rol', 'Estado', 'Registro', 'Acciones'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.ci}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">{rolBadge(u.rol)}</td>
                    <td className="px-4 py-3">{estadoBadge(u.estado)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-4 py-3">
                      {u.id !== user.id && (
                        <div className="flex items-center gap-1.5">
                          {u.estado === 'ACTIVO' && (
                            <button
                              onClick={() => accion(u.id, 'bloquear')}
                              disabled={accionando === u.id}
                              className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Bloquear
                            </button>
                          )}
                          {u.estado === 'BLOQUEADO' && (
                            <button
                              onClick={() => accion(u.id, 'activar')}
                              disabled={accionando === u.id}
                              className="text-xs px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              Reactivar
                            </button>
                          )}
                          {u.rol !== 'ADMIN' && u.estado === 'ACTIVO' && (
                            <button
                              onClick={() => accion(u.id, 'hacer_admin')}
                              disabled={accionando === u.id}
                              className="text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                            >
                              → Admin
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
