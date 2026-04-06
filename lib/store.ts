import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SessionUser, MuestraForm, RecepcionForm } from '@/types'

// ─── Auth Store ──────────────────────────────────────────────────────────────
interface AuthState {
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null })
        fetch('/api/auth/logout', { method: 'POST' }).then(() => {
          window.location.href = '/login'
        })
      },
    }),
    { name: 'erce-auth' }
  )
)

// ─── Recepción Store (carrito temporal) ─────────────────────────────────────
interface RecepcionState {
  form: RecepcionForm
  muestras: MuestraForm[]
  setForm: (form: Partial<RecepcionForm>) => void
  addMuestra: (muestra: MuestraForm) => void
  removeMuestra: (tempId: string) => void
  updateMuestra: (tempId: string, muestra: Partial<MuestraForm>) => void
  reset: () => void
}

const defaultForm: RecepcionForm = {
  funcionario_entrega: '',
  fecha_roma: '',
  fecha_erce: '',
  caso_abierto: true,
}

export const useRecepcionStore = create<RecepcionState>()((set) => ({
  form: defaultForm,
  muestras: [],
  setForm: (partial) => set((s) => ({ form: { ...s.form, ...partial } })),
  addMuestra: (muestra) => set((s) => ({ muestras: [...s.muestras, muestra] })),
  removeMuestra: (tempId) =>
    set((s) => ({ muestras: s.muestras.filter((m) => m.tempId !== tempId) })),
  updateMuestra: (tempId, partial) =>
    set((s) => ({
      muestras: s.muestras.map((m) =>
        m.tempId === tempId ? { ...m, ...partial } : m
      ),
    })),
  reset: () => set({ form: defaultForm, muestras: [] }),
}))
