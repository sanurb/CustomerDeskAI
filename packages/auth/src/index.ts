import { db } from "@CustomerDeskAI/db";
import * as authSchema from "@CustomerDeskAI/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, bearer, multiSession, openAPI } from "better-auth/plugins";
import { nile } from "better-auth-nile";
import { v4 as uuidv4 } from "uuid";

/**
 * Explicit schema object for Better Auth Drizzle adapter
 * Maps Better Auth's expected table names to Drizzle schema exports
 */
const schema = {
  user: authSchema.user,
  session: authSchema.session,
  account: authSchema.account,
  verification: authSchema.verification,
};

export const auth = betterAuth({
  appName: "CustomerDeskAI",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
  experimental: {
    joins: true,
  },
  advanced: {
    generateId: () => uuidv4(),
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  user: {
    fields: {
      image: "picture",
    },
  },
  plugins: [
    nile({}),
    openAPI(),
    bearer(),
    admin(),
    multiSession(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
