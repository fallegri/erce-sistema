import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') ?? 'muestras'
  const desde = searchParams.get('desde') ?? ''
  const hasta = searchParams.get('hasta') ?? ''
  const usuario_id = searchParams.get('usuario_id') ?? 'todos'

  const dateFilter = desde && hasta
  const userFilter = usuario_id !== 'todos'

  try {
    // ── Reporte principal: listado de muestras ────────────────────────────────
    if (tipo === 'muestras') {
      let rows
      if (dateFilter && userFilter) {
        rows = await sql`
          SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
            tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
            m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recolección",
            r.id_unico AS "ID Recepción", r.funcionario_entrega AS "Funcionario Entrega",
            r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
            m.estudio_pericial_solicitado AS "Estudio Solicitado",
            m.codigo_idif_manual AS "Código IDIF", m.detalle AS "Detalle",
            u.nombre AS "Registrado por", m.created_at AS "Fecha Registro"
          FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
          LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta} AND r.usuario_id = ${parseInt(usuario_id)}
          ORDER BY m.created_at DESC`
      } else if (dateFilter) {
        rows = await sql`
          SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
            tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
            m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recolección",
            r.id_unico AS "ID Recepción", r.funcionario_entrega AS "Funcionario Entrega",
            r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
            m.estudio_pericial_solicitado AS "Estudio Solicitado",
            m.codigo_idif_manual AS "Código IDIF", m.detalle AS "Detalle",
            u.nombre AS "Registrado por", m.created_at AS "Fecha Registro"
          FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
          LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
          ORDER BY m.created_at DESC`
      } else {
        rows = await sql`
          SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
            tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
            m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recolección",
            r.id_unico AS "ID Recepción", r.funcionario_entrega AS "Funcionario Entrega",
            r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
            m.estudio_pericial_solicitado AS "Estudio Solicitado",
            m.codigo_idif_manual AS "Código IDIF", m.detalle AS "Detalle",
            u.nombre AS "Registrado por", m.created_at AS "Fecha Registro"
          FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
          LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          ORDER BY m.created_at DESC LIMIT 500`
      }
      return NextResponse.json({ ok: true, data: rows })
    }

    // ── Por tipo de muestra ───────────────────────────────────────────────────
    if (tipo === 'por_tipo_muestra') {
      const rows = dateFilter
        ? await sql`SELECT tm.nombre AS "Tipo de Muestra", COUNT(m.id)::int AS "Cantidad"
            FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY tm.nombre ORDER BY "Cantidad" DESC`
        : await sql`SELECT tm.nombre AS "Tipo de Muestra", COUNT(m.id)::int AS "Cantidad"
            FROM muestras m LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            GROUP BY tm.nombre ORDER BY "Cantidad" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }

    // ── Por tipo de pericia (estudio) ─────────────────────────────────────────
    if (tipo === 'por_tipo_pericia') {
      const rows = dateFilter
        ? await sql`SELECT te.nombre AS "Tipo de Estudio", COUNT(mte.muestra_id)::int AS "Cantidad"
            FROM muestra_tipos_estudio mte
            JOIN tipos_estudio te ON mte.tipo_estudio_id = te.id
            JOIN muestras m ON mte.muestra_id = m.id
            JOIN recepciones r ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY te.nombre ORDER BY "Cantidad" DESC`
        : await sql`SELECT te.nombre AS "Tipo de Estudio", COUNT(mte.muestra_id)::int AS "Cantidad"
            FROM muestra_tipos_estudio mte
            JOIN tipos_estudio te ON mte.tipo_estudio_id = te.id
            GROUP BY te.nombre ORDER BY "Cantidad" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }

    // ── Casos abiertos ────────────────────────────────────────────────────────
    if (tipo === 'casos_abiertos') {
      const rows = dateFilter
        ? await sql`SELECT r.id_unico AS "ID Recepción", r.funcionario_entrega AS "Funcionario",
            r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
            COUNT(m.id)::int AS "N° Muestras", u.nombre AS "Registrado por"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.caso_abierto = true AND r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY r.id, u.nombre ORDER BY r.fecha_erce DESC`
        : await sql`SELECT r.id_unico AS "ID Recepción", r.funcionario_entrega AS "Funcionario",
            r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
            COUNT(m.id)::int AS "N° Muestras", u.nombre AS "Registrado por"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.caso_abierto = true
            GROUP BY r.id, u.nombre ORDER BY r.fecha_erce DESC`
      return NextResponse.json({ ok: true, data: rows })
    }

    // ── Sin requerimiento pericial ────────────────────────────────────────────
    if (tipo === 'sin_pericia') {
      const rows = dateFilter
        ? await sql`SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre",
            tm.nombre AS "Tipo", m.pertenece_a AS "Pertenece A",
            r.id_unico AS "ID Recepción", r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad"
            FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            WHERE m.estudio_pericial_solicitado = false AND r.fecha_erce BETWEEN ${desde} AND ${hasta}
            ORDER BY r.fecha_erce DESC`
        : await sql`SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre",
            tm.nombre AS "Tipo", m.pertenece_a AS "Pertenece A",
            r.id_unico AS "ID Recepción", r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad"
            FROM muestras m JOIN recepciones r ON m.recepcion_id = r.id
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            WHERE m.estudio_pericial_solicitado = false
            ORDER BY r.fecha_erce DESC`
      return NextResponse.json({ ok: true, data: rows })
    }

    // ── Por funcionario que entrega ───────────────────────────────────────────
    if (tipo === 'por_entrega') {
      const rows = dateFilter
        ? await sql`SELECT r.funcionario_entrega AS "Funcionario que entrega",
            COUNT(DISTINCT r.id)::int AS "N° Recepciones",
            COUNT(m.id)::int AS "N° Muestras"
            FROM recepciones r LEFT JOIN muestras m ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY r.funcionario_entrega ORDER BY "N° Recepciones" DESC`
        : await sql`SELECT r.funcionario_entrega AS "Funcionario que entrega",
            COUNT(DISTINCT r.id)::int AS "N° Recepciones",
            COUNT(m.id)::int AS "N° Muestras"
            FROM recepciones r LEFT JOIN muestras m ON m.recepcion_id = r.id
            GROUP BY r.funcionario_entrega ORDER BY "N° Recepciones" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }

    // ── Por ciudad ────────────────────────────────────────────────────────────
    if (tipo === 'por_ciudad') {
      const rows = dateFilter
        ? await sql`SELECT r.ciudad AS "Ciudad",
            COUNT(DISTINCT r.id)::int AS "N° Recepciones",
            COUNT(m.id)::int AS "N° Muestras"
            FROM recepciones r LEFT JOIN muestras m ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY r.ciudad ORDER BY "N° Recepciones" DESC`
        : await sql`SELECT r.ciudad AS "Ciudad",
            COUNT(DISTINCT r.id)::int AS "N° Recepciones",
            COUNT(m.id)::int AS "N° Muestras"
            FROM recepciones r LEFT JOIN muestras m ON m.recepcion_id = r.id
            GROUP BY r.ciudad ORDER BY "N° Recepciones" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }

    return NextResponse.json({ ok: false, error: 'Tipo de reporte no válido.' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al generar reporte.' }, { status: 500 })
  }
}
