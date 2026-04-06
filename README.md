# ERCE — Sistema de Registro y Trazabilidad de Muestras Periciales

Sistema web institucional para el registro, trazabilidad y análisis con IA de muestras periciales.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Estilos | Tailwind CSS |
| Base de datos | Neon (PostgreSQL serverless) |
| IA | Google Gemini 1.5 Flash |
| Despliegue | Vercel |
| Auth | JWT + bcrypt (cookies HttpOnly) |
| Estado | Zustand |
| QR | qrcode.react |
| Excel | xlsx (SheetJS) |

---

## Estructura del proyecto

```
erce/
├── app/
│   ├── (auth)/
│   │   ├── login/           → Inicio de sesión
│   │   └── solicitar-acceso/ → Registro de nuevos usuarios
│   ├── (dashboard)/
│   │   ├── recepcion/       → Módulo Maestro-Detalle (core)
│   │   ├── usuarios/        → Gestión de usuarios (solo ADMIN)
│   │   ├── parametros/      → CRUD tipos de muestra y estudio
│   │   └── reportes/        → Consultas + exportación Excel
│   └── api/
│       ├── auth/login        → POST login
│       ├── auth/register     → POST registro
│       ├── auth/logout       → POST logout
│       ├── recepciones       → GET/POST recepciones con muestras
│       ├── usuarios          → GET/PATCH gestión de usuarios
│       ├── parametros        → GET/POST/PATCH tipos maestros
│       ├── reportes          → GET filtrado para exportación
│       ├── analisis          → POST análisis Gemini por muestra
│       └── init              → GET inicialización del schema DB
├── components/
│   ├── forms/ModalMuestra   → Modal con lógica BDD + análisis IA
│   └── ui/
│       ├── Sidebar          → Navegación lateral oscura
│       └── ModalQR          → Visualización/impresión de QRs
├── lib/
│   ├── db.ts                → Conexión Neon + schema SQL
│   ├── auth.ts              → JWT, bcrypt, sesión
│   ├── gemini.ts            → Integración Google Gemini
│   └── store.ts             → Zustand (auth + carrito recepción)
└── types/index.ts           → Tipos TypeScript del sistema
```

---

## Configuración inicial

### 1. Clonar e instalar

```bash
git clone <repo>
cd erce
npm install
```

### 2. Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

```env
# Neon PostgreSQL — obtener de console.neon.tech
DATABASE_URL=postgresql://usuario:password@ep-xxx.us-east-1.aws.neon.tech/erce?sslmode=require

# JWT Secret — generar con: openssl rand -base64 32
JWT_SECRET=tu_secreto_seguro_aqui

# Google Gemini — obtener de aistudio.google.com
GEMINI_API_KEY=AIza...
```

### 3. Inicializar la base de datos

Con el proyecto corriendo, visita:
```
http://localhost:3000/api/init
```

Esto crea todas las tablas, seed de datos maestros y el admin por defecto:
- **Email:** `admin@erce.gob.bo`
- **Password:** `Admin1234!`
- ⚠️ **Cambia la contraseña inmediatamente.**

### 4. Desarrollo local

```bash
npm run dev
```

---

## Despliegue en Vercel

### Paso 1: Preparar Neon
1. Crea un proyecto en [console.neon.tech](https://console.neon.tech)
2. Crea una base de datos llamada `erce`
3. Copia la **Connection String** (incluye `?sslmode=require`)

### Paso 2: Preparar Gemini
1. Ve a [aistudio.google.com](https://aistudio.google.com)
2. Crea una API Key
3. Guarda la clave

### Paso 3: Deploy en Vercel
1. Sube el proyecto a GitHub
2. Importa el repo en [vercel.com](https://vercel.com)
3. En **Environment Variables**, agrega:
   - `DATABASE_URL` → tu connection string de Neon
   - `JWT_SECRET` → un string aleatorio seguro (mín. 32 chars)
   - `GEMINI_API_KEY` → tu clave de Gemini
4. Deploy

### Paso 4: Inicializar DB en producción
Visita `https://tu-dominio.vercel.app/api/init` una sola vez.

---

## Módulos y reglas BDD implementadas

### Feature 1 — Autenticación
- Usuario `PENDIENTE` → denegado con mensaje específico
- Admin aprueba → estado `ACTIVO`, rol `ERCE`

### Feature 2 — Validación de fechas (Maestro)
- `fecha_erce < fecha_roma` → botón deshabilitado + alerta roja en tiempo real

### Feature 3 — Lógica dinámica de muestras
- Switch `estudio_pericial_solicitado = FALSE` → campos ocultos del DOM
- Switch `= TRUE` → renderiza checkboxes de `TipoEstudio` + input `Código IDIF`

### Feature 4 — Persistencia y QR
- Transacción: crea `Recepcion` + todas las `Muestras` vinculadas
- Post-guardado: muestra un QR por muestra con `id_unico`, `fecha_erce`, `funcionario_entrega`

### Feature 5 — Exportación Excel
- Columnas ID y Código IDIF → tipo `string` (preserva ceros a la izquierda)
- Columnas de fechas → tipo `date` nativo de Excel

### Feature IA — Análisis Gemini
- Por cada muestra, antes de agregar al carrito, el usuario puede solicitar un análisis automático
- Gemini devuelve: resumen, alertas, recomendaciones y nivel de prioridad (BAJO/MEDIO/ALTO/CRÍTICO)
- El análisis se almacena junto a la muestra en la base de datos

---

## Roles de acceso

| Módulo | ERCE | ADMIN |
|--------|------|-------|
| Recepción | ✓ | ✓ |
| Reportes | ✓ | ✓ |
| Parámetros | ✓ | ✓ |
| Usuarios | ✗ | ✓ |

---

## Modelo de datos

```
usuarios
  id, nombre, ci, email, password_hash, rol, estado, created_at

recepciones
  id, id_unico, funcionario_entrega, fecha_roma, fecha_erce,
  caso_abierto, usuario_id → usuarios.id, created_at

muestras
  id, id_unico, recepcion_id → recepciones.id,
  persona_recolecto, fecha_recoleccion, pertenece_a,
  nombre_muestra, detalle, tipo_muestra_id → tipos_muestra.id,
  estudio_pericial_solicitado, codigo_idif_manual, analisis_ia, created_at

muestra_tipos_estudio
  muestra_id → muestras.id, tipo_estudio_id → tipos_estudio.id

tipos_muestra
  id, nombre, activo

tipos_estudio
  id, nombre, activo
```
