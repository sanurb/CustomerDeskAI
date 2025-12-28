---
epic_coverage:
  - Epic 1: Frictionless Workspace Activation
  - Epic 6: Platform Reliability & Multi-Tenant Trust
  - Epic 7: Seamless Authentication & Identity
  - Epic 9: User Account Management & Security
created_date: 2025-12-27
author: PM Agent (John)
status: draft
---

# Database Schema Design - Multi-Tenant Foundation

## Overview

This document defines the database schema for CustomerDeskAI's multi-tenant architecture, covering workspace provisioning, authentication, and user account management. The schema is designed for **Nile multi-tenancy platform** with **PostgreSQL** and **Drizzle ORM**.

### Architectural Constraints

**Nile Multi-Tenancy Rules:**
- ✅ No database-level foreign keys across tenants (Nile architectural rule)
- ✅ All tenant-scoped tables use composite primary keys including `tenant_id`
- ✅ All queries MUST include `WHERE tenant_id = ?` filter (enforced via ESLint)
- ✅ UUID-based user identity enables cross-tenant user existence
- ✅ Application-level referential integrity (compensating transactions)

**Performance Targets:**
- <3s workspace creation (95th percentile) - Epic 1, NFR-P1
- <500ms RPC response time (median) - Epic 2, NFR-P5
- <200ms perceived latency for UI actions - Epic 2, UX NFR-1
- Zero zombie workspaces (100% atomicity) - Epic 6, NFR-R2

---

