// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'ERCE'
export type UserEstado = 'PENDIENTE' | 'ACTIVO' | 'BLOQUEADO'

export interface Usuario {
  id: number
  nombre: string
  ci: string
  email: string
  ciudad: string
  rol: UserRole
  estado: UserEstado
  created_at: string
}

export interface SessionUser {
  id: number
  nombre: string
  email: string
  rol: UserRole
  ciudad: string
}

// ─── Recepcion (Maestro) ─────────────────────────────────────────────────────
export interface Recepcion {
  id: number
  id_unico: string
  funcionario_entrega: string
  fecha_roma: string
  fecha_erce: string
  caso_abierto: boolean
  ciudad: string
  usuario_id: number
  usuario_nombre?: string
  created_at: string
  muestras?: Muestra[]
}

// ─── Muestra (Detalle) ───────────────────────────────────────────────────────
export interface Muestra {
  id: number
  id_unico: string
  recepcion_id: number
  persona_recolecto: string
  fecha_recoleccion: string
  pertenece_a: string
  nombre_muestra: string
  detalle: string
  tipo_muestra_id: number
  tipo_muestra_nombre?: string
  estudio_pericial_solicitado: boolean
  codigo_idif_manual: string | null
  tipos_estudio?: TipoEstudio[]
  analisis_ia?: string | null
  created_at: string
}

// ─── Parámetros ──────────────────────────────────────────────────────────────
export interface TipoMuestra {
  id: number
  nombre: string
  activo: boolean
}

export interface TipoEstudio {
  id: number
  nombre: string
  activo: boolean
}

// ─── Frontend State (Carrito temporal) ──────────────────────────────────────
export interface MuestraForm {
  tempId: string
  persona_recolecto: string
  fecha_recoleccion: string
  pertenece_a: string
  nombre_muestra: string
  detalle: string
  tipo_muestra_id: number | null
  estudio_pericial_solicitado: boolean
  codigo_idif_manual: string
  tipos_estudio_ids: number[]
  analisis_ia?: string | null
}

export interface RecepcionForm {
  funcionario_entrega: string
  fecha_roma: string
  fecha_erce: string
  caso_abierto: boolean
  ciudad: string
}

// ─── API Responses ───────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

export interface AnalisisIA {
  resumen: string
  alertas: string[]
  recomendaciones: string[]
  nivel_prioridad: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'
}
