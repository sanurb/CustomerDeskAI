# Guía de Configuración de Migraciones de Base de Datos

## Resumen

Esta guía explica cómo reproducir la configuración de migración de Drizzle ORM para CustomerDeskAI, integrando Better-Auth con la base de datos PostgreSQL multi-tenant de Nile.

## ¿Qué Cambió?

La migración establece la base de datos para Better-Auth + multi-tenancy de Nile:

**Archivos Modificados/Creados:**
- `packages/db/src/schema/auth.ts` - Tablas de Better-Auth (users, session, account, verification)
- `packages/db/src/schema/nile.ts` - Tablas de tenant de Nile (tenants, tenant_users, invitations)
- `packages/db/src/schema/todo.ts` - Tabla de ejemplo todo
- `packages/db/src/migrations/0000_legal_aqueduct.sql` - SQL de migración generado
- `packages/db/src/migrations/meta/_journal.json` - Journal de migraciones de Drizzle
- `packages/db/src/migrations/meta/0000_snapshot.json` - Snapshot del esquema de Drizzle
- `packages/db/drizzle.config.ts` - Configuración de Drizzle Kit
- `packages/db/src/config.ts` - Configuración de base de datos con validación Zod
- `packages/db/src/index.ts` - Inicialización del cliente de base de datos

## Precondiciones

### 1. Conexión a NileDB
- Tienes una cadena de conexión a base de datos NileDB (Postgres)
- Formato de cadena de conexión: `postgres://[tenant_id]:[password]@[host]:[port]/[database]`
- Configurada como variable de entorno `DATABASE_URL` en `packages/db/.env`

### 2. Tabla `tenants` Pre-existente
**CRÍTICO:** Nile crea la tabla `tenants` automáticamente. Tu migración NO DEBE intentar `CREATE TABLE tenants`.

En su lugar, la migración hará:
- `ALTER TABLE tenants` para agregar columnas: `slug`, `logo`, `metadata`
- `CREATE INDEX` en `slug` (no único)

### 3. Configuración del Repositorio
- Monorepo Turborepo con workspaces de pnpm
- Drizzle ORM instalado (`drizzle-orm`, `drizzle-kit`)
- Paquete `@CustomerDeskAI/db` existe en `packages/db/`

## Guía Paso a Paso

### Paso 1: Configurar Conexión a la Base de Datos

Crear `packages/db/.env`:
```bash
DATABASE_URL=postgres://tu-tenant-id:tu-password@host:puerto/database
NODE_ENV=development
```

**NO confirmes credenciales reales.** Usa `.env.local` o archivos específicos del entorno.

### Paso 2: Definir Esquema de Base de Datos

Crear tres archivos de esquema en `packages/db/src/schema/`:

#### A. `auth.ts` - Tablas de Better-Auth
```typescript
// Tablas de Better-Auth adaptadas para Nile basado en UUID
// Tablas: users, session, account, verification
// Todos los IDs usan uuid.defaultRandom() en lugar de serial/cuid
// SIN restricciones de clave foránea (solo índices)
```

Puntos clave:
- `users.id` es `uuid` PRIMARY KEY
- `session.userId` y `session.activeOrganizationId` son `uuid` (sin FK)
- `account.userId` es `uuid` (sin FK)
- Índices en todas las columnas de clave foránea

#### B. `nile.ts` - Tablas de Tenant de Nile
```typescript
// Tablas de multi-tenancy de Nile
// Tablas: tenants (solo referencia), tenant_users, invitations
// CRÍTICO: Claves primarias compuestas requeridas para tablas con scope de tenant
```

Puntos clave:
- Tabla `tenants`: referencia mínima (ya existe en la BD)
- `tenant_users`: PK compuesta `(tenant_id, user_id)`
- `invitations`: PK compuesta `(tenant_id, id)`
- Columnas `tenant_id` usan `uuid` (sin FK, solo índice)
- Columna `slug` en tenants es nullable, no única

#### C. `todo.ts` - Tabla de Ejemplo (Opcional)
```typescript
// Tabla todo simple para demostración
export const todo = pgTable("todo", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
});
```

#### D. `index.ts` - Exportar Todos los Esquemas
```typescript
export * from "./auth";
export * from "./nile";
export * from "./todo";
```

