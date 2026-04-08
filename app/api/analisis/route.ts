import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { validarCoherencia } from '@/lib/gemini'
import { z } from 'zod'

const schema = z.object({
  tipoMuestraNombre: z.string().min(1).max(200),
  tiposEstudioNombres: z.array(z.string().max(200)).max(20),
  nombreMuestra: z.string().min(1).max(300),
  detalle: z.string().max(2000).optional().default(''),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
    }
    const { tipoMuestraNombre, tiposEstudioNombres, nombreMuestra, detalle } = parsed.data
    const resultado = await validarCoherencia(tipoMuestraNombre, tiposEstudioNombres, nombreMuestra, detalle)
    return NextResponse.json({ ok: true, data: resultado })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error en validación de IA.' }, { status: 500 })
  }
}