## Schema Diagram Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL TABLES (No tenant_id)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users (UUID identity, cross-tenant)                            │
│  ├─ id (UUID, PK)                                               │
│  ├─ email (unique, indexed)                                     │
│  ├─ name                                                         │
│  ├─ password_hash (bcrypt, nullable for OAuth-only)            │
│  ├─ email_verified_at (timestamp, nullable)                     │
│  ├─ profile_image_url (CDN URL, nullable)                       │
│  ├─ two_factor_enabled (boolean)                                │
│  ├─ two_factor_secret (encrypted, nullable)                     │
│  ├─ two_factor_recovery_codes (encrypted JSON array)           │
│  ├─ password_last_changed_at (timestamp)                        │
│  ├─ deleted_at (timestamp, nullable - soft delete)             │
│  └─ created_at, updated_at                                      │
│                                                                  │
│  sessions (authentication sessions with rich metadata)          │
│  ├─ id (UUID, PK)                                               │
│  ├─ user_id (UUID, indexed)                                     │
│  ├─ token_hash (indexed for lookups)                            │
│  ├─ device_type (desktop/mobile/tablet)                         │
│  ├─ browser (Chrome/Firefox/Safari/etc)                         │
│  ├─ ip_address (for GeoIP)                                      │
│  ├─ city, country (GeoIP lookup results)                        │
│  ├─ last_active_at (indexed for sorting)                        │
│  ├─ expires_at                                                   │
│  └─ created_at                                                   │
│                                                                  │
│  user_accounts (OAuth linked accounts - Google, GitHub)         │
│  ├─ id (UUID, PK)                                               │
│  ├─ user_id (UUID, indexed)                                     │
│  ├─ provider (google/github, indexed)                           │
│  ├─ provider_account_id (provider's user ID)                    │
│  ├─ email (from provider, indexed)                              │
│  ├─ linked_at                                                    │
│  └─ UNIQUE(provider, provider_account_id)                       │
│                                                                  │
│  email_verification_tokens (7-day expiry)                       │
│  ├─ id (UUID, PK)                                               │
│  ├─ user_id (UUID, indexed)                                     │
│  ├─ token (SHA-256 hash, indexed)                               │
│  ├─ expires_at                                                   │
│  └─ created_at                                                   │
│                                                                  │
│  account_deletion_requests (30-day grace period)                │
│  ├─ id (UUID, PK)                                               │
│  ├─ user_id (UUID, unique)                                      │
│  ├─ requested_at                                                 │
│  ├─ scheduled_deletion_at (requested_at + 30 days)             │
│  └─ deletion_reason (text, optional)                            │
│                                                                  │
│  two_factor_trusted_devices (30-day trust)                      │
│  ├─ id (UUID, PK)                                               │
│  ├─ user_id (UUID, indexed)                                     │
│  ├─ device_id (SHA-256 of User-Agent + IP)                     │
│  ├─ trusted_at                                                   │
│  └─ expires_at (trusted_at + 30 days)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              TENANT-SCOPED TABLES (Nile Composite Keys)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  workspaces (Nile tenant table)                                 │
│  ├─ tenant_id (UUID, PK - managed by Nile)                      │
│  ├─ name (workspace name)                                        │
│  ├─ slug (unique subdomain, globally unique indexed)            │
│  ├─ created_by (user_id UUID, creator)                          │
│  ├─ created_at, updated_at                                       │
│  └─ UNIQUE(slug) - global uniqueness                            │
│                                                                  │
│  tenant_users (many-to-many: users ↔ workspaces)               │
│  ├─ tenant_id (UUID, composite PK part 1)                       │
│  ├─ user_id (UUID, composite PK part 2)                         │
│  ├─ role (owner/admin/agent)                                    │
│  ├─ joined_at                                                    │
│  ├─ last_active_at (for workspace switcher sorting)            │
│  └─ PRIMARY KEY (tenant_id, user_id)                            │
│     INDEX (user_id, last_active_at) - user's workspaces query  │
│                                                                  │
│  brand_config (workspace branding - logo, colors, locale)       │
│  ├─ tenant_id (UUID, PK)                                         │
│  ├─ logo_url (CDN URL, nullable)                                │
│  ├─ primary_color (hex color)                                   │
│  ├─ accent_color (hex color)                                    │
│  ├─ language (es-LA / en-US)                                    │
│  ├─ timezone (IANA identifier, e.g., America/Sao_Paulo)        │
│  └─ updated_at                                                   │
│                                                                  │
│  invitations (team invitations with 7-day expiry)               │
│  ├─ tenant_id (UUID, composite PK part 1)                       │
│  ├─ id (UUID, composite PK part 2)                              │
│  ├─ invited_email (email address)                               │
│  ├─ invited_role (admin/agent)                                  │
│  ├─ invited_by (user_id UUID)                                   │
│  ├─ personal_message (text, nullable)                           │
│  ├─ token (SHA-256 hash, indexed)                               │
│  ├─ status (pending/accepted/expired)                           │
│  ├─ expires_at (created_at + 7 days)                            │
│  ├─ created_at, accepted_at (nullable)                          │
│  └─ PRIMARY KEY (tenant_id, id)                                 │
│     INDEX (tenant_id, invited_email, status) - pending query   │
│                                                                  │
│  tickets (support ticket management)                            │
│  ├─ tenant_id (UUID, composite PK part 1)                       │
│  ├─ id (UUID, composite PK part 2)                              │
│  ├─ title, description                                           │
│  ├─ priority (low/medium/high)                                  │
│  ├─ status (open/pending/resolved)                              │
│  ├─ created_by (customer email or user_id)                      │
│  ├─ assigned_to (user_id UUID, nullable)                        │
│  ├─ created_at, updated_at, resolved_at                         │
│  └─ PRIMARY KEY (tenant_id, id)                                 │
│     INDEX (tenant_id, status, created_at) - queue query        │
│     INDEX (tenant_id, assigned_to) - agent's tickets           │
│                                                                  │
│  ticket_replies (threaded conversation)                         │
│  ├─ tenant_id (UUID, composite PK part 1)                       │
│  ├─ id (UUID, composite PK part 2)                              │
│  ├─ ticket_id (UUID)                                             │
│  ├─ author_id (user_id UUID or customer email)                 │
│  ├─ content (Markdown text)                                     │
│  ├─ is_internal (boolean - internal note vs customer-visible)  │
│  ├─ created_at                                                   │
│  └─ PRIMARY KEY (tenant_id, id)                                 │
│     INDEX (tenant_id, ticket_id, created_at) - thread query    │
│                                                                  │
│  ticket_drafts (auto-save drafts, 500ms debounce)              │
│  ├─ tenant_id (UUID, composite PK part 1)                       │
│  ├─ ticket_id (UUID, composite PK part 2)                       │
│  ├─ user_id (UUID, composite PK part 3)                         │
│  ├─ content (Markdown text)                                     │
│  ├─ updated_at (last auto-save timestamp)                       │
│  └─ PRIMARY KEY (tenant_id, ticket_id, user_id)                │
│                                                                  │
│  knowledge_base_articles (Markdown articles)                    │
│  ├─ tenant_id (UUID, composite PK part 1)                       │
│  ├─ id (UUID, composite PK part 2)                              │
│  ├─ title                                                        │
│  ├─ content (Markdown)                                           │
│  ├─ status (draft/published)                                    │
│  ├─ author_id (user_id UUID)                                    │
│  ├─ archived_at (nullable - soft delete)                        │
│  ├─ created_at, updated_at, published_at                        │
│  └─ PRIMARY KEY (tenant_id, id)                                 │
│     INDEX (tenant_id, status, published_at) - public list      │
│     INDEX (tenant_id, title) - keyword search                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions (Drizzle ORM)

### Global Tables (No Tenant Scoping)

#### 1. users - Global User Identity (UUID-based, cross-tenant)

**Purpose:** Stores user accounts that can belong to multiple workspaces. UUID identity enables cross-tenant user existence without foreign keys.

**Schema:**

```typescript
// packages/db/src/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  // Primary identity
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),

  // Authentication
  password_hash: varchar("password_hash", { length: 255 }), // nullable for OAuth-only users
  email_verified_at: timestamp("email_verified_at"),

  // Profile
  profile_image_url: text("profile_image_url"), // CDN URL

  // Two-Factor Authentication
  two_factor_enabled: boolean("two_factor_enabled").default(false).notNull(),
  two_factor_secret: text("two_factor_secret"), // encrypted TOTP secret
  two_factor_recovery_codes: jsonb("two_factor_recovery_codes").$type<string[]>(), // encrypted array of backup codes

  // Security metadata
  password_last_changed_at: timestamp("password_last_changed_at"),

  // Soft delete (30-day grace period)
  deleted_at: timestamp("deleted_at"),

  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Indexes
export const usersEmailIndex = pgIndex("users_email_idx").on(users.email);

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().min(1).max(255),
  name: z.string().min(2).max(255),
  password_hash: z.string().min(60).max(255).optional(), // bcrypt hash length
});

export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**Key Constraints:**
- ✅ Email uniqueness enforced globally (case-insensitive via application logic)
- ✅ Password hash nullable (OAuth-only users don't have passwords)
- ✅ Soft delete via `deleted_at` timestamp (hard delete after 30 days)
- ✅ UUID primary key enables cross-tenant identity

**Queries:**

```typescript
// Find user by email (case-insensitive)
const user = await db
  .select()
  .from(users)
  .where(sql`LOWER(${users.email}) = LOWER(${email})`)
  .limit(1);

// Check if email already exists (workspace creation validation)
const exists = await db
  .select({ id: users.id })
  .from(users)
  .where(sql`LOWER(${users.email}) = LOWER(${email})`)
  .limit(1);

// Soft delete user (mark as deleted, schedule hard delete)
await db
  .update(users)
  .set({ deleted_at: new Date() })
  .where(eq(users.id, userId));
```

---

#### 2. sessions - Authentication Sessions (Rich Metadata for US9.4)

**Purpose:** Stores active user sessions with rich metadata for session management dashboard (device type, browser, location, last activity).

**Schema:**

```typescript
// packages/db/src/schema/sessions.ts
import { pgTable, uuid, text, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  // Primary identity
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(), // FK to users.id (application-enforced)
  token_hash: varchar("token_hash", { length: 255 }).notNull().unique(), // SHA-256 hash of session token

  // Session metadata (US9.4 - Session Management Dashboard)
  device_type: varchar("device_type", { length: 50 }), // desktop/mobile/tablet
  browser: varchar("browser", { length: 100 }), // Chrome 120, Firefox 121, etc.
  ip_address: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  city: varchar("city", { length: 100 }), // GeoIP lookup result
  country: varchar("country", { length: 100 }), // GeoIP lookup result

  // Activity tracking
  last_active_at: timestamp("last_active_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(), // 30 days or 90 days (Remember me)

  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.user_id),
  tokenHashIdx: index("sessions_token_hash_idx").on(table.token_hash),
  lastActiveIdx: index("sessions_last_active_idx").on(table.user_id, table.last_active_at),
}));

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

