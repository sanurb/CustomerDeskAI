# Database Migration Setup Guide

## Overview

This guide explains how to reproduce the Drizzle ORM migration setup for CustomerDeskAI, integrating Better-Auth with Nile's multi-tenant PostgreSQL database.

## What Changed?

The migration establishes the database foundation for Better-Auth + Nile multi-tenancy:

**Modified/Created Files:**
- `packages/db/src/schema/auth.ts` - Better-Auth tables (users, session, account, verification)
- `packages/db/src/schema/nile.ts` - Nile tenant tables (tenants, tenant_users, invitations)
- `packages/db/src/schema/todo.ts` - Example todo table
- `packages/db/src/migrations/0000_legal_aqueduct.sql` - Generated migration SQL
- `packages/db/src/migrations/meta/_journal.json` - Drizzle migration journal
- `packages/db/src/migrations/meta/0000_snapshot.json` - Drizzle schema snapshot
- `packages/db/drizzle.config.ts` - Drizzle Kit configuration
- `packages/db/src/config.ts` - Database configuration with Zod validation
- `packages/db/src/index.ts` - Database client initialization

## Preconditions

### 1. NileDB Connection
- You have a NileDB (Postgres) database connection string
- Connection string format: `postgres://[tenant_id]:[password]@[host]:[port]/[database]`
- Set as `DATABASE_URL` environment variable in `packages/db/.env`

### 2. Pre-existing `tenants` Table
**CRITICAL:** Nile creates the `tenants` table automatically. Your migration MUST NOT attempt to `CREATE TABLE tenants`.

Instead, the migration will:
- `ALTER TABLE tenants` to add columns: `slug`, `logo`, `metadata`
- `CREATE INDEX` on `slug` (non-unique)

### 3. Repository Setup
- Turborepo monorepo with pnpm workspaces
- Drizzle ORM installed (`drizzle-orm`, `drizzle-kit`)
- `@CustomerDeskAI/db` package exists at `packages/db/`

## Step-by-Step Guide

### Step 1: Configure Database Connection

Create `packages/db/.env`:
```bash
DATABASE_URL=postgres://your-tenant-id:your-password@host:port/database
NODE_ENV=development
```

**DO NOT commit real credentials.** Use `.env.local` or environment-specific files.

### Step 2: Define Database Schema

Create three schema files in `packages/db/src/schema/`:

#### A. `auth.ts` - Better-Auth Tables
```typescript
// Better-Auth tables adapted for UUID-based Nile
// Tables: users, session, account, verification
// All IDs use uuid.defaultRandom() instead of serial/cuid
// NO foreign key constraints (use indexes only)
```

Key points:
- `users.id` is `uuid` PRIMARY KEY
- `session.userId` and `session.activeOrganizationId` are `uuid` (no FK)
- `account.userId` is `uuid` (no FK)
- Indexes on all foreign key columns

#### B. `nile.ts` - Nile Tenant Tables
```typescript
// Nile multi-tenancy tables
// Tables: tenants (reference only), tenant_users, invitations
// CRITICAL: Composite primary keys required for tenant-scoped tables
```

Key points:
- `tenants` table: minimal reference (already exists in DB)
- `tenant_users`: composite PK `(tenant_id, user_id)`
- `invitations`: composite PK `(tenant_id, id)`
- `tenant_id` columns use `uuid` (no FK, index only)
- `slug` column on tenants is nullable, non-unique

#### C. `todo.ts` - Example Table (Optional)
```typescript
// Simple todo table for demonstration
export const todo = pgTable("todo", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
});
```

#### D. `index.ts` - Export All Schemas
```typescript
export * from "./auth";
export * from "./nile";
export * from "./todo";
```

### Step 3: Configure Drizzle Kit

Create `packages/db/drizzle.config.ts`:
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

### Step 4: Generate Migration

**Option A: Run from workspace root (may fail via turbo)**
```bash
pnpm run db:generate
```

**Option B: Run directly in db package (reliable)**
```bash
cd packages/db
pnpm run db:generate
```

Expected output: Migration file created at `packages/db/src/migrations/0000_legal_aqueduct.sql`

**CRITICAL:** Verify the migration does NOT contain `CREATE TABLE tenants`. If it does, manually edit:
```sql
-- WRONG (will fail):
CREATE TABLE "tenants" (...);

-- CORRECT:
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "metadata" text;
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");
```

### Step 5: Apply Migration

**Option A: Using Drizzle Kit migrate (recommended)**
```bash
cd packages/db
DATABASE_URL="postgres://..." pnpm run db:migrate
```

**Option B: Manual psql execution**
```bash
PGPASSWORD="your-password" psql \
  -h your-host \
  -p 5432 \
  -U your-tenant-id \
  -d your-database \
  -f packages/db/src/migrations/0000_legal_aqueduct.sql
```

### Step 6: Verify Migration Success

Connect to your database:
```bash
PGPASSWORD="your-password" psql \
  -h your-host \
  -p 5432 \
  -U your-tenant-id \
  -d your-database
```

Run verification queries:
```sql
-- List all tables
\dt

-- Expected output:
-- account, invitations, session, tenant_users, tenants, todo, users, verification

-- Check tenants table structure
\d tenants

-- Expected columns: id, name, created, slug, logo, metadata
-- Expected index: tenants_slug_idx (non-unique)

-- Check tenant_users composite PK
\d tenant_users

-- Expected PK: tenant_users_tenant_id_user_id_pk (tenant_id, user_id)

-- Check invitations composite PK
\d invitations

-- Expected PK: invitations_tenant_id_id_pk (tenant_id, id)
```

