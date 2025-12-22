# Data Models & Database Schema

**Generated:** 2025-12-21
**Database:** PostgreSQL
**ORM:** Drizzle ORM
**Schema Location:** `packages/db/src/schema/`

---

## Overview

The database uses PostgreSQL with Drizzle ORM for type-safe database access. The schema is organized into three main areas:

1. **Authentication** (`auth.ts`) - Better-Auth user/session tables adapted for Nile
2. **Multi-tenancy** (`nile.ts`) - Nile-integrated tenant tables
3. **Application Data** (`todo.ts`) - Application-specific tables

---

## Schema Architecture

### Nile Integration

This project uses **Nile** for multi-tenant database management with the following key principles:

- **UUID-based IDs** everywhere to match Nile's global user identity model
- **No database-level foreign keys** to avoid cross-scope constraints
- **Drizzle relations** for query ergonomics (informational only, not enforced)
- **Tenant isolation** enforced by Nile using composite primary keys

---

## Application Tables

### Todo Table

**Table Name:** `todo`
**Purpose:** Simple todo list items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PRIMARY KEY | Auto-incrementing ID |
| `text` | text | NOT NULL | Todo item text |
| `completed` | boolean | NOT NULL, DEFAULT false | Completion status |

**Indexes:**
- Primary key on `id`

**Notes:**
- Simple application table for demo purposes
- Not tenant-scoped (single global todo list)

---

## Authentication Tables

### Users Table