**Key Constraints:**
- ✅ Token hash indexed for fast session lookups
- ✅ Composite index on (user_id, last_active_at) for sorting user's sessions
- ✅ No foreign key to users table (application-enforced referential integrity)
- ✅ GeoIP metadata stored for session management UI

**Queries:**

```typescript
// List all active sessions for user (US9.4)
const userSessions = await db
  .select()
  .from(sessions)
  .where(and(
    eq(sessions.user_id, userId),
    gt(sessions.expires_at, new Date())
  ))
  .orderBy(desc(sessions.last_active_at));

// Sign out specific session (US9.4.4)
await db
  .delete(sessions)
  .where(and(
    eq(sessions.id, sessionId),
    eq(sessions.user_id, userId) // prevent cross-user session termination
  ));

// Sign out all OTHER devices (US9.4.6)
await db
  .delete(sessions)
  .where(and(
    eq(sessions.user_id, userId),
    ne(sessions.id, currentSessionId)
  ));

// Update session activity on every authenticated request (US9.4.2)
await db
  .update(sessions)
  .set({
    last_active_at: new Date(),
    ip_address,
    city,
    country,
  })
  .where(eq(sessions.id, sessionId));
```

---

#### 3. user_accounts - OAuth Linked Accounts (US9.6)

**Purpose:** Stores linked social provider accounts (Google, GitHub) for multi-method authentication.

