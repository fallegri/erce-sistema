import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno.')
}

export const sql = neon(process.env.DATABASE_URL)

// ─── Inicialización del esquema ──────────────────────────────────────────────
export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            SERIAL PRIMARY KEY,
      nombre        TEXT NOT NULL,
      ci            TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol           TEXT NOT NULL DEFAULT 'ERCE' CHECK (rol IN ('ADMIN','ERCE')),
      estado        TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ACTIVO','BLOQUEADO')),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS tipos_muestra (
      id     SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      activo BOOLEAN DEFAULT TRUE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS tipos_estudio (
      id     SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      activo BOOLEAN DEFAULT TRUE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS recepciones (
      id                 SERIAL PRIMARY KEY,
      id_unico           TEXT NOT NULL UNIQUE,
      funcionario_entrega TEXT NOT NULL,
      fecha_roma         DATE NOT NULL,
      fecha_erce         DATE NOT NULL,
      caso_abierto       BOOLEAN DEFAULT TRUE,
      usuario_id         INTEGER REFERENCES usuarios(id),
      created_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS muestras (
      id                        SERIAL PRIMARY KEY,
      id_unico                  TEXT NOT NULL UNIQUE,
      recepcion_id              INTEGER NOT NULL REFERENCES recepciones(id) ON DELETE CASCADE,
      persona_recolecto         TEXT NOT NULL,
      fecha_recoleccion         DATE NOT NULL,
      pertenece_a               TEXT NOT NULL,
      nombre_muestra            TEXT NOT NULL,
      detalle                   TEXT,
      tipo_muestra_id           INTEGER REFERENCES tipos_muestra(id),
      estudio_pericial_solicitado BOOLEAN DEFAULT FALSE,
      codigo_idif_manual        TEXT,
      analisis_ia               TEXT,
      created_at                TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS muestra_tipos_estudio (
      muestra_id      INTEGER NOT NULL REFERENCES muestras(id) ON DELETE CASCADE,
      tipo_estudio_id INTEGER NOT NULL REFERENCES tipos_estudio(id),
      PRIMARY KEY (muestra_id, tipo_estudio_id)
    )
  `

  // Seed datos maestros si no existen
  await sql`
    INSERT INTO tipos_muestra (nombre) VALUES
      ('Sangre'),('Suelo'),('Fibra'),('Cabello'),('Huella dactilar'),
      ('Tejido biológico'),('Líquido biológico'),('Documento'),('Objeto físico'),('Otro')
    ON CONFLICT (nombre) DO NOTHING
  `

  await sql`
    INSERT INTO tipos_estudio (nombre) VALUES
      ('Análisis toxicológico'),('ADN / Genética forense'),('Balística'),
      ('Grafología'),('Dactiloscopia'),('Serología'),('Entomología forense'),
      ('Análisis químico'),('Documentología')
    ON CONFLICT (nombre) DO NOTHING
  `
}
