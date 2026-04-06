import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const usuario_id = searchParams.get('usuario_id')

  let rows
  if (desde && hasta && usuario_id && usuario_id !== 'todos') {
    rows = await sql`
      SELECT
        m.id_unico            AS "ID Muestra",
        m.nombre_muestra      AS "Nombre Muestra",
        tm.nombre             AS "Tipo de Muestra",
        m.pertenece_a         AS "Pertenece A",
        m.persona_recolecto   AS "Recolectado por",
        m.fecha_recoleccion   AS "Fecha Recolección",
        r.id_unico            AS "ID Recepción",
        r.funcionario_entrega AS "Funcionario Entrega",
        r.fecha_roma          AS "Fecha ROMA",
        r.fecha_erce          AS "Fecha ERCE",
        m.estudio_pericial_solicitado AS "Estudio Solicitado",
        m.codigo_idif_manual  AS "Código IDIF",
        m.detalle             AS "Detalle",
        u.nombre              AS "Registrado por",
        m.created_at          AS "Fecha Registro"
      FROM muestras m
      JOIN recepciones r ON m.recepcion_id = r.id
      LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
        AND r.usuario_id = ${parseInt(usuario_id)}
      ORDER BY m.created_at DESC
    `
  } else if (desde && hasta) {
    rows = await sql`
      SELECT
        m.id_unico            AS "ID Muestra",
        m.nombre_muestra      AS "Nombre Muestra",
        tm.nombre             AS "Tipo de Muestra",
        m.pertenece_a         AS "Pertenece A",
        m.persona_recolecto   AS "Recolectado por",
        m.fecha_recoleccion   AS "Fecha Recolección",
        r.id_unico            AS "ID Recepción",
        r.funcionario_entrega AS "Funcionario Entrega",
        r.fecha_roma          AS "Fecha ROMA",
        r.fecha_erce          AS "Fecha ERCE",
        m.estudio_pericial_solicitado AS "Estudio Solicitado",
        m.codigo_idif_manual  AS "Código IDIF",
        m.detalle             AS "Detalle",
        u.nombre              AS "Registrado por",
        m.created_at          AS "Fecha Registro"
      FROM muestras m
      JOIN recepciones r ON m.recepcion_id = r.id
      LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
      ORDER BY m.created_at DESC
    `
  } else {
    rows = await sql`
      SELECT
        m.id_unico            AS "ID Muestra",
        m.nombre_muestra      AS "Nombre Muestra",
        tm.nombre             AS "Tipo de Muestra",
        m.pertenece_a         AS "Pertenece A",
        m.persona_recolecto   AS "Recolectado por",
        m.fecha_recoleccion   AS "Fecha Recolección",
        r.id_unico            AS "ID Recepción",
        r.funcionario_entrega AS "Funcionario Entrega",
        r.fecha_roma          AS "Fecha ROMA",
        r.fecha_erce          AS "Fecha ERCE",
        m.estudio_pericial_solicitado AS "Estudio Solicitado",
        m.codigo_idif_manual  AS "Código IDIF",
        m.detalle             AS "Detalle",
        u.nombre              AS "Registrado por",
        m.created_at          AS "Fecha Registro"
      FROM muestras m
      JOIN recepciones r ON m.recepcion_id = r.id
      LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 500
    `
  }

  return NextResponse.json({ ok: true, data: rows })
}