**Schema:**

```typescript
// packages/db/src/schema/user-accounts.ts
import { pgTable, uuid, varchar, timestamp, unique, index } from "drizzle-orm/pg-core";

export const userAccounts = pgTable("user_accounts", {
  // Primary identity
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(), // FK to users.id (application-enforced)

  // OAuth provider details
  provider: varchar("provider", { length: 50 }).notNull(), // google, github
  provider_account_id: varchar("provider_account_id", { length: 255 }).notNull(), // provider's user ID
  email: varchar("email", { length: 255 }).notNull(), // email from provider

  // Timestamps
  linked_at: timestamp("linked_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_accounts_user_id_idx").on(table.user_id),
  providerIdx: index("user_accounts_provider_idx").on(table.provider),
  emailIdx: index("user_accounts_email_idx").on(table.email),
  providerUniqueConstraint: unique("user_accounts_provider_account_unique").on(
    table.provider,
    table.provider_account_id
  ),
}));

export type UserAccount = typeof userAccounts.$inferSelect;
export type NewUserAccount = typeof userAccounts.$inferInsert;
```

**Key Constraints:**
- ✅ Unique constraint on (provider, provider_account_id) prevents duplicate links
- ✅ Email indexed for account linking by email matching
- ✅ Supports multiple providers per user (Google + GitHub)

**Queries:**

```typescript
// List linked accounts for user (US9.6.2)
const linkedAccounts = await db
  .select({
    provider: userAccounts.provider,
    email: userAccounts.email,
    linked_at: userAccounts.linked_at,
  })
  .from(userAccounts)
  .where(eq(userAccounts.user_id, userId));

// Link social account (US9.6.3)
await db.insert(userAccounts).values({
  user_id: userId,
  provider: "google",
  provider_account_id: googleUserId,
  email: googleEmail,
});

// Unlink social account (US9.6.4)
// But first, validate user has at least one remaining login method
const remainingMethods = await db
  .select()
  .from(userAccounts)
  .where(and(
    eq(userAccounts.user_id, userId),
    ne(userAccounts.provider, providerToUnlink)
  ));

const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
const hasPassword = user[0].password_hash !== null;

if (remainingMethods.length === 0 && !hasPassword) {
  throw new Error("Cannot unlink last login method");
}

await db
  .delete(userAccounts)
  .where(and(
    eq(userAccounts.user_id, userId),
    eq(userAccounts.provider, providerToUnlink)
  ));
```

---

#### 4. email_verification_tokens - Email Verification (US9.15)

**Purpose:** Stores email verification tokens with 7-day expiry for account ownership proof.

**Schema:**

```typescript
// packages/db/src/schema/email-verification.ts
import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  // Primary identity
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(), // FK to users.id (application-enforced)

  // Token details
  token: varchar("token", { length: 255 }).notNull().unique(), // SHA-256 hash of random token
  expires_at: timestamp("expires_at").notNull(), // created_at + 7 days

  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("email_verification_tokens_user_id_idx").on(table.user_id),
  tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
}));

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;
```

**Key Constraints:**
- ✅ Token indexed for fast lookup during verification
- ✅ 7-day expiry enforced
- ✅ Single-use tokens (deleted after verification)

**Queries:**

```typescript
// Generate and store verification token (US9.15.1)
const token = crypto.randomBytes(32).toString("hex");
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

await db.insert(emailVerificationTokens).values({
  user_id: userId,
  token: tokenHash,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});

// Verify email with token (US9.15.3)
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

const verificationToken = await db
  .select()
  .from(emailVerificationTokens)
  .where(and(
    eq(emailVerificationTokens.token, tokenHash),
    gt(emailVerificationTokens.expires_at, new Date())
  ))
  .limit(1);

if (verificationToken.length === 0) {
  throw new Error("Invalid or expired token");
}

// Mark email as verified
await db
  .update(users)
  .set({ email_verified_at: new Date() })
  .where(eq(users.id, verificationToken[0].user_id));

// Delete token (single-use)
await db
  .delete(emailVerificationTokens)
  .where(eq(emailVerificationTokens.id, verificationToken[0].id));
```

