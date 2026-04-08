'use client'

import { useState, useCallback } from 'react'
import { MuestraForm, TipoMuestra, TipoEstudio } from '@/types'
import clsx from 'clsx'

interface Props {
  muestraId: number
  muestraActual: MuestraForm
  tiposMuestra: TipoMuestra[]
  tiposEstudio: TipoEstudio[]
  onClose: () => void
  onEnviada: () => void
}

export default function ModalSolicitudEdicion({ muestraId, muestraActual, tiposMuestra, tiposEstudio, onClose, onEnviada }: Props) {
  const [form, setForm] = useState<MuestraForm>({ ...muestraActual })
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

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

  const tiposMuestraActivos = tiposMuestra.filter((t) => t.activo)
  const tiposEstudioActivos = tiposEstudio.filter((t) => t.activo)

  const handleEnviar = async () => {
    if (!motivo.trim() || motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/solicitudes-edicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muestra_id: muestraId, motivo: motivo.trim(), datos_nuevos: form }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Error al enviar solicitud.')
      } else {
        onEnviada()
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Solicitar edición de muestra</h2>
            <p className="text-xs text-slate-500 mt-0.5">Esta muestra ya tiene QR generado. La edición requiere aprobación del administrador.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-800">
            Los cambios propuestos serán revisados por un administrador antes de aplicarse. El registro original se mantiene intacto hasta la aprobación.
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la muestra</label>
              <input className="input-base" value={form.nombre_muestra} onChange={(e) => setField('nombre_muestra', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de muestra</label>
              <select className="input-base" value={form.tipo_muestra_id ?? ''}
                onChange={(e) => setField('tipo_muestra_id', parseInt(e.target.value) || null)}>
                <option value="">Seleccionar...</option>
                {tiposMuestraActivos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pertenece a</label>
              <input className="input-base" value={form.pertenece_a} onChange={(e) => setField('pertenece_a', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Persona que recolectó</label>
              <input className="input-base" value={form.persona_recolecto} onChange={(e) => setField('persona_recolecto', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de recolección</label>
              <input type="date" className="input-base" value={form.fecha_recoleccion} onChange={(e) => setField('fecha_recoleccion', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Detalle adicional</label>
              <input className="input-base" value={form.detalle} onChange={(e) => setField('detalle', e.target.value)} />
            </div>
          </div>

          {/* Switch estudio */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">Solicitud de estudio pericial</p>
              <button type="button"
                onClick={() => setForm((p) => ({ ...p, estudio_pericial_solicitado: !p.estudio_pericial_solicitado, tipos_estudio_ids: [], codigo_idif_manual: '' }))}
                className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.estudio_pericial_solicitado ? 'bg-brand-600' : 'bg-slate-300')}>
                <span className={clsx('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', form.estudio_pericial_solicitado ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>
            {form.estudio_pericial_solicitado && (
              <div className="mt-4 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  {tiposEstudioActivos.map((te) => (
                    <label key={te.id} className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm',
                      form.tipos_estudio_ids.includes(te.id) ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700')}>
                      <input type="checkbox" className="accent-brand-600" checked={form.tipos_estudio_ids.includes(te.id)} onChange={() => toggleEstudio(te.id)} />
                      {te.nombre}
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código IDIF</label>
                  <input className="input-base font-mono" value={form.codigo_idif_manual} onChange={(e) => setField('codigo_idif_manual', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Motivo — required */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Motivo de la solicitud <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-base resize-none"
              rows={3}
              placeholder="Explica por qué se necesita modificar esta muestra (mín. 10 caracteres)..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">{motivo.length}/1000 caracteres</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleEnviar} disabled={enviando || !motivo.trim()} className="btn-primary">
            {enviando ? 'Enviando...' : 'Enviar solicitud de edición'}
          </button>
        </div>
      </div>
    </div>
  )
}
