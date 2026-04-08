import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { muestraSchema, getClientIp, auditLog } from '@/lib/security'
import { z } from 'zod'

// PATCH /api/muestras — edit muestra while still in-session (pre-QR carrito is client-side)
// This endpoint handles edits to already-persisted muestras (post-QR requires solicitud)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
  const ip = getClientIp(req)

  const bodySchema = z.object({
    muestra_id: z.number().int().positive(),
    datos: muestraSchema,
  })

  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
    const { muestra_id, datos } = parsed.data

    // Check ownership: only original user or ADMIN can edit
    const rows = await sql`
      SELECT m.id, r.usuario_id FROM muestras m
      JOIN recepciones r ON m.recepcion_id = r.id
      WHERE m.id = ${muestra_id}`
    if (rows.length === 0) return NextResponse.json({ ok: false, error: 'Muestra no encontrada.' }, { status: 404 })
    if (session.rol !== 'ADMIN' && rows[0].usuario_id !== session.id) {
      return NextResponse.json({ ok: false, error: 'Sin permiso para editar esta muestra.' }, { status: 403 })
    }

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
        analisis_ia = ${datos.analisis_ia || null},
        alerta_ia = ${datos.alerta_ia || null},
        updated_at = NOW()
      WHERE id = ${muestra_id}`

    // Refresh tipos_estudio
    await sql`DELETE FROM muestra_tipos_estudio WHERE muestra_id = ${muestra_id}`
    if (datos.estudio_pericial_solicitado && datos.tipos_estudio_ids?.length > 0) {
      for (const teId of datos.tipos_estudio_ids) {
        await sql`INSERT INTO muestra_tipos_estudio (muestra_id, tipo_estudio_id) VALUES (${muestra_id}, ${teId}) ON CONFLICT DO NOTHING`
      }
    }

    await auditLog({ usuario_id: session.id, accion: 'MUESTRA_EDITADA_DIRECTA', entidad: 'muestras', entidad_id: String(muestra_id), ip })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al actualizar muestra.' }, { status: 500 })
  }
}