**Table Name:** `users`
**Purpose:** Global user identity (Better-Auth core table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | User's global UUID |
| `name` | text | NOT NULL | User's display name |
| `email` | text | NOT NULL, UNIQUE | User's email address |
| `email_verified` | boolean | NOT NULL, DEFAULT false | Email verification status |
| `picture` | text | NULL | User's profile picture URL |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `role` | text | NULL | Global administrative role |
| `banned` | boolean | DEFAULT false | Account ban status |
| `ban_reason` | text | NULL | Reason for ban |
| `ban_expires` | timestamp | NULL | Ban expiration date |
| `two_factor_enabled` | boolean | DEFAULT false | 2FA enabled flag (cached) |

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**Notes:**
- UUID primary key for Nile compatibility
- Administrative fields for moderation
- 2FA flag cached from `two_factors` table

---

### Sessions Table

**Table Name:** `sessions`
**Purpose:** User authentication sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Session UUID |
| `expires_at` | timestamp | NOT NULL | Session expiration |
| `token` | text | NOT NULL, UNIQUE | Session token |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW() | Session creation |
| `updated_at` | timestamp | NOT NULL | Last activity |
| `ip_address` | text | NULL | Client IP address |
| `user_agent` | text | NULL | Client user agent |
| `user_id` | uuid | NOT NULL | User reference (logical, no FK) |
| `active_organization_id` | uuid | NULL | Current tenant context |
| `impersonated_by` | uuid | NULL | Admin impersonation tracking |

**Indexes:**
- Primary key on `id`
- Unique index on `token`
- Index on `user_id`
- Index on `active_organization_id`

**Notes:**
- No foreign key to `users` (Nile cross-scope constraint avoidance)
- Supports multi-tenancy via `active_organization_id`
- Impersonation support for admin workflows

---

### Accounts Table

**Table Name:** `accounts`
**Purpose:** OAuth provider accounts

**Note:** Schema partial shown in auth.ts (line 98-100). Contains OAuth provider mappings for Better-Auth social login.

---

## Multi-tenancy Tables

### Tenants Table

**Table Name:** `tenants`
**Purpose:** Tenant/organization definitions (Nile-managed)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Tenant UUID |
| `name` | text | NOT NULL | Tenant display name |
| `slug` | text | NULL | URL-friendly identifier |
| `logo` | text | NULL | Tenant logo URL |
| `metadata` | text | NULL | Additional JSON metadata |
| `created` | timestamp | NULL | Tenant creation timestamp |

**CRITICAL:**
- This table is **created and owned by Nile**
- Schema defined here is minimal for Drizzle relations only
- **DO NOT** alter via Drizzle migrations - use explicit SQL only

---

### Tenant Users Table

**Table Name:** `tenant_users`
**Purpose:** Maps users to tenants with role assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | NOT NULL, DEFAULT random | Record UUID |
| `tenant_id` | uuid | NOT NULL, COMPOSITE PK | Tenant reference (logical, no FK) |
| `user_id` | uuid | NOT NULL, COMPOSITE PK | User reference (logical, no FK) |
| `roles` | text[] | NOT NULL, DEFAULT ['member'] | Role list within tenant |
| `created` | timestamp | NOT NULL, DEFAULT NOW() | Membership creation |

**Composite Primary Key:**
- `(tenant_id, user_id)` - **REQUIRED by Nile for tenant isolation**

**Indexes:**
- Composite primary key on `(tenant_id, user_id)`
- Index on `tenant_id`
- Index on `user_id`
- Compound index on `(tenant_id, user_id)` for membership lookups

**Notes:**
- Roles stored as TEXT[] for flexible role expansion
- No database-level FKs (Nile cross-scope constraint avoidance)
- Composite PK is critical invariant - removing breaks tenant isolation

---

### Invitations Table

**Table Name:** `invitations`
**Purpose:** Pending tenant invitations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | NOT NULL, DEFAULT random | Invitation UUID |
| `tenant_id` | uuid | NOT NULL, COMPOSITE PK | Tenant reference |
| `email` | text | NOT NULL | Invitee email |
| `roles` | text[] | NOT NULL, DEFAULT ['member'] | Roles upon acceptance |
| `status` | text | NOT NULL, DEFAULT 'pending' | Invitation status |
| `expires_at` | timestamp | NOT NULL | Invitation expiration |
| `inviter_id` | uuid | NOT NULL | User who sent invitation |

**Composite Primary Key:**
- `(tenant_id, id)` - Tenant-scoped invitations

**Indexes:**
- Composite primary key on `(tenant_id, id)`
- Index on `tenant_id`
- Index on `email`

**Notes:**
- Does NOT reference users table (invitee may not exist yet)
- Status lifecycle: pending → accepted/rejected/expired
- Inviter tracked for auditability

---

## Database Relations

### Drizzle Relations (Informational Only)

**Important:** These relations are NOT enforced at the database level due to Nile's cross-scope constraint requirements. They exist only for Drizzle query ergonomics.

#### Tenants Relations
```typescript
tenants.members → many(tenant_users)
tenants.invitations → many(invitations)
```

#### Tenant Users Relations
```typescript
tenant_users.tenant → one(tenants)
tenant_users.user → one(users)
```

#### Invitations Relations
```typescript
invitations.tenant → one(tenants)
invitations.inviter → one(users)
```

---

## Migration Strategy

**Tool:** Drizzle Kit
**Commands:**
- `pnpm run db:generate` - Generate migrations
- `pnpm run db:migrate` - Run migrations
- `pnpm run db:push` - Push schema changes (dev only)
- `pnpm run db:studio` - Open Drizzle Studio

**Docker Compose:**
- `pnpm run db:start` - Start PostgreSQL container
- `pnpm run db:stop` - Stop PostgreSQL container
- `pnpm run db:down` - Stop and remove containers

**Location:** `packages/db/`

---

## Security Considerations

1. **No Foreign Keys:** Intentional design for Nile compatibility
2. **Tenant Isolation:** Enforced by Nile at platform level, not DB constraints
3. **UUID-based IDs:** Global user identity across tenants
4. **Role-based Access:** Flexible TEXT[] roles for easy expansion
5. **Session Security:** Token-based with expiration tracking

---

## Future Considerations

### Potential Additions
- Audit logs table
- User preferences table
- Notification settings
- Activity feed
- File attachments metadata

### Tenant-scoped Application Tables
When adding new application tables:
1. Use composite primary keys `(tenant_id, id)` for tenant isolation
2. Add `tenant_id` index for query performance
3. Avoid database-level FKs to shared tables
4. Use Drizzle relations for query ergonomics only
