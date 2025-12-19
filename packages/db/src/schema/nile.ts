import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Nile-integrated tenant tables.
 *
 * This module defines the tenant-aware data model required by Nile and
 * the Better Auth organization plugin.
 *
 * IMPORTANT:
 * - Tenant isolation is enforced by Nile using composite primary keys.
 * - No foreign keys are declared at the database level.
 * - Drizzle relations are informational only and used for query ergonomics.
 */

/**
 * Minimal reference to the `tenants` table managed by Nile.
 *
 * WHY:
 * - The tenants table is created and owned by Nile.
 * - We intentionally define a minimal schema here to enable Drizzle relations
 *   without allowing schema generation or migrations to recreate it.
 *
 * This table MUST NOT be altered via Drizzle except through explicit SQL migrations.
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  logo: text("logo"),
  metadata: text("metadata"),
  created: timestamp("created", { withTimezone: true }),
});

/**
 * Maps users to tenants with explicit role assignments.
 *
 * CRITICAL INVARIANT:
 * - The composite primary key (tenant_id, user_id) is REQUIRED by Nile.
 * - Removing or changing this breaks tenant isolation guarantees.
 */
export const tenantUsers = pgTable(
  "tenant_users",
  {
    id: uuid("id").defaultRandom().notNull(),

    /**
     * Logical reference to {@link tenants.id}.
     * No FK is declared to avoid cross-scope constraints.
     */
    tenant_id: uuid("tenant_id").notNull(),

    /**
     * Logical reference to {@link users.id}.
     * UUID is mandatory to match the global user identity model.
     */
    user_id: uuid("user_id").notNull(),

    /**
     * Role list within the tenant context.
     * Stored as TEXT[] to allow flexible role expansion without migrations.
     */
    roles: text("roles").array().notNull().default(["member"]),

    created: timestamp("created", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenant_id, table.user_id] }),

    index("tenant_users_tenant_id_idx").on(table.tenant_id),
    index("tenant_users_user_id_idx").on(table.user_id),

    /**
     * Optimizes the most common access pattern:
     * "Is user X a member of tenant Y?"
     */
    index("tenant_users_tenant_user_idx").on(table.tenant_id, table.user_id),
  ]
);

/**
 * Pending invitations to join a tenant.
 *
 * Invitations are tenant-scoped and intentionally do NOT reference users,
 * since the invited user may not exist yet.
 */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().notNull(),

    /**
     * Tenant to which the invitation belongs.
     */
    tenant_id: uuid("tenant_id").notNull(),

    email: text("email").notNull(),

    roles: text("roles").array().notNull().default(["member"]),

    /**
     * Invitation lifecycle status.
     */
    status: text("status").notNull().default("pending"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    /**
     * Logical reference to {@link users.id}.
     * Stored for auditability (who invited whom).
     */
    inviterId: uuid("inviter_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenant_id, table.id] }),

    index("invitations_tenant_id_idx").on(table.tenant_id),
    index("invitations_email_idx").on(table.email),
  ]
);

/**
 * Drizzle relations for tenant-scoped queries.
 * These do NOT imply database-level constraints.
 */
export const tenantsRelations = relations(tenants, ({ many }) => ({
  members: many(tenantUsers),
  invitations: many(invitations),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenant_id],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.user_id],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenant_id],
    references: [tenants.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));
