'use client'

import { useState } from 'react'
import Link from 'next/link'

const CIUDADES_BOLIVIA = [
  'La Paz','El Alto','Cochabamba','Santa Cruz de la Sierra','Oruro','Potosí',
  'Sucre','Tarija','Trinidad','Cobija','Sacaba','Quillacollo','Montero',
  'Riberalta','Yacuiba','Otra'
]

export default function SolicitarAccesoPage() {
  const [form, setForm] = useState({ nombre: '', ci: '', email: '', ciudad: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, ci: form.ci, email: form.email, ciudad: form.ciudad, password: form.password }),
      })
      const data = await res.json()
      if (!data.ok) setError(data.error || 'Error al registrar.')
      else setSuccess(true)
    } catch { setError('Error de conexión.') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="card p-8 text-center animate-fadeIn">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Solicitud enviada</h2>
        <p className="text-sm text-slate-500 mb-6">
          Tu cuenta fue creada con estado <strong>PENDIENTE</strong>. Un administrador deberá aprobarla antes de que puedas acceder.
        </p>
        <Link href="/login" className="btn-primary">Volver al login</Link>
      </div>
    )
  }

  return (
    <div className="card p-8 animate-fadeIn">
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Solicitar acceso</h1>
      <p className="text-sm text-slate-500 mb-6">Completa el formulario. Un administrador aprobará tu cuenta.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
          <input className="input-base" placeholder="Ej. Juan Pérez López" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula de Identidad</label>
            <input className="input-base" placeholder="Ej. 1234567" value={form.ci} onChange={(e) => setForm({ ...form, ci: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
            <select className="input-base" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} required>
              <option value="">Seleccionar...</option>
              {CIUDADES_BOLIVIA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
          <input type="email" className="input-base" placeholder="usuario@institución.gob.bo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input type="password" className="input-base" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input type="password" className="input-base" placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">{error}</div>}
        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
          {loading ? 'Enviando solicitud...' : 'Solicitar acceso'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand-600 font-medium hover:underline">Iniciar sesión</Link>
      </p>
    </div>
  )
}
