import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      RESEND_FROM: z.string().email(),
      RESEND_TOKEN: z.string().startsWith("re_"),
      NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
      BETTER_AUTH_URL: z.string().url().optional(),
    },
    runtimeEnv: {
      RESEND_FROM: process.env.RESEND_FROM,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
      NODE_ENV: process.env.NODE_ENV,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    },
  });
