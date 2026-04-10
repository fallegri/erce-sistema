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
 
  const dateFilter = !!(desde && hasta)
  const userFilter = usuario_id !== 'todos'
  const effectiveUserId = session.rol === 'ERCE' ? session.id : (userFilter ? parseInt(usuario_id) : null)
 
  try {
 
    // ── Listado de muestras ───────────────────────────────────────────────────
    if (tipo === 'muestras') {
      let rows
      if (dateFilter && effectiveUserId) {
        rows = await sql`
          SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
            tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
            m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recoleccion",
            m.detalle AS "Detalle", m.estudio_pericial_solicitado AS "Estudio Solicitado",
            m.codigo_idif_manual AS "Codigo IDIF",
            r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
            r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE",
            r.ciudad AS "Ciudad", r.caso_abierto AS "Caso Abierto",
            u.nombre AS "Registrado por", m.created_at AS "Fecha Registro",
            COALESCE(m.updated_at, m.created_at) AS "Ultima Actualizacion"
          FROM muestras m
          JOIN recepciones r ON m.recepcion_id = r.id
          LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            AND r.usuario_id = ${effectiveUserId}
          ORDER BY m.created_at DESC`
      } else if (dateFilter) {
        rows = await sql`
          SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
            tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
            m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recoleccion",
            m.detalle AS "Detalle", m.estudio_pericial_solicitado AS "Estudio Solicitado",
            m.codigo_idif_manual AS "Codigo IDIF",
            r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
            r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE",
            r.ciudad AS "Ciudad", r.caso_abierto AS "Caso Abierto",
            u.nombre AS "Registrado por", m.created_at AS "Fecha Registro",
            COALESCE(m.updated_at, m.created_at) AS "Ultima Actualizacion"
          FROM muestras m
          JOIN recepciones r ON m.recepcion_id = r.id
          LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
          ORDER BY m.created_at DESC`
      } else {
        rows = await sql`
          SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
            tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
            m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recoleccion",
            m.detalle AS "Detalle", m.estudio_pericial_solicitado AS "Estudio Solicitado",
            m.codigo_idif_manual AS "Codigo IDIF",
            r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
            r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE",
            r.ciudad AS "Ciudad", r.caso_abierto AS "Caso Abierto",
            u.nombre AS "Registrado por", m.created_at AS "Fecha Registro",
            COALESCE(m.updated_at, m.created_at) AS "Ultima Actualizacion"
          FROM muestras m
          JOIN recepciones r ON m.recepcion_id = r.id
          LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          ORDER BY m.created_at DESC LIMIT 500`
      }
      return NextResponse.json({ ok: true, data: rows })
    }
 
    // ── Por tipo de muestra ───────────────────────────────────────────────────
    if (tipo === 'por_tipo_muestra') {
      const rows = dateFilter
        ? await sql`
            SELECT tm.nombre AS "Tipo de Muestra",
              COUNT(m.id)::int AS "Cantidad",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio Pericial",
              COUNT(CASE WHEN r.caso_abierto THEN 1 END)::int AS "Casos Abiertos"
            FROM muestras m
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            JOIN recepciones r ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY tm.nombre ORDER BY "Cantidad" DESC`
        : await sql`
            SELECT tm.nombre AS "Tipo de Muestra",
              COUNT(m.id)::int AS "Cantidad",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio Pericial",
              COUNT(CASE WHEN r.caso_abierto THEN 1 END)::int AS "Casos Abiertos"
            FROM muestras m
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            JOIN recepciones r ON m.recepcion_id = r.id
            GROUP BY tm.nombre ORDER BY "Cantidad" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }
 
    // ── Por tipo de pericia ───────────────────────────────────────────────────
    if (tipo === 'por_tipo_pericia') {
      const rows = dateFilter
        ? await sql`
            SELECT te.nombre AS "Tipo de Estudio",
              COUNT(mte.muestra_id)::int AS "Cantidad de Muestras",
              COUNT(DISTINCT r.id)::int AS "N Recepciones",
              COUNT(DISTINCT r.ciudad)::int AS "Ciudades Involucradas",
              MIN(r.fecha_erce)::text AS "Primera ERCE",
              MAX(r.fecha_erce)::text AS "Ultima ERCE"
            FROM muestra_tipos_estudio mte
            JOIN tipos_estudio te ON mte.tipo_estudio_id = te.id
            JOIN muestras m ON mte.muestra_id = m.id
            JOIN recepciones r ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY te.nombre ORDER BY "Cantidad de Muestras" DESC`
        : await sql`
            SELECT te.nombre AS "Tipo de Estudio",
              COUNT(mte.muestra_id)::int AS "Cantidad de Muestras",
              COUNT(DISTINCT r.id)::int AS "N Recepciones",
              COUNT(DISTINCT r.ciudad)::int AS "Ciudades Involucradas",
              MIN(r.fecha_erce)::text AS "Primera ERCE",
              MAX(r.fecha_erce)::text AS "Ultima ERCE"
            FROM muestra_tipos_estudio mte
            JOIN tipos_estudio te ON mte.tipo_estudio_id = te.id
            JOIN muestras m ON mte.muestra_id = m.id
            JOIN recepciones r ON m.recepcion_id = r.id
            GROUP BY te.nombre ORDER BY "Cantidad de Muestras" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }
 
    // ── Casos abiertos ────────────────────────────────────────────────────────
    if (tipo === 'casos_abiertos') {
      const rows = dateFilter
        ? await sql`
            SELECT r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
              r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE",
              r.ciudad AS "Ciudad",
              COUNT(m.id)::int AS "N Muestras",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio",
              u.nombre AS "Registrado por", r.created_at AS "Fecha Registro"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.caso_abierto = true AND r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY r.id, u.nombre ORDER BY r.fecha_erce DESC`
        : await sql`
            SELECT r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
              r.fecha_roma AS "Fecha ROMA", r.fecha_erce AS "Fecha ERCE",
              r.ciudad AS "Ciudad",
              COUNT(m.id)::int AS "N Muestras",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio",
              u.nombre AS "Registrado por", r.created_at AS "Fecha Registro"
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
        ? await sql`
            SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
              tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
              m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recoleccion",
              m.detalle AS "Detalle",
              r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
              r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
              r.caso_abierto AS "Caso Abierto", u.nombre AS "Registrado por"
            FROM muestras m
            JOIN recepciones r ON m.recepcion_id = r.id
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE m.estudio_pericial_solicitado = false
              AND r.fecha_erce BETWEEN ${desde} AND ${hasta}
            ORDER BY r.fecha_erce DESC`
        : await sql`
            SELECT m.id_unico AS "ID Muestra", m.nombre_muestra AS "Nombre Muestra",
              tm.nombre AS "Tipo de Muestra", m.pertenece_a AS "Pertenece A",
              m.persona_recolecto AS "Recolectado por", m.fecha_recoleccion AS "Fecha Recoleccion",
              m.detalle AS "Detalle",
              r.id_unico AS "ID Recepcion", r.funcionario_entrega AS "Funcionario Entrega",
              r.fecha_erce AS "Fecha ERCE", r.ciudad AS "Ciudad",
              r.caso_abierto AS "Caso Abierto", u.nombre AS "Registrado por"
            FROM muestras m
            JOIN recepciones r ON m.recepcion_id = r.id
            LEFT JOIN tipos_muestra tm ON m.tipo_muestra_id = tm.id
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE m.estudio_pericial_solicitado = false
            ORDER BY r.fecha_erce DESC LIMIT 500`
      return NextResponse.json({ ok: true, data: rows })
    }
 
    // ── Por funcionario de entrega ────────────────────────────────────────────
    if (tipo === 'por_entrega') {
      const rows = dateFilter
        ? await sql`
            SELECT r.funcionario_entrega AS "Funcionario que Entrega",
              COUNT(DISTINCT r.id)::int AS "N Recepciones",
              COUNT(m.id)::int AS "N Muestras",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio Pericial",
              COUNT(CASE WHEN r.caso_abierto THEN 1 END)::int AS "Casos Abiertos",
              MIN(r.fecha_erce)::text AS "Primera ERCE",
              MAX(r.fecha_erce)::text AS "Ultima ERCE"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY r.funcionario_entrega ORDER BY "N Recepciones" DESC`
        : await sql`
            SELECT r.funcionario_entrega AS "Funcionario que Entrega",
              COUNT(DISTINCT r.id)::int AS "N Recepciones",
              COUNT(m.id)::int AS "N Muestras",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio Pericial",
              COUNT(CASE WHEN r.caso_abierto THEN 1 END)::int AS "Casos Abiertos",
              MIN(r.fecha_erce)::text AS "Primera ERCE",
              MAX(r.fecha_erce)::text AS "Ultima ERCE"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            GROUP BY r.funcionario_entrega ORDER BY "N Recepciones" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }
 
    // ── Por ciudad ────────────────────────────────────────────────────────────
    if (tipo === 'por_ciudad') {
      const rows = dateFilter
        ? await sql`
            SELECT r.ciudad AS "Ciudad",
              COUNT(DISTINCT r.id)::int AS "N Recepciones",
              COUNT(m.id)::int AS "N Muestras",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio Pericial",
              COUNT(CASE WHEN r.caso_abierto THEN 1 END)::int AS "Casos Abiertos",
              COUNT(DISTINCT r.funcionario_entrega)::int AS "Funcionarios Distintos",
              COUNT(DISTINCT r.usuario_id)::int AS "Usuarios ERCE",
              MIN(r.fecha_erce)::text AS "Primera ERCE",
              MAX(r.fecha_erce)::text AS "Ultima ERCE"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            WHERE r.fecha_erce BETWEEN ${desde} AND ${hasta}
            GROUP BY r.ciudad ORDER BY "N Recepciones" DESC`
        : await sql`
            SELECT r.ciudad AS "Ciudad",
              COUNT(DISTINCT r.id)::int AS "N Recepciones",
              COUNT(m.id)::int AS "N Muestras",
              COUNT(CASE WHEN m.estudio_pericial_solicitado THEN 1 END)::int AS "Con Estudio Pericial",
              COUNT(CASE WHEN r.caso_abierto THEN 1 END)::int AS "Casos Abiertos",
              COUNT(DISTINCT r.funcionario_entrega)::int AS "Funcionarios Distintos",
              COUNT(DISTINCT r.usuario_id)::int AS "Usuarios ERCE",
              MIN(r.fecha_erce)::text AS "Primera ERCE",
              MAX(r.fecha_erce)::text AS "Ultima ERCE"
            FROM recepciones r
            LEFT JOIN muestras m ON m.recepcion_id = r.id
            GROUP BY r.ciudad ORDER BY "N Recepciones" DESC`
      return NextResponse.json({ ok: true, data: rows })
    }
 
    return NextResponse.json({ ok: false, error: 'Tipo de reporte no válido.' }, { status: 400 })
 
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error al generar reporte.' }, { status: 500 })
  }
}