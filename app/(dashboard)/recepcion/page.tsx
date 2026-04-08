'use client'

import { useState, useEffect } from 'react'
import { useRecepcionStore, useAuthStore } from '@/lib/store'
import { TipoMuestra, TipoEstudio, MuestraForm } from '@/types'
import ModalMuestra from '@/components/forms/ModalMuestra'
import ModalQR from '@/components/ui/ModalQR'
import clsx from 'clsx'

interface MuestraQRData {
  id_unico: string
  nombre_muestra: string
  pertenece_a: string
  fecha_erce: string
  funcionario_entrega: string
}

export default function RecepcionPage() {
  const { form, muestras, setForm, addMuestra, removeMuestra, updateMuestra, reset } = useRecepcionStore()
  const user = useAuthStore((s) => s.user)
  const [tiposMuestra, setTiposMuestra] = useState<TipoMuestra[]>([])
  const [tiposEstudio, setTiposEstudio] = useState<TipoEstudio[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editandoTempId, setEditandoTempId] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [muestrasQR, setMuestrasQR] = useState<MuestraQRData[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.ciudad && !form.ciudad) setForm({ ciudad: user.ciudad })
  }, [user])

  useEffect(() => {
    fetch('/api/parametros').then((r) => r.json()).then((d) => {
      if (d.ok) { setTiposMuestra(d.data.tiposMuestra); setTiposEstudio(d.data.tiposEstudio) }
    })
  }, [])

  // Master form completeness check — required before adding muestras
  const masterCompleto = !!(form.funcionario_entrega && form.fecha_roma && form.fecha_erce && form.ciudad)
  const fechaInvalida = form.fecha_roma && form.fecha_erce
    ? new Date(form.fecha_erce) < new Date(form.fecha_roma) : false
  const formularioValido = masterCompleto && !fechaInvalida && muestras.length > 0

  const handleGuardar = async () => {
    if (!formularioValido) return
    setGuardando(true); setError('')
    try {
      const res = await fetch('/api/recepciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, muestras }),
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Error al guardar.') }
      else {
        const qrData: MuestraQRData[] = data.data.muestras.map((m: MuestraQRData) => ({
          ...m, fecha_erce: form.fecha_erce, funcionario_entrega: form.funcionario_entrega,
        }))
        setMuestrasQR(qrData); setShowQR(true); reset()
        if (user?.ciudad) setForm({ ciudad: user.ciudad })
      }
    } catch { setError('Error de conexión.') }
    finally { setGuardando(false) }
  }

  const getTipoNombre = (id: number | null) => tiposMuestra.find((t) => t.id === id)?.nombre ?? '—'
  const lastMuestra = muestras.length > 0 ? muestras[muestras.length - 1] : undefined
  const muestraDefaults = lastMuestra ? {
    persona_recolecto: lastMuestra.persona_recolecto,
    fecha_recoleccion: lastMuestra.fecha_recoleccion,
    pertenece_a: lastMuestra.pertenece_a,
  } : undefined
  const editandoMuestra = editandoTempId ? muestras.find((m) => m.tempId === editandoTempId) : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Nueva recepción</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro maestro-detalle de muestras periciales</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1.5 rounded-lg">
          <span className={clsx('w-2 h-2 rounded-full', muestras.length > 0 ? 'bg-green-500' : 'bg-slate-300')} />
          {muestras.length} muestra{muestras.length !== 1 ? 's' : ''} en carrito
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── MAESTRO ── */}
        <div className="xl:col-span-2">
          <div className="card p-6 space-y-5 sticky top-0">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 rounded-md bg-brand-100 flex items-center justify-center">
                <span className="text-xs font-bold text-brand-700">M</span>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Datos de recepción</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Funcionario que entrega *</label>
              <input className="input-base" placeholder="Nombre completo"
                value={form.funcionario_entrega} onChange={(e) => setForm({ funcionario_entrega: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha ROMA *</label>
                <input type="date" className="input-base" value={form.fecha_roma} onChange={(e) => setForm({ fecha_roma: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha ERCE *</label>
                <input type="date" className={clsx('input-base', fechaInvalida && 'border-red-400')}
                  value={form.fecha_erce} onChange={(e) => setForm({ fecha_erce: e.target.value })} />
              </div>
            </div>
            {fechaInvalida && <p className="text-xs text-red-600 -mt-2 font-medium">⚠ La fecha ERCE no puede ser anterior a la fecha ROMA.</p>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad *</label>
              <input className="input-base" placeholder="Ciudad de recepción"
                value={form.ciudad} onChange={(e) => setForm({ ciudad: e.target.value })} />
              {user?.ciudad && <p className="text-xs text-slate-400 mt-1">Ciudad por defecto: {user.ciudad}</p>}
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-700">Caso abierto</p>
                <p className="text-xs text-slate-500">Estado del expediente</p>
              </div>
              <button type="button" onClick={() => setForm({ caso_abierto: !form.caso_abierto })}
                className={clsx('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.caso_abierto ? 'bg-brand-600' : 'bg-slate-300')}>
                <span className={clsx('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', form.caso_abierto ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>

            {/* Lock notice when master incomplete */}
            {!masterCompleto && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-amber-700">Completa todos los campos de recepción antes de agregar muestras.</p>
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">{error}</div>}

            <button onClick={handleGuardar} disabled={!formularioValido || guardando} className="btn-primary w-full justify-center py-2.5">
              {guardando
                ? <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Guardando...</span>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Guardar registro completo</>}
            </button>
            {muestras.length === 0 && masterCompleto && <p className="text-xs text-slate-400 text-center">Agrega al menos una muestra para poder guardar.</p>}
          </div>
        </div>

        {/* ── DETALLE ── */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-600">D</span>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Muestras del registro</h2>
            </div>
            <button
              onClick={() => masterCompleto ? setShowModal(true) : null}
              disabled={!masterCompleto}
              className={clsx('btn-primary text-sm py-1.5', !masterCompleto && 'opacity-50 cursor-not-allowed')}
              title={!masterCompleto ? 'Completa los datos de recepción primero' : ''}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Añadir muestra
            </button>
          </div>

          {muestras.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Sin muestras agregadas</p>
              <p className="text-xs text-slate-400 mt-1">
                {masterCompleto ? 'Presiona "Añadir muestra" para comenzar.' : 'Completa primero los datos de recepción.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {muestras.map((m, idx) => (
                <div key={m.tempId} className={clsx('card p-4 flex gap-4 animate-slideIn transition-colors',
                  m.alerta_ia ? 'border-amber-300 bg-amber-50/30' : 'hover:border-slate-300')}>
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 font-display font-bold text-brand-700 text-sm">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{m.nombre_muestra}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{getTipoNombre(m.tipo_muestra_id)} · {m.pertenece_a}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditandoTempId(m.tempId); setShowModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => removeMuestra(m.tempId)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="badge-info">Recol: {m.fecha_recoleccion}</span>
                      <span className="badge-gray">{m.persona_recolecto}</span>
                      {m.estudio_pericial_solicitado && <span className="badge-warning">Estudio pericial</span>}
                      {m.codigo_idif_manual && <span className="badge-gray font-mono">IDIF: {m.codigo_idif_manual}</span>}
                      {m.alerta_ia && <span className="badge bg-amber-100 text-amber-700">⚠ Alerta IA</span>}
                    </div>
                    {m.alerta_ia && <p className="text-xs text-amber-700 mt-1.5 italic">{m.alerta_ia}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ModalMuestra
          tiposMuestra={tiposMuestra}
          tiposEstudio={tiposEstudio}
          defaults={!editandoTempId ? muestraDefaults : undefined}
          editando={editandoMuestra}
          onSave={(m) => {
            if (editandoTempId) {
              updateMuestra(editandoTempId, m)
              setEditandoTempId(null)
            } else {
              addMuestra(m as MuestraForm)
            }
            setShowModal(false)
          }}
          onClose={() => { setShowModal(false); setEditandoTempId(null) }}
        />
      )}
      {showQR && <ModalQR muestras={muestrasQR} onClose={() => setShowQR(false)} />}
    </div>
  )
}
