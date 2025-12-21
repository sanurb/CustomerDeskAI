import { keys as auth } from "@CustomerDeskAI/auth/keys";
import { keys as database } from "@CustomerDeskAI/db/keys";
import { keys as email } from "@CustomerDeskAI/email/keys";
import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  extends: [auth(), database(), email()],
  server: {},
  client: {},
  runtimeEnv: process.env,
  clientPrefix: "",
});
