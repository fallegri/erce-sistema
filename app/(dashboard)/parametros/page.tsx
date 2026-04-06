'use client'

import { useState, useEffect } from 'react'
import { TipoMuestra, TipoEstudio } from '@/types'
import clsx from 'clsx'

type Tabla = 'tipos_muestra' | 'tipos_estudio'

export default function ParametrosPage() {
  const [tiposMuestra, setTiposMuestra] = useState<TipoMuestra[]>([])
  const [tiposEstudio, setTiposEstudio] = useState<TipoEstudio[]>([])
  const [nuevo, setNuevo] = useState({ tipos_muestra: '', tipos_estudio: '' })
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState<Tabla | null>(null)

  const fetchDatos = async () => {
    setLoading(true)
    const res = await fetch('/api/parametros')
    const data = await res.json()
    if (data.ok) {
      setTiposMuestra(data.data.tiposMuestra)
      setTiposEstudio(data.data.tiposEstudio)
    }
    setLoading(false)
  }

  useEffect(() => { fetchDatos() }, [])

  const agregar = async (tabla: Tabla) => {
    const nombre = nuevo[tabla].trim()
    if (!nombre) return
    setGuardando(tabla)
    await fetch('/api/parametros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabla, nombre }),
    })
    setNuevo((n) => ({ ...n, [tabla]: '' }))
    await fetchDatos()
    setGuardando(null)
  }

  const toggleActivo = async (tabla: Tabla, id: number, activo: boolean) => {
    await fetch('/api/parametros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabla, id, activo: !activo }),
    })
    await fetchDatos()
  }

  const Section = ({
    titulo,
    descripcion,
    tabla,
    items,
  }: {
    titulo: string
    descripcion: string
    tabla: Tabla
    items: (TipoMuestra | TipoEstudio)[]
  }) => (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
      </div>

      {/* Agregar nuevo */}
      <div className="px-5 py-4 border-b border-slate-100 flex gap-2">
        <input
          className="input-base text-sm"
          placeholder={`Nuevo ${titulo.toLowerCase().slice(0, -1)}...`}
          value={nuevo[tabla]}
          onChange={(e) => setNuevo((n) => ({ ...n, [tabla]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && agregar(tabla)}
        />
        <button
          onClick={() => agregar(tabla)}
          disabled={!nuevo[tabla].trim() || guardando === tabla}
          className="btn-primary shrink-0 text-sm"
        >
          {guardando === tabla ? '...' : 'Agregar'}
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="px-5 py-6 text-sm text-slate-400 text-center">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-6 text-sm text-slate-400 text-center">Sin registros aún.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={clsx(
                  'w-2 h-2 rounded-full shrink-0',
                  item.activo ? 'bg-green-400' : 'bg-slate-300'
                )} />
                <span className={clsx('text-sm', item.activo ? 'text-slate-800' : 'text-slate-400 line-through')}>
                  {item.nombre}
                </span>
              </div>
              <button
                onClick={() => toggleActivo(tabla, item.id, item.activo)}
                className={clsx(
                  'text-xs px-2.5 py-1 rounded-md transition-colors',
                  item.activo
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                )}
              >
                {item.activo ? 'Desactivar' : 'Activar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Parámetros del sistema</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestión de listas maestras para clasificación de muestras</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          titulo="Tipos de muestra"
          descripcion="Categorías de clasificación para las muestras periciales"
          tabla="tipos_muestra"
          items={tiposMuestra}
        />
        <Section
          titulo="Tipos de estudio"
          descripcion="Estudios periciales disponibles para solicitar"
          tabla="tipos_estudio"
          items={tiposEstudio}
        />
      </div>
    </div>
  )
}
