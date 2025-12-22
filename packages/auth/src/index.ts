import { nile } from "@CustomerDeskAI/better-auth-nile";
import { db } from "@CustomerDeskAI/db/client";
// biome-ignore lint/performance/noNamespaceImport: better-auth expects a namespace import
import * as schema from "@CustomerDeskAI/db/schema";
import { sendOrganizationInvitation } from "@CustomerDeskAI/email/send-invitation";
import { sendEmailVerification } from "@CustomerDeskAI/email/send-verification";
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
import { v4 as uuidv4 } from "uuid";
import { keys } from "../keys";

export const auth = betterAuth({
  appName: "CustomerDeskAI",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [keys().CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
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
    modelName: "sessions",
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
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      console.log("Sending verification email to", user.email);
      const res = await sendEmailVerification({
        user,
        url,
        token: user.id,
      });
      console.log("Verification email sent to", user.email, res);
    },
    sendOnSignUp: true,
  },
  plugins: [
    nile({
      sendInvitationEmail: sendOrganizationInvitation,
    }),
    openAPI(),
    bearer(),
    admin(),
    multiSession(),
    nextCookies(),
    twoFactor(),
  ],
});

export type Session = typeof auth.$Infer.Session;
