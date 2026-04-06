import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const rows = await sql`
      SELECT id, nombre, email, password_hash, rol, estado
      FROM usuarios WHERE email = ${email}
    `
    const user = rows[0]

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Credenciales incorrectas.' }, { status: 401 })
    }

    if (user.estado === 'PENDIENTE') {
      return NextResponse.json(
        { ok: false, error: 'Esperando autorización del administrador.' },
        { status: 403 }
      )
    }

    if (user.estado === 'BLOQUEADO') {
      return NextResponse.json(
        { ok: false, error: 'Tu cuenta ha sido bloqueada. Contacta al administrador.' },
        { status: 403 }
      )
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Credenciales incorrectas.' }, { status: 401 })
    }

    const sessionUser = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    const token = signToken(sessionUser)

    const cookieStore = cookies()
    cookieStore.set('erce_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })

    return NextResponse.json({ ok: true, user: sessionUser })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error interno del servidor.' }, { status: 500 })
  }
}
