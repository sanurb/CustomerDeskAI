import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Nile-integrated tenant tables
 * Maps Better-Auth organization plugin to Nile tenant model
 *
 * CRITICAL: Nile requires composite primary keys that include tenant_id
 * for all tenant-scoped tables. This is how Nile enforces tenant isolation.
 *
 * NOTE: The tenants table already exists in Nile DB and will be ALTERed
 * via migration to add slug, logo, and metadata columns. We define a minimal
 * reference here for Drizzle relations only - not for schema generation.
 */

// Minimal tenants table reference for relations (table already exists in DB)
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  logo: text("logo"),
  metadata: text("metadata"),
  created: timestamp("created", { withTimezone: true }),
});

export const tenantUsers = pgTable(
  "tenant_users",
  {
    id: uuid("id").defaultRandom().notNull(),
    tenant_id: uuid("tenant_id").notNull(), // No FK, index only
    user_id: uuid("user_id").notNull(), // UUID to match users.id, no FK
    roles: text("roles").array().notNull().default(["member"]), // ["owner", "admin", "member"]
    created: timestamp("created", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Composite PK (tenant_id, user_id) required by Nile for tenant-scoped tables
    primaryKey({ columns: [table.tenant_id, table.user_id] }),
    index("tenant_users_tenant_id_idx").on(table.tenant_id),
    index("tenant_users_user_id_idx").on(table.user_id),
    // Composite index for common query pattern: membership lookup by tenant + user
    index("tenant_users_tenant_user_idx").on(table.tenant_id, table.user_id),
  ]
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().notNull(),
    tenant_id: uuid("tenant_id").notNull(), // No FK, index only
    email: text("email").notNull(),
    roles: text("roles").array().notNull().default(["member"]),
    status: text("status").notNull().default("pending"), // "pending" | "accepted" | "rejected" | "canceled"
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: uuid("inviter_id").notNull(), // UUID to match users.id, no FK
  },
  (table) => [
    // Composite PK (tenant_id, id) required by Nile for tenant-scoped tables
    primaryKey({ columns: [table.tenant_id, table.id] }),
    index("invitations_tenant_id_idx").on(table.tenant_id),
    index("invitations_email_idx").on(table.email),
  ]
);

// Relations for Drizzle query API
export const tenantsRelations = relations(tenants, ({ many }) => ({
  members: many(tenantUsers),
  invitations: many(invitations),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenant_id],
    references: [tenants.id],
  }),
  user: one(user, {
    fields: [tenantUsers.user_id],
    references: [user.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenant_id],
    references: [tenants.id],
  }),
  inviter: one(user, {
    fields: [invitations.inviterId],
    references: [user.id],
  }),
}));
