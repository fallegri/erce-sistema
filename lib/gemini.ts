import { GoogleGenerativeAI } from '@google/generative-ai'
import { MuestraForm } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface CoherenciaResult {
  coherente: boolean
  nivel_alerta: 'NINGUNA' | 'ADVERTENCIA' | 'CRITICA'
  mensaje: string
  sugerencias: string[]
}

// ── Validación automática de coherencia entre muestra y estudios ──────────────
export async function validarCoherencia(
  tipoMuestraNombre: string,
  tiposEstudioNombres: string[],
  nombreMuestra: string,
  detalle: string
): Promise<CoherenciaResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Eres un experto en criminalística y cadena de custodia pericial.
Analiza si existe coherencia entre el tipo de muestra y los estudios periciales solicitados.
Responde ÚNICAMENTE con un JSON válido sin markdown:

{
  "coherente": boolean,
  "nivel_alerta": "NINGUNA" | "ADVERTENCIA" | "CRITICA",
  "mensaje": "string - explicación concisa en español (máx 200 chars)",
  "sugerencias": ["array de correcciones sugeridas, vacío si es coherente"]
}

DATOS:
- Tipo de muestra: ${tipoMuestraNombre}
- Nombre/descripción: ${nombreMuestra}
- Detalle: ${detalle || 'Sin detalle'}
- Estudios solicitados: ${tiposEstudioNombres.length > 0 ? tiposEstudioNombres.join(', ') : 'Ninguno'}

Ejemplos de INCOHERENCIA CRITICA: pedir ADN en una muestra de Documento; pedir Balística en Cabello; pedir Grafología en Tejido biológico.
Ejemplos de ADVERTENCIA: pedir toxicología en huella dactilar (posible pero inusual); pedir serología en objeto físico sin contexto.
Si no hay estudios solicitados, responde coherente=true, nivel_alerta="NINGUNA".`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim().replace(/```json|```/g, '').trim()
    return JSON.parse(text) as CoherenciaResult
  } catch {
    return { coherente: true, nivel_alerta: 'NINGUNA', mensaje: '', sugerencias: [] }
  }
}
