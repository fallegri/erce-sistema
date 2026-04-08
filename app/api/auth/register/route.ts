import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { registerSchema, getClientIp, auditLog } from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join('. ')
      return NextResponse.json({ ok: false, error: msg }, { status: 400 })
    }
    const { nombre, ci, email, password, ciudad } = parsed.data

    const existing = await sql`SELECT id FROM usuarios WHERE email = ${email} OR ci = ${ci}`
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'Ya existe un usuario con ese email o CI.' }, { status: 409 })
    }

    const hash = await hashPassword(password)
    const result = await sql`
      INSERT INTO usuarios (nombre, ci, email, password_hash, ciudad, rol, estado)
      VALUES (${nombre}, ${ci}, ${email}, ${hash}, ${ciudad}, 'ERCE', 'PENDIENTE')
      RETURNING id`

    await auditLog({ usuario_id: result[0].id, accion: 'REGISTRO_SOLICITUD', ip, detalle: { email, ciudad } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al registrar usuario.' }, { status: 500 })
  }
}
