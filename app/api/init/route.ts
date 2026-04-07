import { NextResponse } from 'next/server'
import { initSchema } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    await initSchema()

    const admins = await sql`SELECT id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1`
    if (admins.length === 0) {
      const hash = await hashPassword('Admin1234!')
      await sql`
        INSERT INTO usuarios (nombre, ci, email, password_hash, ciudad, rol, estado)
        VALUES ('Administrador ERCE', '00000000', 'admin@erce.gob.bo', ${hash}, 'La Paz', 'ADMIN', 'ACTIVO')
        ON CONFLICT (email) DO NOTHING
      `
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Base de datos inicializada correctamente.',
      admin_default: 'admin@erce.gob.bo / Admin1234! (cambiar inmediatamente)',
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