---

#### 5. account_deletion_requests - 30-Day Grace Period (US9.2)

**Purpose:** Tracks account deletion requests with 30-day grace period for GDPR/LGPD compliance.

**Schema:**

```typescript
// packages/db/src/schema/account-deletion.ts
import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";

export const accountDeletionRequests = pgTable("account_deletion_requests", {
  // Primary identity
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().unique(), // FK to users.id, one active request per user

  // Deletion metadata
  requested_at: timestamp("requested_at").defaultNow().notNull(),
  scheduled_deletion_at: timestamp("scheduled_deletion_at").notNull(), // requested_at + 30 days
  deletion_reason: text("deletion_reason"), // optional user feedback
});

export type AccountDeletionRequest = typeof accountDeletionRequests.$inferSelect;
export type NewAccountDeletionRequest = typeof accountDeletionRequests.$inferInsert;
```

**Key Constraints:**
- ✅ Unique constraint on user_id (one active deletion request per user)
- ✅ 30-day grace period enforced
- ✅ Soft delete in users table happens immediately, hard delete after 30 days

**Queries:**

```typescript
// Request account deletion (US9.2.3)
await db.transaction(async (tx) => {
  // Soft delete user immediately
  await tx.update(users).set({ deleted_at: new Date() }).where(eq(users.id, userId));

  // Schedule hard delete in 30 days
  await tx.insert(accountDeletionRequests).values({
    user_id: userId,
    requested_at: new Date(),
    scheduled_deletion_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    deletion_reason: reason,
  });
});

// Cancel deletion (US9.2.4)
await db.transaction(async (tx) => {
  // Restore user account
  await tx.update(users).set({ deleted_at: null }).where(eq(users.id, userId));

  // Delete deletion request
  await tx.delete(accountDeletionRequests).where(eq(accountDeletionRequests.user_id, userId));
});

// Hard delete job - process expired deletion requests (US9.2.5)
const expiredDeletions = await db
  .select()
  .from(accountDeletionRequests)
  .where(lte(accountDeletionRequests.scheduled_deletion_at, new Date()));

for (const deletion of expiredDeletions) {
  await db.transaction(async (tx) => {
    // Remove from all workspaces
    await tx.delete(tenantUsers).where(eq(tenantUsers.user_id, deletion.user_id));

    // Delete all sessions
    await tx.delete(sessions).where(eq(sessions.user_id, deletion.user_id));

    // Delete linked accounts
    await tx.delete(userAccounts).where(eq(userAccounts.user_id, deletion.user_id));

    // Delete user record (hard delete)
    await tx.delete(users).where(eq(users.id, deletion.user_id));

    // Delete deletion request record
    await tx.delete(accountDeletionRequests).where(eq(accountDeletionRequests.id, deletion.id));
  });
}
```

---

#### 6. two_factor_trusted_devices - Trusted Device Management (US9.8)

**Purpose:** Stores trusted devices that can skip 2FA for 30 days.

**Schema:**

```typescript
// packages/db/src/schema/two-factor.ts
import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const twoFactorTrustedDevices = pgTable("two_factor_trusted_devices", {
  // Primary identity
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(), // FK to users.id (application-enforced)

  // Device fingerprint (SHA-256 of User-Agent + IP)
  device_id: varchar("device_id", { length: 255 }).notNull(),

  // Trust expiry
  trusted_at: timestamp("trusted_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(), // trusted_at + 30 days
}, (table) => ({
  userIdIdx: index("two_factor_trusted_devices_user_id_idx").on(table.user_id),
  deviceIdIdx: index("two_factor_trusted_devices_device_id_idx").on(table.device_id),
}));

export type TwoFactorTrustedDevice = typeof twoFactorTrustedDevices.$inferSelect;
export type NewTwoFactorTrustedDevice = typeof twoFactorTrustedDevices.$inferInsert;
```

**Key Constraints:**
- ✅ Device ID is hash of User-Agent + IP (device fingerprinting)
- ✅ 30-day trust expiry
- ✅ Trusted devices deleted when 2FA disabled

**Queries:**

