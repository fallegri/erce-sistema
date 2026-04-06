import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { nombre, ci, email, password } = await req.json()

    if (!nombre || !ci || !email || !password) {
      return NextResponse.json({ ok: false, error: 'Todos los campos son requeridos.' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM usuarios WHERE email = ${email} OR ci = ${ci}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe un usuario con ese email o CI.' },
        { status: 409 }
      )
    }

    const hash = await hashPassword(password)
    await sql`
      INSERT INTO usuarios (nombre, ci, email, password_hash, rol, estado)
      VALUES (${nombre}, ${ci}, ${email}, ${hash}, 'ERCE', 'PENDIENTE')
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al registrar usuario.' }, { status: 500 })
  }
}
