import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { loginSchema, checkLoginRateLimit, recordLoginAttempt, getClientIp, auditLog } from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const ua = req.headers.get('user-agent') ?? ''

  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
    }
    const { email, password } = parsed.data

    // Rate limit check
    const { allowed, remaining } = await checkLoginRateLimit(ip, email)
    if (!allowed) {
      await auditLog({ accion: 'LOGIN_BLOQUEADO', ip, user_agent: ua, detalle: { email } })
      return NextResponse.json(
        { ok: false, error: `Demasiados intentos fallidos. Intenta en ${15} minutos.` },
        { status: 429 }
      )
    }

    const rows = await sql`
      SELECT id, nombre, email, ciudad, password_hash, rol, estado FROM usuarios WHERE email = ${email}`
    const user = rows[0]

    if (!user) {
      await recordLoginAttempt(ip, email, false)
      return NextResponse.json({ ok: false, error: 'Credenciales incorrectas.' }, { status: 401 })
    }
    if (user.estado === 'PENDIENTE') {
      return NextResponse.json({ ok: false, error: 'Esperando autorización del administrador.' }, { status: 403 })
    }
    if (user.estado === 'BLOQUEADO') {
      return NextResponse.json({ ok: false, error: 'Tu cuenta ha sido bloqueada. Contacta al administrador.' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      await recordLoginAttempt(ip, email, false)
      await auditLog({ usuario_id: user.id, accion: 'LOGIN_FALLIDO', ip, user_agent: ua })
      return NextResponse.json({ ok: false, error: 'Credenciales incorrectas.' }, { status: 401 })
    }

    await recordLoginAttempt(ip, email, true)
    await auditLog({ usuario_id: user.id, accion: 'LOGIN_EXITOSO', ip, user_agent: ua })

    const sessionUser = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, ciudad: user.ciudad }
    const token = signToken(sessionUser)
    const cookieStore = cookies()
    cookieStore.set('erce_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return NextResponse.json({ ok: true, user: sessionUser })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error interno del servidor.' }, { status: 500 })
  }
}