### Paso 3: Configurar Drizzle Kit

Crear `packages/db/drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### Paso 4: Generar Migración

**Opción A: Ejecutar desde la raíz del workspace (puede fallar vía turbo)**
```bash
pnpm run db:generate
```

**Opción B: Ejecutar directamente en el paquete db (confiable)**
```bash
cd packages/db
pnpm run db:generate
```

Salida esperada: Archivo de migración creado en `packages/db/src/migrations/0000_legal_aqueduct.sql`

**CRÍTICO:** Verificar que la migración NO contenga `CREATE TABLE tenants`. Si lo hace, editar manualmente:
```sql
-- INCORRECTO (fallará):
CREATE TABLE "tenants" (...);

-- CORRECTO:
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "metadata" text;
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");
```

### Paso 5: Aplicar Migración

**Opción A: Usando Drizzle Kit migrate (recomendado)**
```bash
cd packages/db
DATABASE_URL="postgres://..." pnpm run db:migrate
```

**Opción B: Ejecución manual con psql**
```bash
PGPASSWORD="tu-password" psql \
  -h tu-host \
  -p 5432 \
  -U tu-tenant-id \
  -d tu-database \
  -f packages/db/src/migrations/0000_legal_aqueduct.sql
```

### Paso 6: Verificar Éxito de la Migración

Conectar a tu base de datos:
```bash
PGPASSWORD="tu-password" psql \
  -h tu-host \
  -p 5432 \
  -U tu-tenant-id \
  -d tu-database
```

Ejecutar consultas de verificación:
```sql
-- Listar todas las tablas
\dt

-- Salida esperada:
-- account, invitations, session, tenant_users, tenants, todo, users, verification

-- Verificar estructura de tabla tenants
\d tenants

-- Columnas esperadas: id, name, created, slug, logo, metadata
-- Índice esperado: tenants_slug_idx (no único)

-- Verificar PK compuesta de tenant_users
\d tenant_users

-- PK esperada: tenant_users_tenant_id_user_id_pk (tenant_id, user_id)

-- Verificar PK compuesta de invitations
\d invitations

-- PK esperada: invitations_tenant_id_id_pk (tenant_id, id)
```

### Paso 7: Ejecutar Verificaciones de Calidad

```bash
# Desde la raíz del workspace
npx ultracite check
pnpm -w typecheck
```

Todas las verificaciones deben pasar sin errores.

## Resumen del Contenido de la Migración

La migración `0000_legal_aqueduct.sql` realiza:

### Tablas Creadas
1. **`users`** - Usuarios de autenticación basados en UUID
   - PK: `id` (uuid)
   - Unique: `email`

2. **`session`** - Sesiones de usuario con contexto de tenant
   - PK: `id` (uuid)
   - Unique: `token`
   - Índices: `user_id`, `active_organization_id`

3. **`account`** - Cuentas OAuth/credenciales
   - PK: `id` (uuid)
   - Índice: `user_id`

4. **`verification`** - Verificación de email/teléfono
   - PK: `id` (uuid)
   - Índice: `identifier`

5. **`tenant_users`** - Tabla de unión de membresía de tenant
   - PK compuesta: `(tenant_id, user_id)`
   - Columnas: `id` (uuid), `tenant_id`, `user_id`, `roles[]`, `created`
   - Índices: `tenant_id`, `user_id`, compuesto `(tenant_id, user_id)`

6. **`invitations`** - Invitaciones pendientes de tenant
   - PK compuesta: `(tenant_id, id)`
   - Columnas: `id` (uuid), `tenant_id`, `email`, `roles[]`, `status`, `expires_at`, `inviter_id`
   - Índices: `tenant_id`, `email`

7. **`todo`** - Tabla de aplicación de ejemplo
   - PK: `id` (serial)
   - Columnas: `text`, `completed`

### Tablas Alteradas
1. **`tenants`** (tabla pre-existente de Nile)
   - Agregado: `slug` (text, nullable)
   - Agregado: `logo` (text, nullable)
   - Agregado: `metadata` (text, nullable)
   - Agregado: Índice no único en `slug`

## Crítico: Snapshots Meta de Drizzle

### ¿Qué Son los Snapshots Meta?

Drizzle Kit genera dos archivos de metadata en `packages/db/src/migrations/meta/`:
- `_journal.json` - Registro de historial de migraciones
- `0000_snapshot.json` - Snapshot completo del esquema

### Por Qué Importan

**Si eliminas o pierdes estos archivos:**
- Drizzle Kit pierde el registro de qué migraciones se han aplicado
- Intentará **regenerar declaraciones CREATE TABLE** para tablas existentes
- Esto causa fallos de migración: "table already exists"

### SÍ Confirmar Archivos Meta

```bash
git add packages/db/src/migrations/meta/
git commit -m "chore: add Drizzle migration metadata"
```

### NO Eliminar Archivos Meta

Si los archivos meta se pierden:
1. Restaurar del historial de git, O
2. Regenerar con `drizzle-kit introspect` (avanzado, puede perder SQL personalizado)

## Solución de Problemas

### Problema 1: La Tabla `tenants` Ya Existe

**Síntoma:**
```
ERROR: relation "tenants" already exists
```

**Causa:**
Drizzle generó `CREATE TABLE tenants` pero Nile ya creó esta tabla.

**Solución:**
Editar `packages/db/src/migrations/0000_legal_aqueduct.sql`:
```sql
-- Comentar o eliminar:
-- CREATE TABLE "tenants" (
--   "id" uuid PRIMARY KEY NOT NULL,
--   ...
-- );

