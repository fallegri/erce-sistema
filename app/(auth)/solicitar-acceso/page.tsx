'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SolicitarAccesoPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', ci: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, ci: form.ci, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Error al registrar.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
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
        {[
          { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Ej. Juan Pérez López' },
          { label: 'Cédula de Identidad', key: 'ci', type: 'text', placeholder: 'Ej. 1234567' },
          { label: 'Correo electrónico', key: 'email', type: 'email', placeholder: 'usuario@institución.gob.bo' },
          { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
          { label: 'Confirmar contraseña', key: 'confirm', type: 'password', placeholder: '••••••••' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
              type={type}
              className="input-base"
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

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
