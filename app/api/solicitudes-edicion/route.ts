import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { solicitudEdicionSchema, getClientIp, auditLog } from '@/lib/security'
import { z } from 'zod'

// GET — list pending edit requests (ADMIN only)
export async function GET() {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
  }
  const rows = await sql`
    SELECT se.*, m.id_unico as muestra_id_unico, m.nombre_muestra,
      u.nombre as solicitante_nombre, u.email as solicitante_email
    FROM solicitudes_edicion se
    JOIN muestras m ON se.muestra_id = m.id
    JOIN usuarios u ON se.usuario_id = u.id
    ORDER BY se.created_at DESC`
  return NextResponse.json({ ok: true, data: rows })
}

// POST — create edit request (ERCE user)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
  const ip = getClientIp(req)

  try {
    const body = await req.json()
    const parsed = solicitudEdicionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
    }
    const { muestra_id, motivo, datos_nuevos } = parsed.data

    // Verify muestra belongs to user's recepcion
    const check = await sql`
      SELECT m.id FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
      WHERE m.id = ${muestra_id} AND (r.usuario_id = ${session.id} OR ${session.rol} = 'ADMIN')`
    if (check.length === 0) return NextResponse.json({ ok: false, error: 'Muestra no encontrada.' }, { status: 404 })

    // Check no pending request already exists
    const existing = await sql`
      SELECT id FROM solicitudes_edicion WHERE muestra_id = ${muestra_id} AND estado = 'PENDIENTE'`
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'Ya existe una solicitud de edición pendiente para esta muestra.' }, { status: 409 })
    }

    const result = await sql`
      INSERT INTO solicitudes_edicion (muestra_id, usuario_id, datos_nuevos, motivo)
      VALUES (${muestra_id}, ${session.id}, ${JSON.stringify(datos_nuevos)}, ${motivo})
      RETURNING id`

    await auditLog({ usuario_id: session.id, accion: 'SOLICITUD_EDICION_CREADA', entidad: 'muestras', entidad_id: String(muestra_id), ip, detalle: { motivo } })
    return NextResponse.json({ ok: true, data: { solicitud_id: result[0].id } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al crear solicitud.' }, { status: 500 })
  }
}

// PATCH — approve or reject (ADMIN only)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Acceso denegado.' }, { status: 403 })
  }
  const ip = getClientIp(req)

  const schema = z.object({
    solicitud_id: z.number().int().positive(),
    accion: z.enum(['aprobar', 'rechazar']),
    admin_nota: z.string().max(500).optional().default(''),
  })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
    const { solicitud_id, accion, admin_nota } = parsed.data

    const solRows = await sql`SELECT * FROM solicitudes_edicion WHERE id = ${solicitud_id} AND estado = 'PENDIENTE'`
    if (solRows.length === 0) return NextResponse.json({ ok: false, error: 'Solicitud no encontrada o ya procesada.' }, { status: 404 })
    const sol = solRows[0]

    if (accion === 'aprobar') {
      const datos = sol.datos_nuevos as any
      await sql`
        UPDATE muestras SET
          persona_recolecto = ${datos.persona_recolecto},
          fecha_recoleccion = ${datos.fecha_recoleccion},
          pertenece_a = ${datos.pertenece_a},
          nombre_muestra = ${datos.nombre_muestra},
          detalle = ${datos.detalle || ''},
          tipo_muestra_id = ${datos.tipo_muestra_id},
          estudio_pericial_solicitado = ${datos.estudio_pericial_solicitado},
          codigo_idif_manual = ${datos.codigo_idif_manual || null},
          updated_at = NOW()
        WHERE id = ${sol.muestra_id}`

      await sql`DELETE FROM muestra_tipos_estudio WHERE muestra_id = ${sol.muestra_id}`
      if (datos.estudio_pericial_solicitado && datos.tipos_estudio_ids?.length > 0) {
        for (const teId of datos.tipos_estudio_ids) {
          await sql`INSERT INTO muestra_tipos_estudio (muestra_id, tipo_estudio_id) VALUES (${sol.muestra_id}, ${teId}) ON CONFLICT DO NOTHING`
        }
      }
    }

    await sql`
      UPDATE solicitudes_edicion SET
        estado = ${accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA'},
        admin_id = ${session.id},
        admin_nota = ${admin_nota},
        resuelto_at = NOW()
      WHERE id = ${solicitud_id}`

    await auditLog({ usuario_id: session.id, accion: `SOLICITUD_${accion.toUpperCase()}DA`, entidad: 'solicitudes_edicion', entidad_id: String(solicitud_id), ip, detalle: { admin_nota } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al procesar solicitud.' }, { status: 500 })
  }
}
