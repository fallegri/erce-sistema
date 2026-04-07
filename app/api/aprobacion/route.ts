import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: conteo de pendientes para el badge del sidebar
export async function GET() {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
  }
  const rows = await sql`SELECT COUNT(*)::int AS total FROM usuarios WHERE estado = 'PENDIENTE'`
  return NextResponse.json({ ok: true, data: { pendientes: rows[0].total } })
}