```typescript
// Check if device is trusted (US9.8.3)
const deviceId = crypto
  .createHash("sha256")
  .update(userAgent + ipAddress)
  .digest("hex");

const trustedDevice = await db
  .select()
  .from(twoFactorTrustedDevices)
  .where(and(
    eq(twoFactorTrustedDevices.user_id, userId),
    eq(twoFactorTrustedDevices.device_id, deviceId),
    gt(twoFactorTrustedDevices.expires_at, new Date())
  ))
  .limit(1);

const isTrusted = trustedDevice.length > 0;

// Trust device after successful 2FA (US9.8.1)
if (trustDevice) {
  await db.insert(twoFactorTrustedDevices).values({
    user_id: userId,
    device_id: deviceId,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}

// Delete all trusted devices when 2FA disabled (US9.10.1)
await db
  .delete(twoFactorTrustedDevices)
  .where(eq(twoFactorTrustedDevices.user_id, userId));
```

---

### Tenant-Scoped Tables (Nile Composite Keys)

#### 7. workspaces - Nile Tenant Table (Epic 1)

**Purpose:** Stores workspace/tenant information. Managed by Nile platform with composite key architecture.

**Schema:**

```typescript
// packages/db/src/schema/workspaces.ts
import { pgTable, uuid, varchar, timestamp, unique } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  // Nile-managed tenant ID
  tenant_id: uuid("tenant_id").primaryKey(), // managed by Nile platform

  // Workspace details
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // subdomain (globally unique)

  // Creator
  created_by: uuid("created_by").notNull(), // user_id of workspace creator

  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugUniqueConstraint: unique("workspaces_slug_unique").on(table.slug),
}));

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
```

**Key Constraints:**
- ✅ Slug globally unique (enforced at database level)
- ✅ tenant_id managed by Nile platform (not auto-generated by app)
- ✅ No foreign key to users.created_by (application-enforced)

**Queries:**

```typescript
// Check workspace slug availability (US1.3)
const existingWorkspace = await db
  .select({ tenant_id: workspaces.tenant_id })
  .from(workspaces)
  .where(sql`LOWER(${workspaces.slug}) = LOWER(${slug})`)
  .limit(1);

const isAvailable = existingWorkspace.length === 0;

// Atomic workspace creation (US1.2, US6.1 - Zero zombie workspaces)
await db.transaction(async (tx) => {
  // Step 1: Create Nile tenant (via Nile SDK)
  const tenantId = await nile.tenants.create({ name, slug });

  // Step 2: Create workspace record
  await tx.insert(workspaces).values({
    tenant_id: tenantId,
    name,
    slug,
    created_by: userId,
  });

  // Step 3: Add creator as Owner
  await tx.insert(tenantUsers).values({
    tenant_id: tenantId,
    user_id: userId,
    role: "owner",
  });

  // Step 4: Initialize brand config
  await tx.insert(brandConfig).values({
    tenant_id: tenantId,
    primary_color: "#000000",
    accent_color: "#3B82F6",
    language: "en-US",
    timezone: "America/Los_Angeles",
  });

  // If any step fails, entire transaction rolls back (zero zombie workspaces)
});
```

---

#### 8. tenant_users - User-Workspace Many-to-Many (Epic 5)

**Purpose:** Links users to workspaces with role-based access control (Owner/Admin/Agent).

**Schema:**

```typescript
// packages/db/src/schema/tenant-users.ts
import { pgTable, uuid, varchar, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

export const tenantUsers = pgTable("tenant_users", {
  // Composite primary key (Nile multi-tenancy pattern)
  tenant_id: uuid("tenant_id").notNull(),
  user_id: uuid("user_id").notNull(),

  // Role-based access control
  role: varchar("role", { length: 50 }).notNull(), // owner/admin/agent

  // Activity tracking
  joined_at: timestamp("joined_at").defaultNow().notNull(),
  last_active_at: timestamp("last_active_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tenant_id, table.user_id] }),
  userWorkspacesIdx: index("tenant_users_user_workspaces_idx").on(table.user_id, table.last_active_at),
}));

export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
```

**Key Constraints:**
- ✅ Composite primary key (tenant_id, user_id) ensures unique user per workspace
- ✅ Index on (user_id, last_active_at) for workspace switcher sorting (US9.11)
- ✅ Role enforced at application level (no database-level enum)

**Queries:**

