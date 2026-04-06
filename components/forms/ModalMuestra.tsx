'use client'

import { useState, useEffect } from 'react'
import { MuestraForm, TipoMuestra, TipoEstudio, AnalisisIA } from '@/types'
import clsx from 'clsx'

interface Props {
  tiposMuestra: TipoMuestra[]
  tiposEstudio: TipoEstudio[]
  onSave: (muestra: MuestraForm & { analisis_ia?: string }) => void
  onClose: () => void
  inicial?: MuestraForm
}

const defaultForm = (): MuestraForm => ({
  tempId: crypto.randomUUID(),
  persona_recolecto: '',
  fecha_recoleccion: '',
  pertenece_a: '',
  nombre_muestra: '',
  detalle: '',
  tipo_muestra_id: null,
  estudio_pericial_solicitado: false,
  codigo_idif_manual: '',
  tipos_estudio_ids: [],
})

export default function ModalMuestra({ tiposMuestra, tiposEstudio, onSave, onClose, inicial }: Props) {
  const [form, setForm] = useState<MuestraForm>(inicial ?? defaultForm())
  const [analisis, setAnalisis] = useState<AnalisisIA | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const tipoMuestraActivos = tiposMuestra.filter((t) => t.activo)
  const tiposEstudioActivos = tiposEstudio.filter((t) => t.activo)

  const toggleEstudio = (id: number) => {
    setForm((f) => ({
      ...f,
      tipos_estudio_ids: f.tipos_estudio_ids.includes(id)
        ? f.tipos_estudio_ids.filter((x) => x !== id)
        : [...f.tipos_estudio_ids, id],
    }))
  }

  const analizarConIA = async () => {
    if (!form.nombre_muestra || !form.tipo_muestra_id) return
    setAnalizando(true)
    try {
      const tipoMuestraNombre = tiposMuestra.find((t) => t.id === form.tipo_muestra_id)?.nombre ?? ''
      const tiposEstudioNombres = tiposEstudio
        .filter((t) => form.tipos_estudio_ids.includes(t.id))
        .map((t) => t.nombre)

      const res = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muestra: form, tipoMuestraNombre, tiposEstudioNombres }),
      })
      const data = await res.json()
      if (data.ok) setAnalisis(data.data)
    } catch {
      // silencio — se puede guardar igual
    } finally {
      setAnalizando(false)
    }
  }

  const handleSave = () => {
    setGuardando(true)
    onSave({
      ...form,
      analisis_ia: analisis ? JSON.stringify(analisis) : undefined,
    })
  }

  const formValido =
    form.persona_recolecto &&
    form.fecha_recoleccion &&
    form.pertenece_a &&
    form.nombre_muestra &&
    form.tipo_muestra_id

  const priorityColor: Record<string, string> = {
    BAJO: 'text-green-700 bg-green-50 border-green-200',
    MEDIO: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    ALTO: 'text-orange-700 bg-orange-50 border-orange-200',
    CRITICO: 'text-red-700 bg-red-50 border-red-200',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Agregar muestra</h2>
            <p className="text-xs text-slate-500 mt-0.5">Completa los datos de la muestra pericial</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la muestra *</label>
              <input
                className="input-base"
                placeholder="Ej. Muestra de sangre #1"
                value={form.nombre_muestra}
                onChange={(e) => setForm({ ...form, nombre_muestra: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de muestra *</label>
              <select
                className="input-base"
                value={form.tipo_muestra_id ?? ''}
                onChange={(e) => setForm({ ...form, tipo_muestra_id: parseInt(e.target.value) || null })}
              >
                <option value="">Seleccionar...</option>
                {tipoMuestraActivos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pertenece a *</label>
              <input
                className="input-base"
                placeholder="Nombre del imputado/víctima"
                value={form.pertenece_a}
                onChange={(e) => setForm({ ...form, pertenece_a: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Persona que recolectó *</label>
              <input
                className="input-base"
                placeholder="Nombre del perito/funcionario"
                value={form.persona_recolecto}
                onChange={(e) => setForm({ ...form, persona_recolecto: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de recolección *</label>
              <input
                type="date"
                className="input-base"
                value={form.fecha_recoleccion}
                onChange={(e) => setForm({ ...form, fecha_recoleccion: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Detalle adicional</label>
              <input
                className="input-base"
                placeholder="Observaciones o descripción"
                value={form.detalle}
                onChange={(e) => setForm({ ...form, detalle: e.target.value })}
              />
            </div>
          </div>

          {/* BDD Feature 3: Switch dinámico de estudio pericial */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Solicitud de estudio pericial</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ¿Esta muestra requiere un análisis pericial especializado?
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    estudio_pericial_solicitado: !f.estudio_pericial_solicitado,
                    tipos_estudio_ids: [],
                    codigo_idif_manual: '',
                  }))
                }
                className={clsx(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                  form.estudio_pericial_solicitado ? 'bg-brand-600' : 'bg-slate-300'
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    form.estudio_pericial_solicitado ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Campos condicionales — BDD Feature 3 */}
            {form.estudio_pericial_solicitado && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide">
                    Tipos de estudio requeridos
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposEstudioActivos.map((te) => (
                      <label
                        key={te.id}
                        className={clsx(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                          form.tipos_estudio_ids.includes(te.id)
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-600"
                          checked={form.tipos_estudio_ids.includes(te.id)}
                          onChange={() => toggleEstudio(te.id)}
                        />
                        {te.nombre}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código IDIF</label>
                  <input
                    className="input-base font-mono"
                    placeholder="Ej. 00123456 (se preservarán ceros)"
                    value={form.codigo_idif_manual}
                    onChange={(e) => setForm({ ...form, codigo_idif_manual: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Análisis IA con Gemini */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-50 to-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.5 3.5 0 01-4.95 0l-.347-.347z" />
                </svg>
                <span className="text-sm font-medium text-slate-800">Análisis IA — Gemini</span>
              </div>
              <button
                type="button"
                onClick={analizarConIA}
                disabled={!formValido || analizando}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50"
              >
                {analizando ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analizando...
                  </span>
                ) : 'Analizar muestra'}
              </button>
            </div>

            <div className="p-4">
              {!analisis && !analizando && (
                <p className="text-xs text-slate-400 text-center py-2">
                  {formValido
                    ? 'Presiona "Analizar muestra" para obtener recomendaciones automáticas de Gemini.'
                    : 'Completa los campos obligatorios para habilitar el análisis.'}
                </p>
              )}
              {analizando && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
                  <svg className="animate-spin h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Consultando Gemini...
                </div>
              )}
              {analisis && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Nivel de prioridad</span>
                    <span className={clsx('badge text-xs font-semibold', priorityColor[analisis.nivel_prioridad])}>
                      {analisis.nivel_prioridad}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{analisis.resumen}</p>
                  {analisis.alertas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-700 mb-1.5">⚠ Alertas</p>
                      <ul className="space-y-1">
                        {analisis.alertas.map((a, i) => (
                          <li key={i} className="text-xs text-orange-800 bg-orange-50 rounded-lg px-3 py-1.5">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analisis.recomendaciones.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1.5">✓ Recomendaciones</p>
                      <ul className="space-y-1">
                        {analisis.recomendaciones.map((r, i) => (
                          <li key={i} className="text-xs text-blue-800 bg-blue-50 rounded-lg px-3 py-1.5">{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!formValido || guardando}
            className="btn-primary"
          >
            {guardando ? 'Guardando...' : 'Agregar muestra'}
          </button>
        </div>
      </div>
    </div>
  )
}
