import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: counts for sidebar badges
export async function GET() {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
  }
  const [usuariosRows, edicionesRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total FROM usuarios WHERE estado = 'PENDIENTE'`,
    sql`SELECT COUNT(*)::int AS total FROM solicitudes_edicion WHERE estado = 'PENDIENTE'`,
  ])
  return NextResponse.json({
    ok: true,
    data: {
      pendientes_acceso: usuariosRows[0].total,
      pendientes_edicion: edicionesRows[0].total,
      total: usuariosRows[0].total + edicionesRows[0].total,
    },
  })
}