```typescript
// Get user's role in workspace (US5.3)
const tenantUser = await db
  .select()
  .from(tenantUsers)
  .where(and(
    eq(tenantUsers.tenant_id, tenantId),
    eq(tenantUsers.user_id, userId)
  ))
  .limit(1);

const role = tenantUser[0]?.role; // owner/admin/agent

// List all workspaces for user (US9.11.1)
const userWorkspaces = await db
  .select({
    workspace_id: workspaces.tenant_id,
    workspace_name: workspaces.name,
    workspace_slug: workspaces.slug,
    workspace_logo_url: brandConfig.logo_url,
    user_role: tenantUsers.role,
  })
  .from(tenantUsers)
  .leftJoin(workspaces, eq(tenantUsers.tenant_id, workspaces.tenant_id))
  .leftJoin(brandConfig, eq(tenantUsers.tenant_id, brandConfig.tenant_id))
  .where(eq(tenantUsers.user_id, userId))
  .orderBy(desc(tenantUsers.last_active_at));

// Check if user is sole Owner (US9.13.1)
const owners = await db
  .select()
  .from(tenantUsers)
  .where(and(
    eq(tenantUsers.tenant_id, tenantId),
    eq(tenantUsers.role, "owner")
  ));

const isSoleOwner = owners.length === 1 && owners[0].user_id === userId;
```

---

#### 9. brand_config - Workspace Branding (Epic 4)

**Purpose:** Stores workspace branding configuration (logo, colors, language, timezone).

**Schema:**

```typescript
// packages/db/src/schema/brand-config.ts
import { pgTable, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const brandConfig = pgTable("brand_config", {
  // One-to-one with workspaces (tenant_id is PK)
  tenant_id: uuid("tenant_id").primaryKey(),

  // Visual branding
  logo_url: text("logo_url"), // CDN URL (nullable)
  primary_color: varchar("primary_color", { length: 7 }).notNull().default("#000000"), // hex color
  accent_color: varchar("accent_color", { length: 7 }).notNull().default("#3B82F6"), // hex color

  // Localization
  language: varchar("language", { length: 10 }).notNull().default("en-US"), // es-LA / en-US
  timezone: varchar("timezone", { length: 100 }).notNull().default("America/Los_Angeles"), // IANA identifier

  // Timestamps
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type BrandConfig = typeof brandConfig.$inferSelect;
export type NewBrandConfig = typeof brandConfig.$inferInsert;
```

**Key Constraints:**
- ✅ tenant_id is primary key (one-to-one with workspaces)
- ✅ Hex color validation enforced at application level
- ✅ IANA timezone identifiers only

**Queries:**

```typescript
// Fetch brand config for middleware CSS injection (NFR-P2: <50ms)
const config = await db
  .select()
  .from(brandConfig)
  .where(eq(brandConfig.tenant_id, tenantId))
  .limit(1);

// Update branding (US4.1)
await db
  .update(brandConfig)
  .set({
    logo_url: cdnUrl,
    primary_color: primaryColor,
    accent_color: accentColor,
    updated_at: new Date(),
  })
  .where(eq(brandConfig.tenant_id, tenantId));
```

---

## Indexes & Performance Optimization

### Critical Indexes for NFR Compliance

**Performance Targets:**
- <3s workspace creation (NFR-P1)
- <300ms URL availability check (NFR-P3)
- <500ms RPC response time (NFR-P5)
- <200ms perceived latency (UX NFR-1)

**Indexes:**

```sql
-- Global tables
CREATE INDEX users_email_idx ON users(LOWER(email)); -- case-insensitive email lookup
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_token_hash_idx ON sessions(token_hash);
CREATE INDEX sessions_last_active_idx ON sessions(user_id, last_active_at DESC);
CREATE INDEX user_accounts_user_id_idx ON user_accounts(user_id);
CREATE INDEX user_accounts_email_idx ON user_accounts(LOWER(email));
CREATE UNIQUE INDEX user_accounts_provider_unique ON user_accounts(provider, provider_account_id);

-- Tenant-scoped tables
CREATE UNIQUE INDEX workspaces_slug_unique ON workspaces(LOWER(slug)); -- global uniqueness
CREATE INDEX tenant_users_user_workspaces_idx ON tenant_users(user_id, last_active_at DESC);
CREATE INDEX tickets_queue_idx ON tickets(tenant_id, status, created_at);
CREATE INDEX tickets_assigned_idx ON tickets(tenant_id, assigned_to);
CREATE INDEX ticket_replies_thread_idx ON ticket_replies(tenant_id, ticket_id, created_at);
```

---

## Multi-Tenant Query Patterns

