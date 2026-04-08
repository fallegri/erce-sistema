'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MuestraForm, TipoMuestra, TipoEstudio } from '@/types'
import clsx from 'clsx'

interface CoherenciaResult {
  coherente: boolean
  nivel_alerta: 'NINGUNA' | 'ADVERTENCIA' | 'CRITICA'
  mensaje: string
  sugerencias: string[]
}

interface Props {
  tiposMuestra: TipoMuestra[]
  tiposEstudio: TipoEstudio[]
  onSave: (muestra: MuestraForm) => void
  onClose: () => void
  defaults?: Partial<MuestraForm>
  editando?: MuestraForm  // if provided, modal is in edit mode
}

const blankForm = (defaults?: Partial<MuestraForm>): MuestraForm => ({
  tempId: crypto.randomUUID(),
  persona_recolecto: defaults?.persona_recolecto ?? '',
  fecha_recoleccion: defaults?.fecha_recoleccion ?? '',
  pertenece_a: defaults?.pertenece_a ?? '',
  nombre_muestra: '',
  detalle: '',
  tipo_muestra_id: null,
  estudio_pericial_solicitado: false,
  codigo_idif_manual: '',
  tipos_estudio_ids: [],
})

export default function ModalMuestra({ tiposMuestra, tiposEstudio, onSave, onClose, defaults, editando }: Props) {
  const [form, setForm] = useState<MuestraForm>(editando ?? blankForm(defaults))
  const [coherencia, setCoherencia] = useState<CoherenciaResult | null>(null)
  const [validando, setValidando] = useState(false)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const coherenciaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tiposMuestraActivos = tiposMuestra.filter((t) => t.activo)
  const tiposEstudioActivos = tiposEstudio.filter((t) => t.activo)

  // Stable setter to prevent focus loss
  const setField = useCallback(<K extends keyof MuestraForm>(key: K, value: MuestraForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleEstudio = useCallback((id: number) => {
    setForm((prev) => ({
      ...prev,
      tipos_estudio_ids: prev.tipos_estudio_ids.includes(id)
        ? prev.tipos_estudio_ids.filter((x) => x !== id)
        : [...prev.tipos_estudio_ids, id],
    }))
  }, [])

  // Auto-trigger coherence check when type or estudios change — debounced 800ms
  useEffect(() => {
    if (!form.tipo_muestra_id || !form.nombre_muestra) return
    if (coherenciaTimerRef.current) clearTimeout(coherenciaTimerRef.current)
    coherenciaTimerRef.current = setTimeout(async () => {
      setValidando(true)
      try {
        const tipoMuestraNombre = tiposMuestra.find((t) => t.id === form.tipo_muestra_id)?.nombre ?? ''
        const tiposEstudioNombres = tiposEstudio
          .filter((t) => form.tipos_estudio_ids.includes(t.id))
          .map((t) => t.nombre)
        const res = await fetch('/api/analisis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipoMuestraNombre, tiposEstudioNombres, nombreMuestra: form.nombre_muestra, detalle: form.detalle }),
        })
        const data = await res.json()
        if (data.ok && data.data.nivel_alerta !== 'NINGUNA') {
          setCoherencia(data.data)
          setMostrarAlerta(true)
        } else {
          setCoherencia(data.ok ? data.data : null)
          setMostrarAlerta(false)
        }
      } catch { /* silencio */ }
      finally { setValidando(false) }
    }, 800)
    return () => { if (coherenciaTimerRef.current) clearTimeout(coherenciaTimerRef.current) }
  }, [form.tipo_muestra_id, form.tipos_estudio_ids, form.nombre_muestra])

  const formValido = form.persona_recolecto && form.fecha_recoleccion && form.pertenece_a
    && form.nombre_muestra && form.tipo_muestra_id

  const handleSave = () => {
    // If there's a pending critical alert and user hasn't dismissed it, show it
    if (coherencia && coherencia.nivel_alerta !== 'NINGUNA' && mostrarAlerta) {
      setMostrarAlerta(true)
      return
    }
    onSave({
      ...form,
      alerta_ia: coherencia && coherencia.nivel_alerta !== 'NINGUNA' ? coherencia.mensaje : null,
    } as MuestraForm)
  }

  const alertaBg = coherencia?.nivel_alerta === 'CRITICA' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'
  const alertaText = coherencia?.nivel_alerta === 'CRITICA' ? 'text-red-800' : 'text-amber-800'
  const alertaIcon = coherencia?.nivel_alerta === 'CRITICA' ? '🚨' : '⚠️'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">

        {/* Alert modal overlay */}
        {mostrarAlerta && coherencia && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm">
            <div className={clsx('m-6 rounded-xl border-2 p-6 shadow-xl max-w-md w-full', alertaBg)}>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{alertaIcon}</span>
                <div>
                  <h3 className={clsx('font-bold text-base', alertaText)}>
                    Alerta de coherencia — {coherencia.nivel_alerta}
                  </h3>
                  <p className={clsx('text-sm mt-1', alertaText)}>{coherencia.mensaje}</p>
                </div>
              </div>
              {coherencia.sugerencias.length > 0 && (
                <ul className="mb-4 space-y-1">
                  {coherencia.sugerencias.map((s, i) => (
                    <li key={i} className={clsx('text-xs flex items-start gap-1.5', alertaText)}>
                      <span className="mt-0.5 shrink-0">→</span>{s}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarAlerta(false)}
                  className="flex-1 btn-secondary text-sm justify-center"
                >
                  Corregir datos
                </button>
                <button
                  onClick={() => {
                    setMostrarAlerta(false)
                    onSave({ ...form, alerta_ia: coherencia.mensaje } as MuestraForm)
                  }}
                  className={clsx('flex-1 text-sm rounded-lg px-4 py-2 font-medium transition-colors justify-center',
                    coherencia.nivel_alerta === 'CRITICA'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  )}
                >
                  Registrar de igual modo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {editando ? 'Editar muestra' : 'Agregar muestra'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              {editando && <span className="badge-warning">Modo edición</span>}
              {defaults?.persona_recolecto && !editando && <span className="text-brand-600">Datos heredados del registro anterior</span>}
              {validando && <span className="text-slate-400 flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Validando coherencia...</span>}
              {!validando && coherencia?.nivel_alerta === 'NINGUNA' && form.tipo_muestra_id && form.nombre_muestra && <span className="text-green-600 text-xs">✓ Coherencia verificada</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la muestra *</label>
              <input className="input-base" placeholder="Ej. Muestra de sangre #1"
                value={form.nombre_muestra} onChange={(e) => setField('nombre_muestra', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de muestra *</label>
              <select className="input-base" value={form.tipo_muestra_id ?? ''}
                onChange={(e) => setField('tipo_muestra_id', parseInt(e.target.value) || null)}>
                <option value="">Seleccionar...</option>
                {tiposMuestraActivos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pertenece a *</label>
              <input className="input-base" placeholder="Nombre del imputado/víctima"
                value={form.pertenece_a} onChange={(e) => setField('pertenece_a', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Persona que recolectó *</label>
              <input className="input-base" placeholder="Nombre del perito/funcionario"
                value={form.persona_recolecto} onChange={(e) => setField('persona_recolecto', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de recolección *</label>
              <input type="date" className="input-base" value={form.fecha_recoleccion}
                onChange={(e) => setField('fecha_recoleccion', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Detalle adicional</label>
              <input className="input-base" placeholder="Observaciones o descripción"
                value={form.detalle} onChange={(e) => setField('detalle', e.target.value)} />
            </div>
          </div>

          {/* Switch estudio pericial */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Solicitud de estudio pericial</p>
                <p className="text-xs text-slate-500 mt-0.5">¿Esta muestra requiere análisis pericial especializado?</p>
              </div>
              <button type="button"
                onClick={() => setForm((p) => ({ ...p, estudio_pericial_solicitado: !p.estudio_pericial_solicitado, tipos_estudio_ids: [], codigo_idif_manual: '' }))}
                className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.estudio_pericial_solicitado ? 'bg-brand-600' : 'bg-slate-300')}>
                <span className={clsx('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', form.estudio_pericial_solicitado ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>
            {form.estudio_pericial_solicitado && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide">Tipos de estudio requeridos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposEstudioActivos.map((te) => (
                      <label key={te.id} className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                        form.tipos_estudio_ids.includes(te.id) ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}>
                        <input type="checkbox" className="accent-brand-600" checked={form.tipos_estudio_ids.includes(te.id)} onChange={() => toggleEstudio(te.id)} />
                        {te.nombre}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código IDIF</label>
                  <input className="input-base font-mono" placeholder="Ej. 00123456"
                    value={form.codigo_idif_manual} onChange={(e) => setField('codigo_idif_manual', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Coherence status bar */}
          {coherencia && coherencia.nivel_alerta !== 'NINGUNA' && !mostrarAlerta && (
            <div className={clsx('flex items-start gap-3 rounded-xl border px-4 py-3 animate-fadeIn', alertaBg)}>
              <span className="text-base mt-0.5">{alertaIcon}</span>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-xs font-semibold', alertaText)}>Alerta de coherencia IA — {coherencia.nivel_alerta}</p>
                <p className={clsx('text-xs mt-0.5', alertaText)}>{coherencia.mensaje}</p>
              </div>
              <button onClick={() => setMostrarAlerta(true)} className={clsx('text-xs font-medium shrink-0 underline', alertaText)}>Ver detalle</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={!formValido} className="btn-primary">
            {editando ? 'Guardar cambios' : 'Agregar muestra'}
          </button>
        </div>
      </div>
    </div>
  )
}
