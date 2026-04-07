import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession, generateUniqueId } from '@/lib/auth'
import { MuestraForm } from '@/types'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const usuario_id = searchParams.get('usuario_id')
  let recepciones
  if (desde && hasta && usuario_id) {
    recepciones = await sql`
      SELECT r.*, u.nombre as usuario_nombre FROM recepciones r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta} AND r.usuario_id = ${parseInt(usuario_id)}
      ORDER BY r.created_at DESC`
  } else if (desde && hasta) {
    recepciones = await sql`
      SELECT r.*, u.nombre as usuario_nombre FROM recepciones r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
      ORDER BY r.created_at DESC`
  } else {
    recepciones = await sql`
      SELECT r.*, u.nombre as usuario_nombre FROM recepciones r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.created_at DESC LIMIT 50`
  }
  return NextResponse.json({ ok: true, data: recepciones })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
  try {
    const body = await req.json()
    const { funcionario_entrega, fecha_roma, fecha_erce, caso_abierto, ciudad, muestras } = body
    if (new Date(fecha_erce) < new Date(fecha_roma)) {
      return NextResponse.json({ ok: false, error: 'La fecha ERCE no puede ser anterior a la fecha ROMA.' }, { status: 400 })
    }
    if (!muestras || muestras.length === 0) {
      return NextResponse.json({ ok: false, error: 'Debe agregar al menos una muestra.' }, { status: 400 })
    }
    const recepcionId = generateUniqueId('REC')
    const recResult = await sql`
      INSERT INTO recepciones (id_unico, funcionario_entrega, fecha_roma, fecha_erce, caso_abierto, ciudad, usuario_id)
      VALUES (${recepcionId}, ${funcionario_entrega}, ${fecha_roma}, ${fecha_erce}, ${caso_abierto}, ${ciudad || session.ciudad || ''}, ${session.id})
      RETURNING id, id_unico`
    const recepcion = recResult[0]
    const muestrasCreadas = []
    for (const m of muestras as MuestraForm[]) {
      const muestraId = generateUniqueId('MST')
      const mResult = await sql`
        INSERT INTO muestras (id_unico, recepcion_id, persona_recolecto, fecha_recoleccion,
          pertenece_a, nombre_muestra, detalle, tipo_muestra_id,
          estudio_pericial_solicitado, codigo_idif_manual, analisis_ia)
        VALUES (${muestraId}, ${recepcion.id}, ${m.persona_recolecto}, ${m.fecha_recoleccion},
          ${m.pertenece_a}, ${m.nombre_muestra}, ${m.detalle || ''},
          ${m.tipo_muestra_id}, ${m.estudio_pericial_solicitado},
          ${m.codigo_idif_manual || null}, ${m.analisis_ia || null})
        RETURNING id, id_unico`
      const muestra = mResult[0]
      if (m.estudio_pericial_solicitado && m.tipos_estudio_ids?.length > 0) {
        for (const teId of m.tipos_estudio_ids) {
          await sql`INSERT INTO muestra_tipos_estudio (muestra_id, tipo_estudio_id) VALUES (${muestra.id}, ${teId}) ON CONFLICT DO NOTHING`
        }
      }
      muestrasCreadas.push({ id: muestra.id, id_unico: muestra.id_unico, nombre_muestra: m.nombre_muestra, pertenece_a: m.pertenece_a, fecha_erce, funcionario_entrega })
    }
    return NextResponse.json({ ok: true, data: { recepcion_id: recepcion.id, id_unico: recepcion.id_unico, muestras: muestrasCreadas } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al guardar el registro.' }, { status: 500 })
  }
}
