import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
  }

  const usuarios = await sql`
    SELECT id, nombre, ci, email, rol, estado, created_at
    FROM usuarios
    ORDER BY estado ASC, created_at DESC
  `
  return NextResponse.json({ ok: true, data: usuarios })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
  }

  const { id, accion } = await req.json()

  if (accion === 'aprobar') {
    await sql`
      UPDATE usuarios SET estado = 'ACTIVO', rol = 'ERCE'
      WHERE id = ${id} AND estado = 'PENDIENTE'
    `
    return NextResponse.json({ ok: true, mensaje: 'Usuario aprobado.' })
  }

  if (accion === 'bloquear') {
    await sql`
      UPDATE usuarios SET estado = 'BLOQUEADO'
      WHERE id = ${id} AND id != ${session.id}
    `
    return NextResponse.json({ ok: true, mensaje: 'Usuario bloqueado.' })
  }

  if (accion === 'activar') {
    await sql`
      UPDATE usuarios SET estado = 'ACTIVO'
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true, mensaje: 'Usuario reactivado.' })
  }

  if (accion === 'hacer_admin') {
    await sql`
      UPDATE usuarios SET rol = 'ADMIN'
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true, mensaje: 'Rol actualizado a ADMIN.' })
  }

  return NextResponse.json({ ok: false, error: 'Acción no reconocida.' }, { status: 400 })
}
