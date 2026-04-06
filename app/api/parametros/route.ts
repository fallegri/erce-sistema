import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  const tiposMuestra = await sql`SELECT * FROM tipos_muestra ORDER BY nombre`
  const tiposEstudio = await sql`SELECT * FROM tipos_estudio ORDER BY nombre`

  return NextResponse.json({ ok: true, data: { tiposMuestra, tiposEstudio } })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  const { tabla, nombre } = await req.json()

  if (tabla === 'tipos_muestra') {
    const result = await sql`
      INSERT INTO tipos_muestra (nombre) VALUES (${nombre})
      ON CONFLICT (nombre) DO NOTHING
      RETURNING *
    `
    return NextResponse.json({ ok: true, data: result[0] })
  }

  if (tabla === 'tipos_estudio') {
    const result = await sql`
      INSERT INTO tipos_estudio (nombre) VALUES (${nombre})
      ON CONFLICT (nombre) DO NOTHING
      RETURNING *
    `
    return NextResponse.json({ ok: true, data: result[0] })
  }

  return NextResponse.json({ ok: false, error: 'Tabla no válida.' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  const { tabla, id, activo } = await req.json()

  if (tabla === 'tipos_muestra') {
    await sql`UPDATE tipos_muestra SET activo = ${activo} WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  }

  if (tabla === 'tipos_estudio') {
    await sql`UPDATE tipos_estudio SET activo = ${activo} WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: 'Tabla no válida.' }, { status: 400 })
}
