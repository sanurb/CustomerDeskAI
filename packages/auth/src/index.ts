import { db } from "@CustomerDeskAI/db";
import * as authSchema from "@CustomerDeskAI/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  bearer,
  multiSession,
  openAPI,
  twoFactor,
} from "better-auth/plugins";
import { nile } from "better-auth-nile";
import { v4 as uuidv4 } from "uuid";

const schema = authSchema;

export const auth = betterAuth({
  appName: "CustomerDeskAI",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
  experimental: {
    joins: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    database: {
      generateId: () => uuidv4(),
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  user: {
    modelName: "users",
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
    twoFactor(),
  ],
});

export type Session = typeof auth.$Infer.Session;
