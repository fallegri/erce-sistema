import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { analizarMuestra } from '@/lib/gemini'
import { MuestraForm } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })

  try {
    const { muestra, tipoMuestraNombre, tiposEstudioNombres } = await req.json() as {
      muestra: MuestraForm
      tipoMuestraNombre: string
      tiposEstudioNombres: string[]
    }

    const analisis = await analizarMuestra(muestra, tipoMuestraNombre, tiposEstudioNombres)
    return NextResponse.json({ ok: true, data: analisis })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: 'Error en análisis de IA.' }, { status: 500 })
  }
}
