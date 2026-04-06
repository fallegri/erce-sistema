import { GoogleGenerativeAI } from '@google/generative-ai'
import { MuestraForm, AnalisisIA } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function analizarMuestra(
  muestra: MuestraForm,
  tipoMuestraNombre: string,
  tiposEstudioNombres: string[]
): Promise<AnalisisIA> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
Eres un asistente forense especializado en análisis de muestras periciales. 
Analiza la siguiente muestra y devuelve ÚNICAMENTE un JSON válido con este esquema exacto:

{
  "resumen": "string - análisis conciso en 2-3 oraciones",
  "alertas": ["array de strings - posibles inconsistencias o puntos críticos a verificar"],
  "recomendaciones": ["array de strings - pasos de preservación y análisis recomendados"],
  "nivel_prioridad": "BAJO|MEDIO|ALTO|CRITICO"
}

DATOS DE LA MUESTRA:
- Nombre: ${muestra.nombre_muestra}
- Tipo de muestra: ${tipoMuestraNombre}
- Pertenece a: ${muestra.pertenece_a}
- Persona que recolectó: ${muestra.persona_recolecto}
- Fecha de recolección: ${muestra.fecha_recoleccion}
- Detalle adicional: ${muestra.detalle || 'Sin detalle'}
- Estudios solicitados: ${tiposEstudioNombres.length > 0 ? tiposEstudioNombres.join(', ') : 'Ninguno'}
- Código IDIF: ${muestra.codigo_idif_manual || 'No asignado'}

Responde SOLO con el JSON, sin texto adicional ni bloques de código markdown.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    
    // Limpiar posibles backticks de markdown
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AnalisisIA
  } catch (error) {
    console.error('Error en análisis Gemini:', error)
    return {
      resumen: 'No se pudo completar el análisis automático. Revise manualmente.',
      alertas: ['Error al contactar el servicio de IA'],
      recomendaciones: ['Proceder con protocolo estándar de análisis manual'],
      nivel_prioridad: 'MEDIO'
    }
  }
}