### Step 7: Run Quality Checks

```bash
# From workspace root
npx ultracite check
pnpm -w typecheck
```

All checks should pass without errors.

## Migration Content Summary

The `0000_legal_aqueduct.sql` migration performs:

### Tables Created
1. **`users`** - UUID-based auth users
   - PK: `id` (uuid)
   - Unique: `email`

2. **`session`** - User sessions with tenant context
   - PK: `id` (uuid)
   - Unique: `token`
   - Indexes: `user_id`, `active_organization_id`

3. **`account`** - OAuth/credential accounts
   - PK: `id` (uuid)
   - Index: `user_id`

4. **`verification`** - Email/phone verification
   - PK: `id` (uuid)
   - Index: `identifier`

5. **`tenant_users`** - Tenant membership junction table
   - Composite PK: `(tenant_id, user_id)`
   - Columns: `id` (uuid), `tenant_id`, `user_id`, `roles[]`, `created`
   - Indexes: `tenant_id`, `user_id`, composite `(tenant_id, user_id)`

6. **`invitations`** - Pending tenant invitations
   - Composite PK: `(tenant_id, id)`
   - Columns: `id` (uuid), `tenant_id`, `email`, `roles[]`, `status`, `expires_at`, `inviter_id`
   - Indexes: `tenant_id`, `email`

7. **`todo`** - Example application table
   - PK: `id` (serial)
   - Columns: `text`, `completed`

### Tables Altered
1. **`tenants`** (pre-existing Nile table)
   - Added: `slug` (text, nullable)
   - Added: `logo` (text, nullable)
   - Added: `metadata` (text, nullable)
   - Added: Non-unique index on `slug`

## Critical: Drizzle Meta Snapshots

### What Are Meta Snapshots?

Drizzle Kit generates two metadata files in `packages/db/src/migrations/meta/`:
- `_journal.json` - Migration history log
- `0000_snapshot.json` - Complete schema snapshot

### Why They Matter

**If you delete or lose these files:**
- Drizzle Kit loses track of what migrations have been applied
- It will attempt to **regenerate CREATE TABLE statements** for existing tables
- This causes migration failures: "table already exists"

### DO Commit Meta Files

```bash
git add packages/db/src/migrations/meta/
git commit -m "chore: add Drizzle migration metadata"
```

### DO NOT Delete Meta Files

If meta files are lost:
1. Restore from git history, OR
2. Regenerate with `drizzle-kit introspect` (advanced, may lose custom SQL)

## Troubleshooting

### Issue 1: `tenants` Table Already Exists

**Symptom:**
```
ERROR: relation "tenants" already exists
```

**Cause:**
Drizzle generated `CREATE TABLE tenants` but Nile already created this table.

**Fix:**
Edit `packages/db/src/migrations/0000_legal_aqueduct.sql`:
```sql
-- Comment out or delete:
-- CREATE TABLE "tenants" (
--   "id" uuid PRIMARY KEY NOT NULL,
--   ...
-- );

-- Replace with:
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "metadata" text;
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug");
```

### Issue 2: `db:generate` Fails via Turbo

**Symptom:**
```bash
pnpm run db:generate
# Hangs or fails with unclear error
```

**Cause:**
Turborepo may not properly forward environment variables or working directory.

**Fix:**
Run directly inside the package:
```bash
cd packages/db
pnpm run db:generate
```

### Issue 3: Missing `DATABASE_URL`

**Symptom:**
```
Error: DATABASE_URL environment variable is required
```

**Fix:**
Ensure `packages/db/.env` exists with valid connection string:
```bash
DATABASE_URL=postgres://tenant-id:password@host:port/database
```

### Issue 4: Composite PK Not Applied

**Symptom:**
`tenant_users` or `invitations` tables do not have composite primary keys.

**Cause:**
Drizzle schema definition missing `primaryKey()` call.

**Fix:**
Verify schema uses this pattern:
```typescript
export const tenantUsers = pgTable(
  "tenant_users",
  { /* columns */ },
  (table) => [
    primaryKey({ columns: [table.tenant_id, table.user_id] }),
  ]
);
```

### Issue 5: `slug` Index is Unique

**Symptom:**
`tenants_slug_idx` is a unique index, preventing duplicate slugs across tenants.

**Cause:**
Drizzle schema incorrectly defined `slug` as `.unique()`.

**Fix:**
In `nile.ts`, ensure:
```typescript
slug: text("slug"), // NO .unique()
```

Regenerate migration:
```bash
cd packages/db
pnpm run db:generate
```

## Workspace Commands Reference

### From Workspace Root
```bash
# Generate migrations (may fail via turbo)
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Open Drizzle Studio
pnpm run db:studio

# Lint and typecheck
npx ultracite check
pnpm -w typecheck
```

### From `packages/db/`
```bash
# Generate migrations (reliable)
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Open Drizzle Studio
pnpm run db:studio

# Start Docker Compose Postgres (if using local DB)
pnpm run db:start
pnpm run db:watch
pnpm run db:stop
pnpm run db:down
```

## Next Steps

After successful migration:
1. Implement Better-Auth server handlers (`apps/server/src/index.ts`)
2. Configure oRPC endpoints for tenant operations
3. Set up auth client in Next.js frontend
4. Implement tenant context middleware

**This guide covers database migration only.** Routing and API integration are documented separately.
