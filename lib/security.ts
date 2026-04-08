import { sql } from '@/lib/db'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// ─── Rate limiting ────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

export async function checkLoginRateLimit(ip: string, email: string): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const rows = await sql`
    SELECT COUNT(*)::int AS attempts FROM login_attempts
    WHERE ip = ${ip} AND email = ${email} AND success = false AND created_at > ${since}`
  const attempts = rows[0].attempts
  return { allowed: attempts < MAX_ATTEMPTS, remaining: MAX_ATTEMPTS - attempts }
}

export async function recordLoginAttempt(ip: string, email: string, success: boolean) {
  await sql`INSERT INTO login_attempts (ip, email, success) VALUES (${ip}, ${email}, ${success})`
  // Cleanup old entries periodically
  if (Math.random() < 0.05) {
    await sql`DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '24 hours'`
  }
}

// ─── Audit log ────────────────────────────────────────────────────────────────
export async function auditLog(params: {
  usuario_id?: number | null
  accion: string
  entidad?: string
  entidad_id?: string
  ip?: string
  user_agent?: string
  detalle?: Record<string, unknown>
}) {
  try {
    await sql`
      INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, ip, user_agent, detalle)
      VALUES (
        ${params.usuario_id ?? null},
        ${params.accion},
        ${params.entidad ?? null},
        ${params.entidad_id ?? null},
        ${params.ip ?? null},
        ${params.user_agent ?? null},
        ${params.detalle ? JSON.stringify(params.detalle) : null}
      )`
  } catch { /* audit should never break the app */ }
}

// ─── IP extraction ────────────────────────────────────────────────────────────
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

// ─── Input sanitization ───────────────────────────────────────────────────────
export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>'"`;]/g, '') // strip basic XSS chars
    .substring(0, 1000)       // length cap
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = typeof v === 'string' ? sanitizeString(v) : v
  }
  return result as T
}

// ─── Zod schemas (server-side validation) ─────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(6).max(128),
})

export const registerSchema = z.object({
  nombre: z.string().min(2).max(200).trim(),
  ci: z.string().min(4).max(20).regex(/^[a-zA-Z0-9\-]+$/, 'CI inválido'),
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[0-9]/, 'Debe contener número'),
  ciudad: z.string().min(2).max(100).trim(),
})

export const muestraSchema = z.object({
  persona_recolecto: z.string().min(2).max(300).trim(),
  fecha_recoleccion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pertenece_a: z.string().min(2).max(300).trim(),
  nombre_muestra: z.string().min(2).max(300).trim(),
  detalle: z.string().max(2000).trim().optional().default(''),
  tipo_muestra_id: z.number().int().positive(),
  estudio_pericial_solicitado: z.boolean(),
  codigo_idif_manual: z.string().max(50).trim().optional().default(''),
  tipos_estudio_ids: z.array(z.number().int().positive()).optional().default([]),
  analisis_ia: z.string().max(5000).optional().nullable(),
  alerta_ia: z.string().max(2000).optional().nullable(),
})

export const recepcionSchema = z.object({
  funcionario_entrega: z.string().min(2).max(300).trim(),
  fecha_roma: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_erce: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  caso_abierto: z.boolean(),
  ciudad: z.string().min(2).max(100).trim(),
  muestras: z.array(muestraSchema).min(1).max(50),
})

export const solicitudEdicionSchema = z.object({
  muestra_id: z.number().int().positive(),
  motivo: z.string().min(10).max(1000).trim(),
  datos_nuevos: muestraSchema,
})
