import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Better Auth core tables adapted for Nile.
 *
 * IMPORTANT:
 * - UUIDs are used everywhere to match Nile's global user identity model.
 * - No foreign keys are declared at the database level.
 *   See {@link userRelations} for logical relations used by Drizzle only.
 *
 * Rationale:
 * Nile enforces tenant isolation at the platform level. Cross-scope foreign
 * keys (shared ↔ tenant tables) introduce fragility and migration risk.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  picture: text("picture"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),

  /**
   * Optional administrative fields.
   * These are not enforced by Better Auth itself but are required
   * for moderation and enterprise controls.
   */
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),

  /**
   * Cached flag used by Better Auth to short-circuit 2FA checks.
   * Source of truth remains the two_factors table.
   */
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    /**
     * Logical reference to {@link users.id}.
     * No FK is declared to avoid cross-scope constraints.
     */
    userId: uuid("user_id").notNull(),

    /**
     * Active tenant context.
     * Nullable to allow personal / pre-organization sessions.
     */
    activeOrganizationId: uuid("active_organization_id"),

    /**
     * Used by admin impersonation flows.
     * Nullable and intentionally not enforced.
     */
    impersonatedBy: uuid("impersonated_by"),
  },
  (table) => [
    index("sessions_userId_idx").on(table.userId),
    index("sessions_activeOrganizationId_idx").on(table.activeOrganizationId),
  ]
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),

    /**
     * Logical reference to {@link users.id}.
     */
    userId: uuid("user_id").notNull(),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),

    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),

    scope: text("scope"),
    password: text("password"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)]
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)]
);

export const twoFactors = pgTable(
  "two_factors",
  {
    id: uuid("id").primaryKey(),

    /**
     * Encrypted TOTP secret.
     * Indexed for lookup during verification.
     */
    secret: text("secret").notNull(),

    /**
     * Encrypted backup codes.
     * Stored as serialized string by Better Auth.
     */
    backupCodes: text("backup_codes").notNull(),

    /**
     * Logical reference to {@link users.id}.
     *
     * This is intentionally not a FK:
     * - Avoids cross-scope constraints
     * - Keeps migrations deterministic
     */
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("two_factors_secret_idx").on(table.secret),
    index("two_factors_userId_idx").on(table.userId),
  ]
);

/**
 * Drizzle relations are defined for query ergonomics only.
 * They do not imply database-level constraints.
 */
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  twoFactors: many(twoFactors),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const twoFactorsRelations = relations(twoFactors, ({ one }) => ({
  user: one(users, {
    fields: [twoFactors.userId],
    references: [users.id],
  }),
}));