### Tenant-Scoped Query Wrapper (ESLint Enforcement)

**Problem:** All tenant-scoped queries MUST include `WHERE tenant_id = ?` filter (NFR-SC3).

**Solution:** Drizzle ORM wrapper + ESLint rule.

```typescript
// packages/db/src/utils/tenant-queries.ts
import { db } from "../index";
import { sql } from "drizzle-orm";

export function createTenantDB(tenantId: string) {
  return {
    select: (table: any) => {
      return db.select().from(table).where(sql`${table.tenant_id} = ${tenantId}`);
    },
    insert: (table: any) => {
      // Auto-inject tenant_id on insert
      return {
        values: (values: any) => {
          return db.insert(table).values({ ...values, tenant_id: tenantId });
        },
      };
    },
    update: (table: any) => {
      return {
        set: (values: any) => {
          return {
            where: (condition: any) => {
              return db
                .update(table)
                .set(values)
                .where(sql`${table.tenant_id} = ${tenantId} AND ${condition}`);
            },
          };
        },
      };
    },
    delete: (table: any) => {
      return {
        where: (condition: any) => {
          return db
            .delete(table)
            .where(sql`${table.tenant_id} = ${tenantId} AND ${condition}`);
        },
      };
    },
  };
}

// Usage in RPC handlers
const tenantDB = createTenantDB(context.tenantId);

const tickets = await tenantDB.select(ticketsTable); // auto-injects WHERE tenant_id = ?
```

---

## Migrations & Schema Evolution

### Migration Strategy

**Tools:**
- Drizzle Kit for migration generation
- GitHub Actions for automated migration execution

**Workflow:**

```bash
# Generate migration from schema changes
pnpm run db:generate

# Apply migrations to development
pnpm run db:migrate

# Apply migrations to production (via CI/CD)
DATABASE_URL=$PROD_DB_URL pnpm run db:migrate
```

**Example Migration:**

```typescript
// migrations/0001_add_profile_image.sql
ALTER TABLE users ADD COLUMN profile_image_url TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

CREATE INDEX users_email_idx ON users(LOWER(email));
```

---

## Security & Compliance

### Data Encryption

**At Rest:**
- TLS 1.3 for all database connections (NFR-S1)
- PostgreSQL encryption enabled in Nile platform

**In Transit:**
- HTTPS only for all API endpoints
- Session tokens stored as SHA-256 hashes (not plaintext)

**Sensitive Fields Encrypted:**
- `users.two_factor_secret` (encrypted with app secret key)
- `users.two_factor_recovery_codes` (encrypted JSON array)

### GDPR/LGPD Compliance

**Data Export (NFR-DP1, NFR-DP2):**

```typescript
// Export all user data (GDPR Article 15)
async function exportUserData(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId));
  const sessions = await db.select().from(sessions).where(eq(sessions.user_id, userId));
  const accounts = await db.select().from(userAccounts).where(eq(userAccounts.user_id, userId));
  const workspaces = await db
    .select()
    .from(tenantUsers)
    .leftJoin(workspaces, eq(tenantUsers.tenant_id, workspaces.tenant_id))
    .where(eq(tenantUsers.user_id, userId));

  return {
    user: user[0],
    sessions,
    linked_accounts: accounts,
    workspaces,
  };
}
```

**Data Deletion (NFR-DP1, NFR-DP2):**
- 30-day soft delete grace period (US9.2)
- Hard delete after 30 days removes all user data
- Audit trail preserved (user_id logged, PII removed)

---

## Next Steps

1. **Schema Implementation**: Create Drizzle schema files in `packages/db/src/schema/`
2. **Migrations**: Generate initial migrations with `pnpm run db:generate`
3. **Seed Data**: Create seed script for development/testing
4. **Integration Tests**: Write tests for critical queries (workspace creation, session management)
5. **ESLint Rules**: Implement tenant_id validation rule
6. **Performance Benchmarks**: Validate query performance against NFRs

---

## Appendix: Complete Table List

### Global Tables (7 tables)
1. users
2. sessions
3. user_accounts
4. email_verification_tokens
5. account_deletion_requests
6. two_factor_trusted_devices
7. password_reset_tokens (not yet defined - add if needed)

### Tenant-Scoped Tables (7 tables)
1. workspaces
2. tenant_users
3. brand_config
4. invitations
5. tickets
6. ticket_replies
7. ticket_drafts
8. knowledge_base_articles

**Total: 14 core tables** supporting Epics 1, 6, 7, and 9.
