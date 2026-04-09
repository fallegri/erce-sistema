import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno.')
}

export const sql = neon(process.env.DATABASE_URL)

export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            SERIAL PRIMARY KEY,
      nombre        TEXT NOT NULL,
      ci            TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      ciudad        TEXT NOT NULL DEFAULT '',
      rol           TEXT NOT NULL DEFAULT 'ERCE' CHECK (rol IN ('ADMIN','ERCE')),
      estado        TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ACTIVO','BLOQUEADO')),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )`
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudad TEXT NOT NULL DEFAULT ''`

  await sql`
    CREATE TABLE IF NOT EXISTS tipos_muestra (
      id     SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      activo BOOLEAN DEFAULT TRUE
    )`

  await sql`
    CREATE TABLE IF NOT EXISTS tipos_estudio (
      id     SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      activo BOOLEAN DEFAULT TRUE
    )`

  await sql`
    CREATE TABLE IF NOT EXISTS recepciones (
      id                  SERIAL PRIMARY KEY,
      id_unico            TEXT NOT NULL UNIQUE,
      funcionario_entrega TEXT NOT NULL,
      fecha_roma          DATE NOT NULL,
      fecha_erce          DATE NOT NULL,
      caso_abierto        BOOLEAN DEFAULT TRUE,
      ciudad              TEXT NOT NULL DEFAULT '',
      usuario_id          INTEGER REFERENCES usuarios(id),
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )`
  await sql`ALTER TABLE recepciones ADD COLUMN IF NOT EXISTS ciudad TEXT NOT NULL DEFAULT ''`

  await sql`
    CREATE TABLE IF NOT EXISTS muestras (
      id                          SERIAL PRIMARY KEY,
      id_unico                    TEXT NOT NULL UNIQUE,
      recepcion_id                INTEGER NOT NULL REFERENCES recepciones(id) ON DELETE CASCADE,
      persona_recolecto           TEXT NOT NULL,
      fecha_recoleccion           DATE NOT NULL,
      pertenece_a                 TEXT NOT NULL,
      nombre_muestra              TEXT NOT NULL,
      detalle                     TEXT,
      tipo_muestra_id             INTEGER REFERENCES tipos_muestra(id),
      estudio_pericial_solicitado BOOLEAN DEFAULT FALSE,
      codigo_idif_manual          TEXT,
      analisis_ia                 TEXT,
      alerta_ia                   TEXT,
      created_at                  TIMESTAMPTZ DEFAULT NOW(),
      updated_at                  TIMESTAMPTZ DEFAULT NOW()
    )`
  await sql`ALTER TABLE muestras ADD COLUMN IF NOT EXISTS alerta_ia TEXT`
  await sql`ALTER TABLE muestras ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`

  await sql`
    CREATE TABLE IF NOT EXISTS muestra_tipos_estudio (
      muestra_id      INTEGER NOT NULL REFERENCES muestras(id) ON DELETE CASCADE,
      tipo_estudio_id INTEGER NOT NULL REFERENCES tipos_estudio(id),
      PRIMARY KEY (muestra_id, tipo_estudio_id)
    )`

  await sql`
    CREATE TABLE IF NOT EXISTS solicitudes_edicion (
      id            SERIAL PRIMARY KEY,
      muestra_id    INTEGER NOT NULL REFERENCES muestras(id) ON DELETE CASCADE,
      usuario_id    INTEGER NOT NULL REFERENCES usuarios(id),
      datos_nuevos  JSONB NOT NULL,
      motivo        TEXT NOT NULL,
      estado        TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
      admin_id      INTEGER REFERENCES usuarios(id),
      admin_nota    TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      resuelto_at   TIMESTAMPTZ
    )`

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          SERIAL PRIMARY KEY,
      usuario_id  INTEGER REFERENCES usuarios(id),
      accion      TEXT NOT NULL,
      entidad     TEXT,
      entidad_id  TEXT,
      ip          TEXT,
      user_agent  TEXT,
      detalle     JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )`

  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id         SERIAL PRIMARY KEY,
      ip         TEXT NOT NULL,
      email      TEXT NOT NULL,
      success    BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`

  await sql`CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip, created_at)`

  await sql`
    INSERT INTO tipos_muestra (nombre) VALUES
      ('Sangre'),('Suelo'),('Fibra'),('Cabello'),('Huella dactilar'),
      ('Tejido biologico'),('Liquido biologico'),('Documento'),('Objeto fisico'),('Otro')
    ON CONFLICT (nombre) DO NOTHING`

  await sql`
    INSERT INTO tipos_estudio (nombre) VALUES
      ('Analisis toxicologico'),('ADN / Genetica forense'),('Balistica'),
      ('Grafologia'),('Dactiloscopia'),('Serologia'),('Entomologia forense'),
      ('Analisis quimico'),('Documentologia')
    ON CONFLICT (nombre) DO NOTHING`
}