-- Reemplazar con:
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "metadata" text;
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");
```

### Problema 2: `db:generate` Falla vía Turbo

**Síntoma:**
```bash
pnpm run db:generate
# Se cuelga o falla con error poco claro
```

**Causa:**
Turborepo puede no reenviar correctamente las variables de entorno o el directorio de trabajo.

**Solución:**
Ejecutar directamente dentro del paquete:
```bash
cd packages/db
pnpm run db:generate
```

### Problema 3: `DATABASE_URL` Faltante

**Síntoma:**
```
Error: DATABASE_URL environment variable is required
```

**Solución:**
Asegurar que `packages/db/.env` existe con cadena de conexión válida:
```bash
DATABASE_URL=postgres://tenant-id:password@host:puerto/database
```

### Problema 4: PK Compuesta No Aplicada

**Síntoma:**
Las tablas `tenant_users` o `invitations` no tienen claves primarias compuestas.

**Causa:**
Definición de esquema de Drizzle falta llamada a `primaryKey()`.

**Solución:**
Verificar que el esquema use este patrón:
```typescript
export const tenantUsers = pgTable(
  "tenant_users",
  { /* columnas */ },
  (table) => [
    primaryKey({ columns: [table.tenant_id, table.user_id] }),
  ]
);
```

### Problema 5: Índice de `slug` es Único

**Síntoma:**
`tenants_slug_idx` es un índice único, impidiendo slugs duplicados entre tenants.

**Causa:**
Esquema de Drizzle definió incorrectamente `slug` como `.unique()`.

**Solución:**
En `nile.ts`, asegurar:
```typescript
slug: text("slug"), // SIN .unique()
```

Regenerar migración:
```bash
cd packages/db
pnpm run db:generate
```

## Referencia de Comandos del Workspace

### Desde la Raíz del Workspace
```bash
# Generar migraciones (puede fallar vía turbo)
pnpm run db:generate

# Aplicar migraciones
pnpm run db:migrate

# Abrir Drizzle Studio
pnpm run db:studio

# Lint y typecheck
npx ultracite check
pnpm -w typecheck
```

### Desde `packages/db/`
```bash
# Generar migraciones (confiable)
pnpm run db:generate

# Aplicar migraciones
pnpm run db:migrate

# Abrir Drizzle Studio
pnpm run db:studio

# Iniciar Docker Compose Postgres (si usas BD local)
pnpm run db:start
pnpm run db:watch
pnpm run db:stop
pnpm run db:down
```

## Próximos Pasos

Después de una migración exitosa:
1. Implementar manejadores de servidor Better-Auth (`apps/server/src/index.ts`)
2. Configurar endpoints oRPC para operaciones de tenant
3. Configurar cliente de auth en frontend Next.js
4. Implementar middleware de contexto de tenant

**Esta guía cubre solo la migración de base de datos.** El routing y la integración de API se documentan por separado.
